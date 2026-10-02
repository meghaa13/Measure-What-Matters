// Step 1: find tag IDs and the surrounding setup from a page's HTML.
import { safeFetch } from "./fetcher";

const ID_RE = /\b(GTM-[A-Z0-9]{4,10}|G-[A-Z0-9]{6,12}|AW-\d{6,12}|UA-\d{4,10}-\d{1,4})\b/g;

export function parseInput(input) {
  const raw = String(input || "").trim();
  const ids = raw.toUpperCase().match(ID_RE);
  if (ids && ids.join(" ").length >= raw.replace(/[\s,]+/g, " ").trim().length - 2) return { kind: "ids", ids: [...new Set(ids)] };
  let u = raw;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const url = new URL(u);
    if (!url.hostname.includes(".")) throw new Error();
    return { kind: "url", url: url.toString(), host: url.hostname.replace(/^www\./, "") };
  } catch { return { kind: "invalid" }; }
}

export const isChallenge = (r) => !r || /Attention Required! \| Cloudflare|Just a moment\.\.\.|cf-chl-|challenge-platform|captcha-delivery|Access denied \| /i.test(r.text.slice(0, 20000)) || r.status === 403 || r.status === 429 || r.status === 503;

export function extractIds(html) {
  const ids = [...new Set((html.match(ID_RE) || []))];
  return {
    gtm: ids.filter((i) => i.startsWith("GTM-")),
    ga4: ids.filter((i) => i.startsWith("G-")),
    ads: ids.filter((i) => i.startsWith("AW-")),
    ua: ids.filter((i) => i.startsWith("UA-")),
  };
}

const TOOLS = [
  ["Meta Pixel", /connect\.facebook\.net\/[^"']*fbevents|fbq\(\s*['"]init/i],
  ["LinkedIn Insight Tag", /snap\.licdn\.com|_linkedin_partner_id/i],
  ["TikTok Pixel", /analytics\.tiktok\.com/i],
  ["Microsoft Clarity", /clarity\.ms\/tag/i],
  ["Hotjar", /static\.hotjar\.com|hotjar\.com\/c\/hotjar/i],
  ["HubSpot", /js\.hs-scripts\.com|js\.hsforms\.net/i],
  ["Microsoft Ads (UET)", /bat\.bing\.com/i],
  ["Segment", /cdn\.segment\.com/i],
  ["Adobe Launch", /assets\.adobedtm\.com/i],
  ["Matomo", /matomo\.js|piwik\.js/i],
  ["Plausible", /plausible\.io\/js/i],
  ["Calendly", /assets\.calendly\.com|calendly\.com\/[a-z0-9-]+/i],
  ["Intercom", /widget\.intercom\.io/i],
];

const CMPS = [
  ["Cookiebot", /consent\.cookiebot\.com|cookiebot/i],
  ["OneTrust", /cdn\.cookielaw\.org|otSDKStub|onetrust/i],
  ["CookieYes", /cdn-cookieyes\.com|cookieyes/i],
  ["Usercentrics", /usercentrics\.eu|usercentrics/i],
  ["Didomi", /sdk\.privacy-center\.org|didomi/i],
  ["Osano", /cmp\.osano\.com/i],
  ["Termly", /app\.termly\.io/i],
  ["iubenda", /cdn\.iubenda\.com/i],
  ["Complianz", /complianz/i],
  ["Cookie Script", /cookie-script\.com/i],
];

