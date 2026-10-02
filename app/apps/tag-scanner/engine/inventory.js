// The tracking inventory: what a site actually tracks, in plain language.
// Turns GTM's encoded tags / triggers / variables and the GA4 property settings
// into readable rows. This is the core of the report; findings sit on top of it.
import { listOf, mapOf } from "./parse";

// ── GTM variables ("macros")
const URL_PART = { URL: "Page URL", HOST: "Page hostname", PATH: "Page path", QUERY: "Query string", FRAGMENT: "URL fragment", PROTOCOL: "Page protocol" };
const AEV = { TEXT: "Click / element text", URL: "Click URL", ID: "Element ID", CLASSES: "Element classes", ELEMENT: "Clicked element", ATTRIBUTE: "Element attribute", TARGET: "Element target" };
const BUILTIN_DL = { "gtm.element": "Clicked element", "gtm.elementClasses": "Click classes", "gtm.elementId": "Click ID", "gtm.elementTarget": "Click target", "gtm.elementUrl": "Click URL", "gtm.newUrlFragment": "New URL fragment" };

export function makeResolver(macros = []) {
  const seen = new Set();
  const name = (ref) => {
    if (!Array.isArray(ref)) return ref == null ? "" : String(ref);
    if (ref[0] === "macro") {
      const m = macros[ref[1]];
      if (!m || seen.has(ref[1])) return "{{variable}}";
      seen.add(ref[1]);
      try { return describeMacro(m, name); } finally { seen.delete(ref[1]); }
    }
    if (ref[0] === "template") return ref.slice(1).map((p) => (Array.isArray(p) ? `{{${name(p)}}}` : p)).join("");
    if (ref[0] === "escape") return name(ref[1]);
    if (ref[0] === "list") return ref.slice(1).map(name).join(", ");
    return "";
  };
  // Constant value if the reference resolves to a literal, else null.
  const constant = (ref) => {
    if (typeof ref === "string") return ref;
    if (Array.isArray(ref) && ref[0] === "macro") { const m = macros[ref[1]]; if (m?.function === "__c") return String(m.vtp_value ?? ""); }
    return null;
  };
  return { name, constant };
}

function describeMacro(m, name) {
  switch (m.function) {
    case "__e": return "Event";
    case "__c": return String(m.vtp_value ?? "");
    case "__v": return BUILTIN_DL[m.vtp_name] || `dataLayer.${m.vtp_name}`;
    case "__u": return URL_PART[m.vtp_component || "URL"] || "Page URL";
    case "__f": return "Referrer";
    case "__aev": return AEV[m.vtp_varType] || "Auto-event variable";
    case "__jsm": return "Custom JavaScript";
    case "__j": return `JS variable ${m.vtp_name || ""}`.trim();
    case "__k": return `Cookie ${m.vtp_name || ""}`.trim();
    case "__d": return "DOM element";
    case "__smm": case "__remm": return `Lookup table on ${name(m.vtp_input)}`;
    case "__awec": return "User-provided data (enhanced conversions)";
    case "__analytics_storage": return `GA4 ${m.vtp_dataField || "storage"}`;
    case "__gas": return "GA settings";
    case "__r": return "Random number";
    case "__ctv": return "Container version";
    case "__dbg": return "Debug mode";
    default: return m.function.replace(/^__/, "");
  }
}

// ── GTM triggers
const GTM_EVENTS = {
  "gtm.js": "All pages (page load)", "gtm.init": "Initialization", "gtm.init_consent": "Consent initialization",
  "gtm.dom": "DOM ready", "gtm.load": "Window loaded", "gtm.click": "All element clicks", "gtm.linkClick": "Link clicks",
  "gtm.formSubmit": "Form submissions", "gtm.historyChange": "History change (SPA navigation)", "gtm.historyChange-v2": "History change (SPA navigation)",
  "gtm.scrollDepth": "Scroll depth", "gtm.video": "YouTube video", "gtm.timer": "Timer", "gtm.elementVisibility": "Element visibility",
};
const OPS = { _eq: "equals", _re: "matches", _cn: "contains", _sw: "starts with", _ew: "ends with", _css: "matches CSS selector", _lt: "<", _le: "≤", _gt: ">", _ge: "≥" };

function describePredicate(p, r) {
  const subject = r.name(p.arg0);
  const neg = p.any === false || p.negate ? "not " : "";
  if (subject === "Event" && p.function === "_eq") return GTM_EVENTS[p.arg1] || `Custom event "${p.arg1}"`;
  if (subject === "Event" && p.function === "_re") return `Custom events matching ${p.arg1}`;
  return `${subject} ${neg}${OPS[p.function] || p.function} "${p.arg1}"`;
}

