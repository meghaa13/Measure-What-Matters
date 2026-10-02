// What's NOT tracked: find trackable things on the page, then check the setup for each.
// Status: "tracked" (a matching tag/feature exists), "not_tracked" (nothing in the setup
// could capture it), "unclear" (something might, but it can't be confirmed from outside).

const has = (list, re) => list.some((x) => re.test(x));

export function pageElements(html) {
  const h = html || "";
  const count = (re) => (h.match(re) || []).length;
  return {
    forms: count(/<form\b/gi) + count(/hbspt\.forms\.create|hs-form|wpcf7-form|gform_wrapper|typeform|jotform|marketo|mktoForm/gi),
    tel: count(/href=["']tel:/gi),
    mailto: count(/href=["']mailto:/gi),
    booking: [["Calendly", /calendly\.com/i], ["HubSpot meetings", /meetings\.hubspot\.com/i], ["Cal.com", /cal\.com\//i], ["Acuity", /acuityscheduling/i], ["Chili Piper", /chilipiper/i]].filter(([, re]) => re.test(h)).map(([n]) => n),
    video: [["YouTube", /youtube\.com\/embed|youtube-nocookie/i], ["Vimeo", /player\.vimeo\.com/i], ["Wistia", /wistia/i], ["HTML5 video", /<video\b/i]].filter(([, re]) => re.test(h)).map(([n]) => n),
    downloads: count(/href=["'][^"']+\.(pdf|docx?|xlsx?|pptx?|zip)(\?[^"']*)?["']/gi),
    chat: [["Intercom", /widget\.intercom\.io/i], ["Drift", /js\.driftt\.com/i], ["HubSpot chat", /js\.usemessages\.com/i], ["Zendesk", /static\.zdassets\.com/i], ["Tawk.to", /embed\.tawk\.to/i], ["Crisp", /client\.crisp\.chat/i], ["LiveChat", /cdn\.livechatinc\.com/i], ["Ada", /ada\.support/i]].filter(([, re]) => re.test(h)).map(([n]) => n),
    search: /<input[^>]+type=["']search["']|name=["'](q|s|search|query)["']/i.test(h),
  };
}

export function coverage({ page, gtmInv, ga4Inv, scope, statuses = [] }) {
  const els = pageElements(page.html);
  const tags = gtmInv.flatMap((m) => m.tags);
  const triggers = tags.flatMap((t) => t.fires);
  // Events from GTM (dataLayer + GA4 event tags) and events created inside GA4.
  const events = [...gtmInv.flatMap((m) => m.dlEvents), ...tags.filter((t) => t.fn === "__gaawe").map((t) => t.what), ...ga4Inv.flatMap((g) => g.created.map((x) => x.name))];
  const enhanced = new Set(ga4Inv.flatMap((g) => g.enhanced));
  const anyGa4 = ga4Inv.length > 0 || tags.some((t) => /GA4/.test(t.type));
  const rows = [];
  const add = (item, found, status, how) => rows.push({ item, found, status, how });
  const onHome = scope === "homepage" ? "on the homepage" : "on the page";

  // Page views
  if (anyGa4) add("Page views", "Every page", enhanced.has("page views") || tags.some((t) => t.fn === "__googtag") ? "tracked" : "unclear", "Google tag sends page_view on load.");

  // Forms
  const formTracking = has(events, /form|submit|lead|contact|enquir|inquir|demo|quote|signup|sign_up|register/i) || has(triggers, /Form submissions/);
  if (els.forms || formTracking) add("Form submissions", els.forms ? `${els.forms} form${els.forms > 1 ? "s" : ""} ${onHome}` : "Not on this page",
    formTracking ? "tracked" : enhanced.has("form interactions") ? "unclear" : "not_tracked",
    formTracking ? `Events: ${events.filter((e) => /form|submit|lead|contact|enquir|inquir|demo|quote|signup|sign_up|register/i.test(e)).slice(0, 4).join(", ") || "form submit trigger"}.`
      : enhanced.has("form interactions") ? "Only GA4's automatic form_submit, which fires on any submit attempt and can't tell success from failure." : "No form event or form trigger in the setup.");

  // Phone / email links
  const telTracked = has(triggers, /tel:|phone|call/i) || has(events, /phone|call|tel_|click_to_call/i);
  const mailTracked = has(triggers, /mailto|email/i) || has(events, /email|mailto/i);
  if (els.tel) add("Phone links", `${els.tel} tel: link${els.tel > 1 ? "s" : ""}`, telTracked ? "tracked" : "not_tracked", telTracked ? "A click trigger or event covers phone links." : "No trigger or event for tel: clicks. GA4 outbound-click tracking doesn't cover them.");
  if (els.mailto) add("Email links", `${els.mailto} mailto: link${els.mailto > 1 ? "s" : ""}`, mailTracked ? "tracked" : "not_tracked", mailTracked ? "A click trigger or event covers email links." : "No trigger or event for mailto: clicks.");

  // Booking widgets
  for (const b of els.booking) {
    const t = has(events, /book|schedule|meeting|calendly|appointment/i) || has(triggers, /calendly|book|schedul|meeting/i);
    add(`${b} bookings`, `${b} embed or link`, t ? "tracked" : "not_tracked", t ? "A booking event exists in the setup." : "Booked meetings aren't sent to analytics, so they can't be credited to a channel.");
  }

  // Video
  for (const v of els.video) {
    const auto = v === "YouTube" && enhanced.has("YouTube video");
    const t = auto || has(events, /video/i) || has(triggers, /YouTube video/);
    add(/video/i.test(v) ? v : `${v} video`, `${v} player ${onHome}`, t ? "tracked" : v === "YouTube" ? "not_tracked" : "not_tracked", t ? (auto ? "GA4 enhanced measurement tracks YouTube embeds." : "A video event exists.") : v === "YouTube" ? "Video engagement isn't tracked." : `GA4 can't track ${v} automatically; it needs a listener.`);
  }

  // Downloads
  if (els.downloads) {
    const t = enhanced.has("file downloads") || has(events, /download/i);
    add("File downloads", `${els.downloads} file link${els.downloads > 1 ? "s" : ""}`, t ? "tracked" : "not_tracked", t ? "GA4 file_download or a download event." : "No download tracking.");
  }

  // Outbound links
  if (anyGa4) add("Outbound link clicks", "Links to other sites", enhanced.has("outbound clicks") || has(events, /outbound/i) ? "tracked" : "not_tracked", enhanced.has("outbound clicks") ? "GA4 enhanced measurement." : "Outbound clicks are off in enhanced measurement.");

  // Scroll
  if (anyGa4) {
    const custom = has(events, /scroll/i) || has(triggers, /Scroll depth/);
    add("Scroll depth", "Every page", custom ? "tracked" : enhanced.has("scrolls (90%)") ? "tracked" : "not_tracked", custom ? "Custom scroll-depth events." : enhanced.has("scrolls (90%)") ? "GA4's automatic scroll event, which only fires at 90%." : "No scroll tracking.");
  }

  // Chat widgets
  for (const c of els.chat) {
    const t = has(events, /chat|conversation|message/i);
    add(`${c} chat`, `${c} widget`, t ? "tracked" : "unclear", t ? "A chat event exists." : "Some chat tools send their own events; nothing in the tag setup does.");
  }

  // Site search
  if (els.search) {
    const t = ga4Inv.some((g) => g.siteSearchParams) || has(events, /search/i);
    add("Site search", "Search box", t ? "tracked" : "not_tracked", t ? `Search parameters: ${ga4Inv.map((g) => g.siteSearchParams).filter(Boolean)[0] || "search event"}.` : "Searches aren't tracked.");
  }

  // Ads conversions
  const adsConv = tags.filter((t) => t.fn === "__awct");
  const deadAds = page.ids.ads.filter((id) => statuses.some((s) => s.id === id && s.status === 404));
  if (adsConv.length || page.ids.ads.length) add("Google Ads conversions", `${adsConv.length || page.ids.ads.length} configured`,
    adsConv.length ? "tracked" : deadAds.length === page.ids.ads.length ? "not_tracked" : "unclear",
    adsConv.length ? `${adsConv.length} conversion tag${adsConv.length > 1 ? "s" : ""}${tags.some((t) => t.enhanced) ? ", with enhanced conversions" : ""}.`
      : deadAds.length === page.ids.ads.length ? `${deadAds.join(", ")} returns 404, so nothing reaches Google Ads.` : "An Ads ID is on the page; its conversions are set up outside GTM, so they can't be listed from here.");

  return { rows, elements: els };
}
