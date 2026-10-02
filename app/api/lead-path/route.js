// POST /api/lead-path
//   { mode: "single", url }        → Click Survival + Form X-Ray (homepage + up to 9 lead pages)
//   { mode: "bulk", urls: [...] }  → Click Survival only, up to 8 URLs per call (the client batches)
import { NextResponse } from "next/server";
import { parseInput, extractIds, findSite } from "../../apps/tag-scanner/engine/discover";
import { safeFetch } from "../../apps/tag-scanner/engine/fetcher";
import { fetchContainer } from "../../apps/tag-scanner/engine/parse";
import { gtmInventory } from "../../apps/tag-scanner/engine/inventory";
import { clickSurvival } from "../../apps/lead-path/engine/click";
import { findForms, formChecks, leadPages, HIDDEN_FIELD_SNIPPET } from "../../apps/lead-path/engine/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 26;

const hits = new Map();
function limited(ip, cost) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  for (let i = 0; i < cost; i++) list.push(now);
  hits.set(ip, list);
  return list.length > 60;
}

const FORM_EVENT = /form|submit|lead|contact|enquir|inquir|demo|quote|signup|sign_up|register|book/i;
const lean = (r) => { const { html, headers, ...rest } = r; return rest; };

export async function POST(req) {
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  let body = {};
  try { body = await req.json(); } catch { /* empty */ }

  if (body.mode === "bulk") {
    const urls = (Array.isArray(body.urls) ? body.urls : []).slice(0, 8).map((u) => parseInput(u)).filter((p) => p.kind === "url").map((p) => p.url);
    if (limited(ip, urls.length)) return NextResponse.json({ error: "Too many checks. Wait a minute and continue." }, { status: 429 });
    const results = await Promise.all(urls.map((u) => clickSurvival(u).then(lean)));
    return NextResponse.json({ results });
  }

  const input = parseInput(body.url);
  if (input.kind !== "url") return NextResponse.json({ error: "Enter a landing page address, like example.com/landing." }, { status: 400 });
  if (limited(ip, 5)) return NextResponse.json({ error: "Too many checks. Try again in a minute." }, { status: 429 });

  // 1. Click Survival on the URL as given
  const click = await clickSurvival(input.url);
  if (click.error) return NextResponse.json({ error: click.error }, { status: 400 });

  // If bot protection blocked the live page, read the page from archive.org instead
  // (the redirect results stay live). Labelled in the report.
  let pageHtml = click.html, pageSource = "live";
  if (click.blocked) {
    const bareUrl = (() => { const u = new URL(click.landedUrl); u.search = ""; u.hash = ""; return u.toString(); })();
    const arch = await findSite(bareUrl).catch(() => null);
    if (arch?.source === "archive") { pageHtml = arch.html; pageSource = `archive.org copy from ${arch.archiveDate}`; }
    else pageSource = "blocked";
  }

  // 2. Tag setup on the landing page (what can see a form submission)
  const ids = extractIds(pageHtml);
  const containers = await Promise.all(ids.gtm.slice(0, 2).map(fetchContainer));
  const inv = containers.filter((c) => c.resource).map(gtmInventory);
  const tracking = [...new Set([
    ...inv.flatMap((m) => m.dlEvents).filter((e) => FORM_EVENT.test(e)),
    ...inv.flatMap((m) => m.tags).filter((t) => t.fn === "__gaawe" && FORM_EVENT.test(t.what)).map((t) => t.what),
    ...inv.flatMap((m) => m.tags).flatMap((t) => t.fires).filter((f) => /Form submissions/.test(f)).map(() => "GTM form submit trigger"),
  ])];
  // Attribution parameters sent with form events (captured in JS rather than hidden fields)
  const attrInTags = [...new Set(inv.flatMap((m) => m.tags).filter((t) => t.fn === "__gaawe" && FORM_EVENT.test(t.what))
    .flatMap((t) => t.params).filter((p) => /utm|gclid|gbraid|wbraid|msclkid|fbclid|source|first_touch|landing|campaign|referr/i.test(p)))];

  // 3. Form X-Ray: landing page + lead pages
  const clean = (u) => { const x = new URL(u); x.search = ""; x.hash = ""; return x.toString(); };
  const pages = [{ url: clean(click.landedUrl), html: pageHtml }];
  const more = pageSource === "live" ? leadPages(pageHtml, click.landedUrl, 10) : []; // archive copies: landing page only
  const fetched = await Promise.all(more.map((u) => safeFetch(u, { timeout: 6000 }).then((r) => ({ url: r.url, html: r.text })).catch(() => null)));
  pages.push(...fetched.filter(Boolean).map((p) => ({ ...p, url: clean(p.url) })));
  // Same form repeated on a page (or across pages) is reported once, listing every page it appears on.
  const byKey = new Map();
  for (const p of pages) for (const f of findForms(p.html)) {
    const key = [f.tool, f.id || "", f.fields, f.method, (f.hidden || []).join(",")].join("|");
    if (byKey.has(key)) { const e = byKey.get(key); if (!e.pages.includes(p.url)) e.pages.push(p.url); continue; }
    byKey.set(key, { ...formChecks(f, { tracking, utmSurvives: click.utmSurvives, attrInTags }), page: p.url, pages: [p.url] });
  }
  const forms = [...byKey.values()];

  console.log(JSON.stringify({ evt: "lead_path", forms: forms.length, cs: click.checks.filter((c) => c.status === "fail").map((c) => c.id), fx: [...new Set(forms.flatMap((f) => f.checks.filter((c) => c.status === "fail").map((c) => c.id)))] }));

  return NextResponse.json({
    host: new URL(click.landedUrl).hostname,
    click: lean(click),
    tracking, pagesChecked: pages.map((p) => p.url), pageSource, tagsFound: !!(ids.gtm.length || ids.ga4.length || ids.ads.length),
    // Link with test UTMs for checking the CRM step by hand
    crmTestUrl: (() => { const u = new URL(click.landedUrl); u.search = ""; u.hash = ""; for (const [k, v] of Object.entries({ utm_source: "lead_path_test", utm_medium: "test", utm_campaign: "crm_check" })) u.searchParams.set(k, v); return u.toString(); })(),
    forms, snippet: forms.some((f) => f.checks.some((c) => c.id === "FX2" && c.status === "fail")) ? HIDDEN_FIELD_SNIPPET : null,
  });
}