// ── GTM tag types
const TAG_TYPES = {
  __googtag: "Google tag", __gaawc: "GA4 configuration", __gaawe: "GA4 event", __ua: "Universal Analytics",
  __awct: "Google Ads conversion", __awud: "Google Ads enhanced conversions data", __sp: "Google Ads remarketing", __gclidw: "Conversion Linker",
  __flc: "Floodlight counter", __fls: "Floodlight sales", __html: "Custom HTML", __img: "Custom image",
  __bzi: "LinkedIn Insight", __baut: "Microsoft Ads UET", __hjtc: "Hotjar", __pntr: "Pinterest", __twitter_website_tag: "X (Twitter) pixel",
  __fsl: "Form submit listener", __cl: "Click listener", __lcl: "Link click listener", __sdl: "Scroll listener", __ytl: "YouTube listener", __evl: "Visibility listener", __tl: "Timer listener", __hl: "History listener",
};
const VENDOR_HINTS = [
  [/fbq\(|facebook/i, "Meta Pixel"], [/ttq\.|tiktok/i, "TikTok Pixel"], [/lintrk|_linkedin|licdn/i, "LinkedIn Insight"],
  [/clarity/i, "Microsoft Clarity"], [/hotjar|hj\(/i, "Hotjar"], [/uetq|bat\.bing/i, "Microsoft Ads UET"], [/hs-scripts|hubspot|_hsq/i, "HubSpot"],
  [/twq\(|static\.ads-twitter/i, "X (Twitter) pixel"], [/pintrk/i, "Pinterest"], [/rdt\(|reddit/i, "Reddit Pixel"], [/snaptr/i, "Snap Pixel"],
  [/cookiebot|onetrust|cookieyes|usercentrics|didomi|iubenda|termly|osano/i, "Consent platform"], [/clearbit/i, "Clearbit"], [/intercom/i, "Intercom"],
];

function tagLabel(t, firesOn) {
  // GTM swaps a paused tag's type for "__paused"; the original type is sometimes kept.
  if (t.function === "__paused") {
    const orig = t.vtp_originalTagType && (TAG_TYPES[`__${t.vtp_originalTagType}`] || t.vtp_originalTagType);
    return orig ? `Paused · ${orig}` : "Paused tag";
  }
  if (TAG_TYPES[t.function]) return TAG_TYPES[t.function];
  const blob = JSON.stringify(t);
  if (/^__cvt_/.test(t.function)) {
    // Clarity's template takes a 10-character lowercase project ID.
    if (typeof t.vtp_projectId === "string" && /^[a-z0-9]{10}$/.test(t.vtp_projectId)) return "Microsoft Clarity (template)";
    if (firesOn.some((f) => /Consent initialization/.test(f))) return "Consent Mode setup (template)";
  }
  if (t.function === "__html" || /^__cvt_/.test(t.function)) {
    const v = VENDOR_HINTS.find(([re]) => re.test(blob));
    if (v) return `${v[1]} (${t.function === "__html" ? "custom HTML" : "template"})`;
    return t.function === "__html" ? "Custom HTML" : "Community template";
  }
  return t.function.replace(/^__/, "");
}

export function gtmInventory(c) {
  const res = c.resource || {};
  const tags = res.tags || [], macros = res.macros || [], preds = res.predicates || [], rules = res.rules || [];
  const r = makeResolver(macros);

  // tag index -> list of trigger descriptions (each = AND of predicates; list = OR)
  const fires = new Map(), blocks = new Map();
  for (const rule of rules) {
    const ifs = rule.filter((x) => x[0] === "if").flatMap((x) => x.slice(1)).map((i) => preds[i]).filter(Boolean);
    const unless = rule.filter((x) => x[0] === "unless").flatMap((x) => x.slice(1)).map((i) => preds[i]).filter(Boolean);
    const text = [...ifs.map((p) => describePredicate(p, r)), ...unless.map((p) => `not when ${describePredicate(p, r)}`)].join(" AND ");
    for (const a of rule.filter((x) => x[0] === "add").flatMap((x) => x.slice(1))) fires.set(a, [...(fires.get(a) || []), text]);
    for (const b of rule.filter((x) => x[0] === "block").flatMap((x) => x.slice(1))) blocks.set(b, [...(blocks.get(b) || []), text]);
  }

  // Event names a tag can send: a literal, or {{Event}} narrowed by its triggers.
  const triggerEvents = (i) => {
    const names = [];
    for (const rule of rules) {
      if (!rule.filter((x) => x[0] === "add").flatMap((x) => x.slice(1)).includes(i)) continue;
      for (const p of rule.filter((x) => x[0] === "if").flatMap((x) => x.slice(1)).map((k) => preds[k]).filter(Boolean)) {
        if (r.name(p.arg0) !== "Event") continue;
        if (p.function === "_eq") names.push(String(p.arg1));
        if (p.function === "_re") names.push(String(p.arg1).replace(/\.\*$/, "*").replace(/\\/g, ""));
      }
    }
    return [...new Set(names)];
  };
  const rows = tags.map((t, i) => {
    let what = "";
    if (t.function === "__googtag" || t.function === "__gaawc") what = r.name(t.vtp_tagId || t.vtp_measurementId);
    else if (t.function === "__gaawe") {
      const n = r.name(t.vtp_eventName);
      what = n === "Event" || n === "dataLayer.event" ? triggerEvents(i).join(", ") || "event name from the dataLayer" : n;
    } else if (t.function === "__awct") what = `AW-${t.vtp_conversionId} · ${r.name(t.vtp_conversionLabel)}`;
    else if (t.function === "__awud") what = `AW-${t.vtp_conversionId}`;
    else if (t.function === "__sp") what = `AW-${t.vtp_conversionId}`;
    else if (t.function === "__ua") what = r.name(t.vtp_trackingId);
    else if (t.vtp_projectId) what = `project ${r.name(t.vtp_projectId)}`;
    else if (t.vtp_pixelId || t.vtp_pixel_id) what = `pixel ${r.name(t.vtp_pixelId || t.vtp_pixel_id)}`;
    const params = listOf(t.vtp_eventSettingsTable).map((m) => mapOf(m).parameter).filter(Boolean);
    const userProps = listOf(t.vtp_userProperties).map((m) => mapOf(m).name).filter(Boolean);
    return {
      type: tagLabel(t, fires.get(i) || []), fn: t.function, what,
      sendsTo: t.function === "__gaawe" ? r.name(t.vtp_measurementIdOverride) || null : null,
      fires: fires.get(i) || [], blockedBy: blocks.get(i) || [],
      params, userProps,
      consent: listOf(t.consent),
      enhanced: t.function === "__awud" || !!t.vtp_userDataVariable,
      once: t.once_per_load ? "once per page" : null,
      paused: t.function === "__paused" || (!fires.has(i) && !/^__(fsl|cl|lcl|sdl|ytl|evl|tl|hl)$/.test(t.function)),
      pausedInGtm: t.function === "__paused",
    };
  });

  // dataLayer events the site is set up to listen for
  const dlEvents = new Set();
  for (const p of preds) {
    if (r.name(p.arg0) !== "Event") continue;
    if (p.function === "_eq" && !String(p.arg1).startsWith("gtm.")) dlEvents.add(String(p.arg1));
    if (p.function === "_re") dlEvents.add(`${p.arg1}  (pattern)`);
  }
  // dataLayer keys read by variables
  const dlVars = [...new Set(macros.filter((m) => m.function === "__v" && !String(m.vtp_name).startsWith("gtm.")).map((m) => m.vtp_name))];
  const PII = /(^|[._])(email|e_mail|phone|tel|mobile|first_?name|last_?name|full_?name|address|street|postcode|zip)($|[._])/i;
  const piiVars = dlVars.filter((v) => PII.test(v) && !/sha256|hash|_domain/i.test(v));

  const ga4Ids = [...new Set(rows.filter((x) => (x.fn === "__googtag" || x.fn === "__gaawc") && /^G-/.test(x.what)).map((x) => x.what))];
  const adsIds = [...new Set(rows.filter((x) => /^AW-/.test(x.what)).map((x) => x.what.split(" ")[0]).concat(rows.filter((x) => x.fn === "__googtag" && /^AW-/.test(x.what)).map((x) => x.what)))];

  return {
    id: c.id, version: res.version || null,
    tags: rows, ga4Ids, adsIds,
    dlEvents: [...dlEvents], dlVars, piiVars,
    counts: {
      tags: rows.length,
      ga4Events: rows.filter((x) => x.fn === "__gaawe").length,
      adsConversions: rows.filter((x) => x.fn === "__awct").length,
      pixels: rows.filter((x) => /Pixel|Insight|UET|Hotjar|Clarity|Pinterest|Reddit|Snap|X \(Twitter\)/.test(x.type)).length,
      consentGated: rows.filter((x) => x.consent.length).length,
    },
  };
}

// ── GA4 property (from the Google tag)
export function gtagInventory(g) {
  return {
    id: g.id,
    enhanced: Object.entries(g.enhanced).filter(([, v]) => v).map(([k]) => ({ pageView: "page views", scroll: "scrolls (90%)", outbound: "outbound clicks", download: "file downloads", form: "form interactions", video: "YouTube video", history: "SPA page changes" }[k])),
    keyEvents: g.keyEvents,
    created: g.createEvents.map((ce) => ({
      name: ce.name,
      when: [...ce.source, ...ce.conds].map((c) => `${c.param} ${({ eq: "=", eqi: "=", cn: "contains", sw: "starts with", ew: "ends with", re: "matches" })[c.op] || c.op} "${c.value}"`).join(" AND "),
      key: g.keyEvents.includes(ce.name),
    })),
    signals: g.signals, crossDomain: g.crossDomain, siteSearchParams: g.searchParams,
    piiAuto: g.piiAuto, piiFields: g.piiFields, redactEmail: g.redactEmail, internalFilters: g.internalFilters,
  };
}