export function describePage(html) {
  const tools = TOOLS.filter(([, re]) => re.test(html)).map(([n]) => n);
  const cmp = (CMPS.find(([, re]) => re.test(html)) || [])[0] || null;
  const consentDefault = /gtag\(\s*['"]consent['"]\s*,\s*['"]default['"]/.test(html);
  // Server-side tagging: gtm.js / gtag.js served from a first-party domain, or a transport URL set.
  const ssMatch = html.match(/src=["'](https?:\/\/[^"'/]+)\/(gtm|gtag\/js)[^"']*/gi) || [];
  const firstPartyLoader = ssMatch.some((s) => !/googletagmanager\.com|google-analytics\.com/i.test(s));
  const serverSide = firstPartyLoader || /server_container_url|transport_url/.test(html);
  const hardcodedGa4 = [...html.matchAll(/gtag\(\s*['"]config['"]\s*,\s*['"](G-[A-Z0-9]+)['"]/g)].map((m) => m[1]);
  const gtagScriptIds = [...html.matchAll(/googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+|AW-\d+)/g)].map((m) => m[1]);
  return { tools, cmp, consentDefault, serverSide, hardcodedGa4: [...new Set([...hardcodedGa4, ...gtagScriptIds.filter((i) => i.startsWith("G-"))])] };
}

const hasIds = (ids) => !!(ids.gtm.length || ids.ga4.length || ids.ads.length || ids.ua.length);

// archive.org is slow and flaky: its availability API sometimes returns nothing.
// Ask two endpoints for both the www and bare host, in parallel, and take the first answer.
async function viaAvailability(u) {
  const r = await safeFetch(`https://archive.org/wayback/available?url=${encodeURIComponent(u)}`, { timeout: 8000, accept: "application/json" });
  const s = JSON.parse(r.text)?.archived_snapshots?.closest;
  if (s?.available && s.timestamp) return { u, ts: s.timestamp };
  throw new Error("none");
}
async function viaCdx(u) {
  const r = await safeFetch(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(u)}&output=json&limit=-5&filter=statuscode:200&fl=timestamp`, { timeout: 8000, accept: "application/json" });
  const rows = JSON.parse(r.text);
  if (Array.isArray(rows) && rows.length > 1) return { u, ts: rows[rows.length - 1][0] };
  throw new Error("none");
}
async function fetchSnapshot(u, ts) {
  // Raw copy (id_) first; some raw snapshots carry a broken content-encoding,
  // so fall back to the normal archive view (which still contains the tag IDs), then retry once.
  const raw = () => safeFetch(`https://web.archive.org/web/${ts}id_/${u}`, { timeout: 7000 });
  const view = () => safeFetch(`https://web.archive.org/web/${ts}/${u}`, { timeout: 7000 });
  return raw().catch(view).catch(raw);
}
async function findArchived(url) {
  const x = new URL(url);
  const alt = new URL(url);
  alt.hostname = x.hostname.startsWith("www.") ? x.hostname.slice(4) : `www.${x.hostname}`;
  const variants = [x.toString(), alt.toString()];
  try {
    const { u, ts } = await Promise.any(variants.flatMap((v) => [viaAvailability(v), viaCdx(v)]));
    const arch = await fetchSnapshot(u, ts);
    const ids = extractIds(arch.text);
    if (hasIds(ids)) return { html: arch.text, ids, archiveDate: `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}` };
  } catch { /* fall through */ }
  // Last resort: "latest copy" redirect, without knowing the timestamp up front.
  try {
    const arch = await safeFetch(`https://web.archive.org/web/2id_/${variants[0]}`, { timeout: 8000 });
    const ids = extractIds(arch.text);
    const ts = (arch.url.match(/\/web\/(\d{8})/) || [])[1];
    if (hasIds(ids)) return { html: arch.text, ids, archiveDate: ts ? `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}` : "latest" };
  } catch { /* none */ }
  return null;
}

// Successful lookups are cached per host for 30 minutes, so repeat scans are consistent.
const CACHE_MS = 30 * 60 * 1000;
const cache = new Map();

// Live HTML first; if blocked or empty, the latest archive.org copy (labelled as such).
export async function findSite(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;
  const remember = (result) => { if (result.source === "live" || result.source === "archive") cache.set(host, { at: Date.now(), result }); return result; };

  let live = null, liveError = null;
  // Start the archive lookup in parallel, so a blocked live site doesn't cost an extra round trip.
  // Capped at 14s: archive.org sometimes stops answering, and the scan must finish inside the function limit.
  const archiveP = Promise.race([findArchived(url), new Promise((r) => setTimeout(() => r("timeout"), 14000))]).catch(() => null);
  try { live = await safeFetch(url); } catch (e) { liveError = e.message; }
  if (liveError === "blocked_host" || liveError === "bad_protocol") return { error: "blocked_host" };
  if (live && !isChallenge(live)) {
    const ids = extractIds(live.text);
    if (hasIds(ids)) return remember({ source: "live", html: live.text, finalUrl: live.url, ids });
  }
  const arch = await archiveP;
  if (arch === "timeout") return { source: "none", archiveTimeout: true, liveBlocked: !!live && isChallenge(live), liveError, html: "" };
  if (arch) return remember({ source: "archive", archiveDate: arch.archiveDate, html: arch.html, finalUrl: url, ids: arch.ids, liveBlocked: !!live && isChallenge(live) });
  return { source: "none", liveBlocked: !!live && isChallenge(live), liveError, html: live && !isChallenge(live) ? live.text : "" };
}
