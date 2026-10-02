// Click Survival: does a paid click reach the landing page with its click IDs and UTMs intact?
// Google Ads Search uses parallel tracking, so tracking templates run in the background;
// only redirects on the final URL (+ final URL suffix) matter. That is exactly what is tested.
// Test values are clearly fake, and only the site's own redirects are followed.
import { safeFetch } from "../../tag-scanner/engine/fetcher";
import { extractIds, isChallenge } from "../../tag-scanner/engine/discover";

export const TEST_PARAMS = {
  gclid: "XRAY_TEST_gclid", gbraid: "XRAY_TEST_gbraid", wbraid: "XRAY_TEST_wbraid", gad_source: "1",
  msclkid: "XRAY_TEST_msclkid", fbclid: "XRAY_TEST_fbclid", ttclid: "XRAY_TEST_ttclid", li_fat_id: "XRAY_TEST_li",
  utm_source: "xray_test", utm_medium: "cpc", utm_campaign: "xray_test", utm_content: "xray_test", utm_term: "xray_test",
};
const PLATFORM = { gclid: "Google Ads", gbraid: "Google Ads (iOS app/web)", wbraid: "Google Ads (iOS web)", gad_source: "Google Ads",
  msclkid: "Microsoft Ads", fbclid: "Meta Ads", ttclid: "TikTok Ads", li_fat_id: "LinkedIn Ads" };

const norm = (u) => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/+$/, "")).toLowerCase(); } catch { return u; } };

