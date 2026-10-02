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

// Live HTML first; if blocked or empty, the latest archive.org copy (labelled as such).
export async function findSite(url) {
  let live = null, liveError = null;
  // Ask archive.org in parallel, so a blocked live site doesn't cost an extra round trip.
  const availP = safeFetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`, { accept: "application/json" }).catch(() => null);
  try { live = await safeFetch(url); } catch (e) { liveError = e.message; }
  if (liveError === "blocked_host" || liveError === "bad_protocol") return { error: "blocked_host" };
  if (live && !isChallenge(live)) {
    const ids = extractIds(live.text);
    if (ids.gtm.length || ids.ga4.length || ids.ads.length || ids.ua.length) return { source: "live", html: live.text, finalUrl: live.url, ids };
  }
  // archive.org fallback (availability was requested in parallel above)
  try {
    const avail = await availP;
    if (!avail) throw new Error("no_archive");
    const snap = JSON.parse(avail.text)?.archived_snapshots?.closest;
    if (snap?.available && snap.timestamp) {
      // Raw copy (id_) first; some raw snapshots carry a broken content-encoding,
      // so fall back to the normal archive view, which still contains the tag IDs.
      const arch = await safeFetch(`https://web.archive.org/web/${snap.timestamp}id_/${url}`, { timeout: 6000 })
        .catch(() => safeFetch(`https://web.archive.org/web/${snap.timestamp}/${url}`, { timeout: 6000 }));
      const ids = extractIds(arch.text);
      const t = snap.timestamp;
      if (!(ids.gtm.length || ids.ga4.length || ids.ads.length || ids.ua.length)) throw new Error("no_ids_in_archive");
      return { source: "archive", archiveDate: `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`, html: arch.text, finalUrl: url, ids, liveBlocked: !!live && isChallenge(live) };
    }
  } catch { /* fall through */ }
  return { source: "none", liveBlocked: !!live && isChallenge(live), liveError, html: live && !isChallenge(live) ? live.text : "" };
}
