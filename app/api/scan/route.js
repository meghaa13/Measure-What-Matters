// POST /api/scan  { input: "example.com" | "GTM-XXXX G-XXXX" }
// URL or tag ID → find IDs → fetch configs from Google → parse as data → rules → summary.
import { NextResponse } from "next/server";
import { describePage, findSite, parseInput } from "../../apps/tag-scanner/engine/discover";
import { fetchContainer } from "../../apps/tag-scanner/engine/parse";
import { mergeFindings, rank, readGtag, readGtm, runRules, score, SCORE_NOTE } from "../../apps/tag-scanner/engine/rules";
import { inferSite } from "../../apps/tag-scanner/engine/sitehint";
import { aiSummary, templateSummary } from "../../apps/tag-scanner/engine/summary";
import { gtagInventory, gtmInventory } from "../../apps/tag-scanner/engine/inventory";
import { coverage } from "../../apps/tag-scanner/engine/coverage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 26;

// Light per-instance rate limit: 8 scans per IP per minute.
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // keep memory bounded on a warm instance
  return list.length > 8;
}

// Finished reports, cached per input for an hour so repeat or viral scans of the
// same site cost nothing.
const results = new Map();
const HOUR = 3_600_000;

export async function POST(req) {
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many scans. Try again in a minute." }, { status: 429 });

  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  const input = parseInput(body.input);
  const cacheKey = input.kind === "url" ? input.host : JSON.stringify(input.ids || null);
  const hit = results.get(cacheKey);
  if (hit && Date.now() - hit.at < HOUR) return NextResponse.json(hit.value);
  if (input.kind === "invalid") return NextResponse.json({ error: "Enter a website address (like example.com) or a tag ID (like GTM-XXXXXXX)." }, { status: 400 });

  // 1. Find IDs
  let site = { source: "pasted", html: "", ids: { gtm: [], ga4: [], ads: [], ua: [] } }, host = "Pasted tag IDs";
  if (input.kind === "ids") {
    for (const id of input.ids) site.ids[id.startsWith("GTM-") ? "gtm" : id.startsWith("G-") ? "ga4" : id.startsWith("AW-") ? "ads" : "ua"].push(id);
  } else {
    host = input.host;
    site = await findSite(input.url);
    if (site.error === "blocked_host") return NextResponse.json({ error: "That address can't be scanned." }, { status: 400 });
    if (site.source === "none") {
      const reason = site.archiveTimeout
        ? "The site blocks automated visits, and archive.org (the fallback) didn't respond in time. This is usually temporary."
        : site.liveBlocked ? "The site blocks automated visits, and no archived copy with tags was found." : "No Google tag or GTM container was found on the homepage.";
      return NextResponse.json({ needIds: true, retry: !!site.archiveTimeout, host, reason });
    }
  }
  const page = { ...describePage(site.html || ""), ids: site.ids };

  // 2–3. Fetch every container live from Google and parse it as data
  const ids = [...site.ids.gtm, ...site.ids.ga4, ...site.ids.ads];
  const first = await Promise.all(ids.map(fetchContainer));
  const gtmContainers = first.filter((c) => c.id.startsWith("GTM-") && c.resource);
  const gtms = gtmContainers.map(readGtm);
  const gtmInv = gtmContainers.map(gtmInventory);
  // GA4 IDs that only appear inside GTM get fetched too.
  const extra = [...new Set([...gtms.flatMap((m) => m.ga4Ids), ...gtmInv.flatMap((m) => m.ga4Ids)])].filter((id) => !ids.includes(id));
  const second = await Promise.all(extra.map(fetchContainer));
  const containers = [...first, ...second];

  // Pasted IDs: a tag ID does not name its website, so look for the site inside the
  // container settings and say so plainly when it is only a guess, or not found.
  let siteGuess = null;
  if (site.source === "pasted") {
    siteGuess = inferSite(containers);
    host = input.ids.join(", "); // show what was pasted, never a guessed site as if it were fact
  }
  // What can honestly be said about the website when only an ID was pasted.
  const mentioned = (siteGuess?.candidates || []).slice(0, 2).map((c) => c.domain);
  const siteNote = site.source !== "pasted" ? undefined
    : mentioned.length
      ? `A tag ID doesn't name its website. This one's settings mention ${mentioned.join(" and ")}, which is a clue, not proof. Scan the site's address to check the page too.`
      : "A tag ID doesn't name its website, and nothing in this one's settings does either. Scan the site's address to see which site it is and check the page too.";
  const gtags = containers.filter((c) => c.id.startsWith("G-") && c.resource).map(readGtag);
  const ga4Inv = gtags.map(gtagInventory);
  const cov = coverage({ page: { ...page, html: site.html || "" }, gtmInv, ga4Inv, scope: site.source === "pasted" ? "none" : "homepage", statuses: containers });

  // 5. Rules
  const findings = rank(mergeFindings(runRules({ gtags, gtms, statuses: containers, page })));
  const total = score(findings);

  const snapshot = {
    source: site.source === "archive" ? `archive.org copy from ${site.archiveDate} (the live site blocks automated visits)` : site.source === "live" ? "Live homepage" : "Tag IDs you pasted",
    gtm: site.ids.gtm, ga4: [...new Set([...site.ids.ga4, ...extra])], ads: site.ids.ads, ua: site.ids.ua,
    otherTools: page.tools,
    consent: page.cmp || (site.source === "pasted" ? "Not checked" : "None detected"),
    consentMode: site.source === "pasted" ? "Not checked" : page.consentDefault ? "Default set on page" : "No default on page (may be set in GTM)",
    serverSide: page.serverSide ? "Detected" : "Not detected",
    containers: containers.map((c) => ({ id: c.id, status: c.status })),
    enhanced: gtags[0]?.enhanced || null,
  };

  // 6. Summary (adds no facts of its own)
  const ctx = { host, snapshot, findings, score: total };
  const summary = (await aiSummary(ctx)) || templateSummary(ctx);

  // Anonymous aggregate for the annual report: rule hits only, no site or IDs.
  console.log(JSON.stringify({ evt: "tag_scan", source: site.source, score: total, rules: findings.map((f) => f.rule) }));

  const value = {
    host, score: total, scoreNote: SCORE_NOTE, snapshot, summary, findings,
    siteNote, siteMentions: site.source === "pasted" ? mentioned : undefined,
    inventory: { gtm: gtmInv, ga4: ga4Inv },
    coverage: site.source === "pasted" ? [] : cov.rows,
  };
  if (results.size > 500) results.clear();
  results.set(cacheKey, { at: Date.now(), value });
  return NextResponse.json(value);
}