export async function clickSurvival(finalUrl) {
  const start = new URL(finalUrl);
  for (const [k, v] of Object.entries(TEST_PARAMS)) start.searchParams.set(k, v);
  let res;
  try { res = await safeFetch(start.toString(), { redirects: 8, timeout: 8000 }); }
  catch (e) { return { url: finalUrl, error: e.message === "blocked_host" ? "That address can't be checked." : "The page didn't respond." }; }

  const landed = new URL(res.url);
  const kept = Object.keys(TEST_PARAMS).filter((k) => landed.searchParams.get(k) === TEST_PARAMS[k]);
  const dropped = Object.keys(TEST_PARAMS).filter((k) => !kept.includes(k));
  const html = res.text || "";
  const head = html.slice(0, 200000);
  const checks = [];
  const add = (id, status, conf, title, detail, fix) => checks.push({ id, status, conf, title, detail, fix });
  // Bot protection (Cloudflare etc.) served a challenge instead of the page: redirects are real, page checks aren't.
  const blocked = isChallenge(res);

  // CS1 parameters dropped by redirects
  if (dropped.length) {
    const clickIds = dropped.filter((k) => PLATFORM[k]);
    const utms = dropped.filter((k) => k.startsWith("utm_"));
    add("CS1", "fail", "Confirmed", `${dropped.length} tracking parameter${dropped.length > 1 ? "s" : ""} lost in redirects`,
      `${clickIds.length ? `Click IDs lost: ${clickIds.map((k) => `${k} (${PLATFORM[k]})`).join(", ")}. Without them the platform can't match the conversion to the click. ` : ""}${utms.length ? `UTMs lost: ${utms.join(", ")}, so GA4 can't attribute the visit to the campaign.` : ""}`,
      `Make every redirect on this path preserve the full query string (e.g. in Nginx: return 301 https://$host$request_uri;). Or point the ad straight at the final URL: ${res.url.split("?")[0]}`);
  } else add("CS1", "pass", "Confirmed", "All click IDs and UTMs survive", "Every test parameter arrived on the landing page unchanged.", null);

  // CS2 long redirect chains
  if (res.hops.length > 2) add("CS2", "fail", "Confirmed", `${res.hops.length} redirects before the page loads`,
    "Each hop adds latency on mobile and is another place parameters can be dropped.", `Use ${res.url.split("?")[0]} as the final URL in the ad, so it loads with no redirects.`);
  else add("CS2", res.hops.length ? "warn" : "pass", "Confirmed", res.hops.length ? `${res.hops.length} redirect${res.hops.length > 1 ? "s" : ""}` : "No redirects", res.hops.length ? "Short chain. Using the final address directly removes it completely." : "The final URL loads directly.", null);

  // CS7 the landing page itself
  if (blocked) add("CS7", "warn", "Verify", "The site blocked the automated check", "Bot protection answered instead of the page, so the landing page and its tags couldn't be read. The redirect results above are still real.", null);
  else {
  const title = (head.match(/<title[^>]*>([^<]*)/i) || [])[1]?.trim() || "";
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(head) || /noindex/i.test(res.headers.get("x-robots-tag") || "");
  const canon = (head.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i) || head.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical/i) || [])[1];
  const canonOff = canon && norm(new URL(canon, res.url).toString()) !== norm(res.url);
  if (res.status >= 400) add("CS7", "fail", "Confirmed", `Landing page returns ${res.status}`, "Paid clicks land on an error page.", "Fix the page or change the ad's final URL.");
  else if (/not found|404|page doesn.t exist|no longer available/i.test(title)) add("CS7", "fail", "Confirmed", "Soft 404", `The page loads with status ${res.status} but its title reads "${title}".`, "Point the ad at a live page.");
  else if (noindex || canonOff) add("CS7", "warn", "Confirmed", noindex ? "Landing page is set to noindex" : "Canonical points to a different page",
    noindex ? "Fine for a dedicated paid landing page, but make sure it's intentional." : `The canonical is ${canon}, so search engines treat this as a duplicate.`, null);
  else add("CS7", "pass", "Confirmed", `Landing page loads (${res.status})`, title ? `“${title}”` : "", null);
  }

  // CS6 client-side redirects (raw HTML only; confirmed in phase 2 with a browser render)
  const meta = head.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'>]+)/i);
  const jsRedirect = /(?:window\.)?location(?:\.href)?\s*=\s*["'`]https?:\/\//i.test(head) || /location\.replace\(\s*["'`]https?:/i.test(head);
  if (meta || jsRedirect) add("CS6", "warn", "Verify", meta ? "Meta-refresh redirect on the landing page" : "JavaScript redirect on the landing page",
    "Client-side redirects often drop the query string, and country-based redirects send some clicks elsewhere. Does this one keep the parameters?", "Replace it with a server-side 301 that preserves the query string.");

  // CS3 tags on the landing page (cheap check; the full decode is in the Tag Health Scan)
  const ids = extractIds(html);
  if (!blocked) {
  const tagged = ids.gtm.length || ids.ga4.length || ids.ads.length;
  add("CS3", tagged ? "pass" : "fail", tagged ? "Confirmed" : "Likely", tagged ? "Google tag found" : "No Google tag in the page source",
    tagged ? [...ids.gtm, ...ids.ga4, ...ids.ads].join(", ") : "No Google tag or GTM ID appears in the page source. If tags are injected by a script bundle, the browser render (phase 2) will confirm it; otherwise nothing can read the click ID, so conversions can't be tied back to the ad.",
    tagged ? null : "Install the Google tag (or GTM with a Conversion Linker) on every landing page.");
  }

  // CS4 consent denied by default without url_passthrough
  const deniedDefault = /gtag\(\s*['"]consent['"]\s*,\s*['"]default['"][\s\S]{0,400}?['"]denied['"]/.test(head);
  const passthrough = /url_passthrough['"]?\s*[:,]\s*true/.test(head) || /url_passthrough/.test(head);
  if (deniedDefault && !passthrough) add("CS4", "warn", "Likely", "Consent defaults to denied, without URL passthrough",
    "When a visitor hasn't consented, the click ID can't be stored in a cookie. Without url_passthrough it's lost as soon as they move to another page, so EEA conversions on later pages go unattributed.",
    "Add gtag('set', 'url_passthrough', true) (or tick it on the Conversion Linker / Google tag in GTM).");

  // CS5 the journey leaves the domain
  const host = landed.hostname.replace(/^www\./, "");
  const offsite = [...new Set([...head.matchAll(/href=["'](https?:\/\/([^/"']+)[^"']*)/gi)].map((m) => m[2].replace(/^www\./, "").toLowerCase())
    .filter((h) => h !== host && !h.endsWith(`.${host}`) && /calendly|hubspot|meetings|checkout|shopify|stripe|typeform|jotform|chilipiper|cal\.com|acuity|paypal|gumroad/i.test(h)))];
  const linker = /linker|cross[_-]?domain|"domains"\s*:/i.test(head);
  if (offsite.length && !linker) add("CS5", "warn", "Likely", "The journey moves to another domain", `Visitors are sent to ${offsite.slice(0, 4).join(", ")}. Without cross-domain linking, the conversion there starts a new session with no campaign.`,
    "Add those domains to cross-domain linking in the GA4 Google tag settings, or track the conversion with a callback on your own domain.");

  return {
    url: finalUrl, tested: start.toString(), landedUrl: res.url, status: res.status,
    hops: res.hops, kept, dropped, checks,
    pass: !checks.some((c) => c.status === "fail"), blocked,
    utmSurvives: !dropped.some((k) => k.startsWith("utm_")),
    html, headers: res.headers,
  };
}
