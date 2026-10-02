// Plain-English verdict for a Lead Path check: where a visitor's source gets lost.
const CLICK_IDS = { gclid: "Google Ads click ID", gbraid: "Google Ads click ID", wbraid: "Google Ads click ID", msclkid: "Microsoft Ads click ID", fbclid: "Meta click ID", ttclid: "TikTok click ID", li_fat_id: "LinkedIn click ID" };
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

export const STAGES = ["Visit arrives with its source", "Landing page reads it", "Form captures it", "Reaches the CRM"];

export function leadVerdict(d) {
  const c = d.click, cs = (id) => c.checks.find((x) => x.id === id);
  const forms = d.forms || [];
  const fx = (id, status) => forms.find((f) => f.checks.some((x) => x.id === id && (!status || x.status === status)));
  const lostIds = [...new Set(c.dropped.filter((k) => CLICK_IDS[k]).map((k) => CLICK_IDS[k]))];
  const lostUtm = c.dropped.some((k) => k.startsWith("utm_"));
  const crossHost = c.hops.find((h) => host(h.to) !== host(h.url));

  // Stage statuses: ok | bad | warn | unknown
  const s1 = cs("CS7")?.status === "fail" || cs("CS1")?.status === "fail" ? "bad" : cs("CS2")?.status === "fail" ? "warn" : "ok";
  const fromArchive = c.blocked && String(d.pageSource || "").startsWith("archive");
  const s2 = c.blocked ? (fromArchive ? (d.tagsFound ? "ok" : "bad") : "unknown") : cs("CS3")?.status === "fail" ? "bad" : cs("CS4") || cs("CS6") ? "warn" : "ok";
  const s3 = !forms.length ? "unknown" : fx("FX4") || fx("FX2", "fail") ? "bad" : fx("FX2", "warn") || fx("FX1", "warn") ? "warn" : "ok";
  const s4 = s1 === "bad" || s3 === "bad" ? "bad" : "unknown"; // the CRM side can't be seen from outside
  const stages = [s1, s2, s3, s4];

  let headline, cost;
  if (cs("CS7")?.status === "fail") { headline = "Visitors land on a broken page."; cost = "Every campaign, email or social link pointing here wastes the visit before tracking even starts."; }
  else if (cs("CS1")?.status === "fail") {
    const what = lostIds.length ? (lostUtm ? `${lostIds.slice(0, 2).join(" and ")} and UTMs` : lostIds.slice(0, 2).join(" and ")) : "UTM tags";
    headline = `Visitors lose their ${what}${crossHost ? ` on the redirect to ${host(crossHost.to)}` : " in a redirect"}.`;
    cost = `Ads, email, social and partner traffic through this link is reported as Direct or Organic${lostIds.length ? ", and ad platforms can't match conversions to the clicks they paid for" : ""}.`;
  } else if (cs("CS3")?.status === "fail" && !c.blocked) { headline = "Nothing on the landing page records where visitors came from."; cost = "No tag reads the UTMs or click IDs, so this page's traffic and leads can't be credited to any channel."; }
  else if (fx("FX4")) { const f = fx("FX4"); headline = `${f.tool} submissions are invisible to your analytics.`; cost = "Leads made in the embedded form never reach GA4 or ad platforms, so they look like visits that didn't convert."; }
  else if (fx("FX2", "fail")) { const f = fx("FX2", "fail"); headline = `Leads reach the CRM without a source: the ${f.tool === "Custom form" ? "" : f.tool + " "}form doesn't capture it.`; cost = "The visit's channel is known in GA4 but lost at the form, so the CRM can't say which channel produced the lead or the revenue."; }
  else if (fx("FX2", "warn")) { headline = "Sources reach GA4, but may not reach your CRM."; cost = "Attribution travels with the analytics event, not the form, so lead quality by channel only exists in GA4."; }
  else if (!forms.length) { headline = "Visits keep their source. No lead form was found to check."; cost = "Forms built entirely by JavaScript need the browser render (coming next)."; }
  else { headline = "Sources survive from the click to the form."; cost = "UTMs and click IDs arrive, the page reads them and the form keeps them. Confirm the CRM field mapping to close the loop."; }

  return { stages, headline, cost };
}
