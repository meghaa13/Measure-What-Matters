// POST /api/scan  { input: "example.com" | "GTM-XXXX G-XXXX" }
// URL or tag ID → find IDs → fetch configs from Google → parse as data → rules → summary.
import { NextResponse } from "next/server";
import { describePage, findSite, parseInput } from "../../apps/tag-scanner/engine/discover";
import { fetchContainer } from "../../apps/tag-scanner/engine/parse";
import { mergeFindings, rank, readGtag, readGtm, runRules, score, SCORE_NOTE } from "../../apps/tag-scanner/engine/rules";
import { aiSummary, templateSummary } from "../../apps/tag-scanner/engine/summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 26;

// Light per-instance rate limit: 8 scans per IP per minute.
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  return list.length > 8;
}

export async function POST(req) {
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many scans. Try again in a minute." }, { status: 429 });

  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  const input = parseInput(body.input);
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
      return NextResponse.json({ needIds: true, host, reason: site.liveBlocked ? "The site blocks automated visits, and no archived copy with tags was found." : "No Google tag or GTM container was found on the homepage." });
    }
  }
  const page = { ...describePage(site.html || ""), ids: site.ids };

  // 2–3. Fetch every container live from Google and parse it as data
  const ids = [...site.ids.gtm, ...site.ids.ga4, ...site.ids.ads];
  const first = await Promise.all(ids.map(fetchContainer));
  const gtms = first.filter((c) => c.id.startsWith("GTM-") && c.resource).map(readGtm);
  // GA4 IDs that only appear inside GTM get fetched too.
  const extra = [...new Set(gtms.flatMap((m) => m.ga4Ids))].filter((id) => !ids.includes(id));
  const second = await Promise.all(extra.map(fetchContainer));
  const containers = [...first, ...second];
  const gtags = containers.filter((c) => c.id.startsWith("G-") && c.resource).map(readGtag);

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

  return NextResponse.json({ host, score: total, scoreNote: SCORE_NOTE, snapshot, summary, findings });
}
