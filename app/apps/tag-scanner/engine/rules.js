// Step 5: rules engine. Each finding carries severity, confidence, evidence and the fix.
// Wording rule: describe configuration ("configured to…"), never "your data is wrong".
// Anything rated Verify is phrased as a question for the paid audit.
import { listOf, mapOf } from "./parse";
import { makeResolver } from "./inventory";

const GENERIC = ["page_view", "click", "scroll", "user_engagement", "form_start", "session_start", "first_visit", "view_search_results"];
const URL_PARAMS_FULL = ["page_location", "page_referrer", "link_url"];
const THANKS = /thank|success|confirm|complete|danke|gracias|merci|submitted/i;
const CONVERSIONISH = /purchase|lead|sign_?up|submit|enquiry|inquiry|contact|book|demo|quote|register|subscribe|download/i;
const KNOWN_SCRIPT_HOSTS = /googletagmanager|google-analytics|googleadservices|doubleclick|google\.com|gstatic|facebook\.net|licdn|clarity\.ms|hotjar|bing\.com|tiktok|hs-scripts|hsforms|cookiebot|cookielaw|cookieyes|calendly|youtube/i;

// ── read a gtag (Google tag) container
export function readGtag(c) {
  const tags = c.resource?.tags || [];
  const find = (fn) => tags.filter((t) => t.function === fn);
  const keyEvents = [];
  for (const t of find("__ccd_conversion_marking")) {
    for (const m of listOf(t.vtp_conversionRules)) {
      try { const rule = JSON.parse(mapOf(m).matchingRules); const v = rule?.args?.[0]?.stringValue; if (v) keyEvents.push(v); } catch { /* skip */ }
    }
  }
  const norm = (p) => {
    const m = mapOf(p);
    const vals = listOf(m.values).map(mapOf);
    const param = vals.find((v) => v.type === "event_param");
    const isName = vals.some((v) => v.type === "event_name");
    const cst = vals.find((v) => v.type === "const");
    return { op: m.type, param: isName ? "event_name" : mapOf(param?.event_param).param_name, value: cst?.const_value };
  };
  const createEvents = find("__ogt_event_create").map((t) => {
    const r = mapOf(t.vtp_precompiledRule);
    const source = listOf(r.event_name_predicate).map(norm);
    const conds = listOf(r.conditions).flatMap((g) => listOf(mapOf(g).predicates).map(norm));
    return { name: t.vtp_eventName || r.new_event_name, source, conds };
  });
  const auto = find("__ogt_auto_events")[0] || {};
  const pii = find("__ogt_1p_data_v2")[0];
  const redact = find("__ccd_auto_redact")[0];
  const zone = find("__zone")[0];
  return {
    id: c.id, keyEvents, createEvents,
    enhanced: { pageView: !!auto.vtp_enablePageView, scroll: !!auto.vtp_enableScroll, outbound: !!auto.vtp_enableOutboundClick, download: !!auto.vtp_enableDownload, form: !!auto.vtp_enableForm, video: !!auto.vtp_enableVideo, history: !!auto.vtp_enableHistoryEvents },
    piiAuto: !!(pii && (pii.vtp_isAutoEnabled || pii.vtp_isAutoCollectPiiEnabledFlag)),
    piiFields: pii ? ["email", "phone", "address"].filter((f) => pii[`vtp_auto${f[0].toUpperCase() + f.slice(1)}Enabled`]) : [],
    redactEmail: redact ? redact.vtp_redactEmail !== false : null,
    internalFilters: find("__ogt_ip_mark").length,
    signals: (find("__ogt_google_signals")[0] || {}).vtp_googleSignals || null,
    crossDomain: listOf((find("__ogt_cross_domain")[0] || {}).vtp_rules),
    searchParams: (find("__ccd_em_site_search")[0] || {}).vtp_searchQueryParams || null,
    childIds: listOf(zone?.vtp_childContainers).map((m) => mapOf(m).publicId).filter(Boolean),
  };
}

// ── read a GTM container
export function readGtm(c) {
  const r = c.resource || {};
  const tags = r.tags || [], macros = r.macros || [], preds = r.predicates || [], rules = r.rules || [];
  const tagRules = new Map(); // tag index -> predicate objects used to fire it
  for (const rule of rules) {
    const ifs = rule.filter((x) => x[0] === "if").flatMap((x) => x.slice(1));
    for (const add of rule.filter((x) => x[0] === "add").flatMap((x) => x.slice(1))) {
      tagRules.set(add, [...(tagRules.get(add) || []), ...ifs.map((i) => preds[i]).filter(Boolean)]);
    }
  }
  const macroAt = (ref) => (Array.isArray(ref) && ref[0] === "macro" ? macros[ref[1]] : null);
  const res = makeResolver(macros);
  const g = (t) => ({
    fn: t.function, name: t.vtp_eventName || null, raw: t,
    consent: listOf(t.consent || t.vtp_consent),
    fires: (tagRules.get(tags.indexOf(t)) || []).map((p) => ({ fn: p.function, macro: macroAt(p.arg0), value: p.arg1 })),
  });
  const all = tags.map(g);
  return {
    id: c.id,
    tags: all,
    ua: all.filter((t) => t.fn === "__ua" || (t.fn === "__googtag" && /^UA-/.test(t.raw.vtp_tagId || ""))),
    ga4Ids: [...new Set(all.filter((t) => t.fn === "__googtag" || t.fn === "__gaawc" || t.fn === "__gaawe").map((t) => res.constant(t.raw.vtp_tagId || t.raw.vtp_measurementId || t.raw.vtp_measurementIdOverride)).filter((x) => /^G-/.test(x || "")))],
    userData: all.some((t) => t.fn === "__awud" || t.raw.vtp_userDataVariable),
    ga4Events: all.filter((t) => t.fn === "__gaawe"),
    adsConv: all.filter((t) => t.fn === "__awct"),
    adsRmkt: all.filter((t) => t.fn === "__sp"),
    linker: all.some((t) => t.fn === "__gclidw"),
    html: all.filter((t) => t.fn === "__html"),
    templates: all.filter((t) => /^__cvt_/.test(t.fn)),
    formListeners: all.filter((t) => t.fn === "__fsl"),
    macros,
  };
}

const F = (o) => o;

export function runRules({ gtags, gtms, statuses, page }) {
  const out = [];

  // ── GA4 configuration (from the Google tag)
  for (const g of gtags) {
    const ke = new Set(g.keyEvents);
    const generic = g.keyEvents.filter((e) => GENERIC.includes(e));
    if (generic.length) out.push(F({ rule: "G1", sev: "high", conf: "Likely", title: "Generic events are marked as key events",
      detail: `${g.id} is configured to count ${generic.map((e) => `\`${e}\``).join(", ")} as key events. These fire on most sessions, so conversion totals and anything bidding on them (Google Ads) rise with traffic rather than with real leads.`,
      evidence: generic, fix: "Unmark generic events in GA4 → Admin → Key events. Keep only events that represent a business outcome.", where: g.id }));

    // G9: failure / attempt events counted as key events
    const failing = g.keyEvents.filter((e) => /attempt|fail|error|abandon/i.test(e));
    if (failing.length) out.push(F({ rule: "G9", sev: "high", conf: "Confirmed", title: "Failed or attempted actions are marked as key events",
      detail: `${g.id} counts ${failing.map((e) => `\`${e}\``).join(", ")} as key events. These fire when something didn't succeed, so they inflate conversions and teach ad bidding to chase failures.`,
      evidence: failing, fix: "Unmark them as key events. Keep them as normal events for diagnosing drop-off.", where: g.id }));

    // G2: one finding per container, listing every conversion built from a thank-you page view
    const pvLeads = g.createEvents.map((ce) => {
      const fromPv = ce.source.some((s) => s.param === "event_name" && s.value === "page_view") || ce.conds.some((c) => /page_(path|location|title)/.test(c.param || ""));
      const thanks = ce.conds.find((c) => THANKS.test(String(c.value || "")));
      return fromPv && thanks ? { name: ce.name, thanks } : null;
    }).filter(Boolean);
    if (pvLeads.length) {
      const keyed = pvLeads.filter((p) => ke.has(p.name)).length;
      const one = pvLeads.length === 1;
      const keyNote = !keyed ? "" : keyed === pvLeads.length ? (one ? ", and it is marked as a key event" : ", and all of them are marked as key events") : `, and ${keyed} of them are marked as key events`;
      out.push(F({ rule: "G2", sev: keyed ? "high" : "medium", conf: "Confirmed",
        title: one ? `\`${pvLeads[0].name}\` is counted from a thank-you page view` : `${pvLeads.length} conversions are counted from thank-you page views`,
        detail: `${g.id} creates ${pvLeads.map((p) => `\`${p.name}\``).join(", ")} whenever a matching thank-you page loads. Refreshing, bookmarking or going back to that page counts the conversion again${keyNote}.`,
        evidence: pvLeads.map((p) => `${p.thanks.param} ${p.thanks.op} "${p.thanks.value}"`),
        fix: "Fire each conversion from a dataLayer event pushed once after the server confirms the submission, with a unique ID to dedupe.", where: g.id }));
    }

    // G3: same condition value behind two key events
    const byCond = new Map();
    for (const ce of g.createEvents) for (const c of ce.conds) {
      const v = String(c.value || "").toLowerCase().replace(/\/+$/, "");
      if (v.length < 4) continue;
      byCond.set(v, [...new Set([...(byCond.get(v) || []), ce.name])]);
    }
    for (const [v, names] of byCond) {
      const keyed = names.filter((n) => ke.has(n));
      if (keyed.length >= 2) out.push(F({ rule: "G3", sev: "high", conf: "Confirmed", title: `${keyed.length === 2 ? "Two" : keyed.length} key events are built on the same condition`,
        detail: `${keyed.map((n) => `\`${n}\``).join(" and ")} both trigger on "${v}", so a single lead is counted ${keyed.length} times in key-event totals.`,
        evidence: keyed, fix: "Keep one key event per real outcome and delete or unmark the duplicate.", where: g.id }));
    }

    // G4: exact-match rules that can never match
    for (const ce of g.createEvents) for (const c of [...ce.source, ...ce.conds]) {
      if (!/^eqi?$/.test(c.op || "") || typeof c.value !== "string") continue;
      const impossible = (URL_PARAMS_FULL.includes(c.param) && !c.value.includes("://")) || (c.param === "page_path" && !c.value.startsWith("/"));
      if (impossible) out.push(F({ rule: "G4", sev: "medium", conf: "Confirmed", title: `\`${ce.name}\` can never fire`,
        detail: `It requires \`${c.param}\` to exactly equal "${c.value}", but that field always holds a full ${c.param === "page_path" ? "path starting with /" : "URL"}. The rule is configured to match nothing.`,
        evidence: [`${c.param} ${c.op} "${c.value}"`], fix: `Use "contains" instead of "equals", or match the full ${c.param === "page_path" ? "path" : "URL"}.`, where: g.id }));
    }

    if (g.piiAuto && g.redactEmail === false) out.push(F({ rule: "G5", sev: "high", conf: "Confirmed", title: "Automatic collection of user-provided data is on, with email redaction off",
      detail: `${g.id} is configured to detect ${g.piiFields.join(", ") || "personal data"} in forms automatically, and GA4's email redaction is switched off. On a site with forms, personal data can reach Google systems without a deliberate mapping.`,
      evidence: g.piiFields, fix: "Switch to manual user-provided data (a mapped, hashed variable), and turn on data redaction for email in the GA4 web stream.", where: g.id }));

    if (g.internalFilters === 0) out.push(F({ rule: "G8", sev: "low", conf: "Likely", title: "No internal-traffic rule is defined",
      detail: `${g.id} has no internal traffic definitions, so staff and agency visits are likely counted as customers.`,
      evidence: [], fix: "Define internal traffic by IP in the GA4 data stream, then activate the Internal Traffic data filter.", where: g.id }));

    const badNames = [...new Set([...g.createEvents.map((c) => c.name), ...g.keyEvents])].filter((n) => n && (/[A-Z]/.test(n) || /__/.test(n) || /(19|20)\d{2}/.test(n)));
    if (badNames.length) out.push(F({ rule: "N1", sev: "low", conf: "Confirmed", title: "Event names break naming conventions",
      detail: `Mixed case, double underscores or years in names (${badNames.map((n) => `\`${n}\``).join(", ")}) make reports hard to read and create near-duplicates.`,
      evidence: badNames, fix: "Use lowercase snake_case, no dates, one name per action.", where: g.id }));
  }

  // ── Tag setup (GTM and the Google tag)
  const uaIds = [...new Set([...page.ids.ua, ...gtags.flatMap((g) => g.childIds.filter((i) => i.startsWith("UA-"))), ...gtms.flatMap((m) => m.ua.map((t) => (/^UA-/.test(t.raw.vtp_trackingId || t.raw.vtp_tagId || "") ? t.raw.vtp_trackingId || t.raw.vtp_tagId : `a UA tag in ${m.id}`)))])];
  if (uaIds.length) out.push(F({ rule: "T1", sev: "medium", conf: "Confirmed", title: "Universal Analytics is still loading",
    detail: `${uaIds.join(", ")} is still configured. Universal Analytics stopped processing data in 2024, so this tag adds page weight and sends nothing useful.`,
    evidence: uaIds, fix: "Remove the UA tags and the old gtag config line.", where: "site" }));

  const gtmGa4 = new Set(gtms.flatMap((m) => m.ga4Ids));
  const doubled = page.hardcodedGa4.filter((id) => gtmGa4.has(id));
  if (doubled.length) out.push(F({ rule: "T2", sev: "high", conf: "Likely", title: "The same GA4 ID is loaded twice",
    detail: `${doubled.join(", ")} is loaded by GTM and also hard-coded on the page. Unless one copy has page views switched off, every page view is likely counted twice.`,
    evidence: doubled, fix: "Keep one installation (GTM) and remove the hard-coded gtag snippet.", where: "site" }));

  for (const m of gtms) {
    const convTags = [...m.adsConv, ...m.ga4Events.filter((t) => CONVERSIONISH.test(t.name || ""))];
    for (const t of convTags) {
      const fragile = t.fires.find((f) => f.fn === "_css" || (f.macro?.function === "__aev" && /TEXT/i.test(f.macro.vtp_varType || "")));
      if (fragile) out.push(F({ rule: "T3", sev: "medium", conf: "Confirmed", title: `${t.fn === "__awct" ? "A Google Ads conversion" : `\`${t.name}\``} fires on a CSS selector or button text`,
        detail: "The trigger depends on page markup or visible text. A redesign, a translation or a button-copy change silently stops the conversion.",
        evidence: [String(fragile.value || "").slice(0, 80)], fix: "Push a dataLayer event from the success handler and trigger on that event instead.", where: m.id }));
    }
    for (const f of m.formListeners) if (f.raw.vtp_checkValidation === false) out.push(F({ rule: "T4", sev: "medium", conf: "Likely", title: "A form-submit trigger fires without checking validation",
      detail: "The form listener is configured with “Check validation” off, so failed or blocked submissions are likely counted as submits.",
      evidence: [], fix: "Turn on Check Validation, or better, push a dataLayer event after the server accepts the form.", where: m.id }));

    const adTags = [...m.adsConv, ...m.adsRmkt, ...m.html.filter((t) => /fbq\(|ttq\.|lintrk|_linkedin|uetq/i.test(t.raw.vtp_html || "")), ...m.templates.filter((t) => /facebook|meta|tiktok|linkedin|pixel/i.test(t.fn))];
    const ungated = adTags.filter((t) => !t.consent.length);
    // A consent platform or Consent Mode template inside the container counts as consent handling.
    const gtmConsent = m.tags.some((t) => /consent/i.test(t.fn) || /cookiebot|onetrust|cookielaw|cookieyes|usercentrics|didomi|iubenda|termly|osano|consent_mode|ad_user_data/i.test(JSON.stringify(t.raw).slice(0, 4000)));
    if (ungated.length && !page.consentDefault && !page.cmp && !gtmConsent) out.push(F({ rule: "T5", sev: "high", conf: "Likely", title: "Ad and pixel tags have no consent requirement",
      detail: `${ungated.length} ad or pixel tag${ungated.length > 1 ? "s" : ""} in ${m.id} carry no consent checks, and no consent banner or Consent Mode default was found on the page.`,
      evidence: ungated.map((t) => t.fn.replace(/^__/, "")).slice(0, 6), fix: "Add a consent banner that sends Consent Mode v2 signals, and set consent checks on every ad tag.", where: m.id }));

    const piiMacros = m.macros.filter((x) => (x.function === "__jsm" && /\.value\b|querySelector\(\s*['"][^'"]*input|email/i.test(x.vtp_javascript?.[1] || x.vtp_javascript || "")) || x.function === "__d");
    if (piiMacros.length) out.push(F({ rule: "T6", sev: "medium", conf: "Verify", title: "Variables read values from the page",
      detail: `${piiMacros.length} variable${piiMacros.length > 1 ? "s" : ""} in ${m.id} read DOM elements or input values. Do any of them read form fields that could contain names, emails or phone numbers?`,
      evidence: [
        ...(piiMacros.filter((x) => x.function === "__d").length ? [`${piiMacros.filter((x) => x.function === "__d").length} × DOM element variable`] : []),
        ...(piiMacros.filter((x) => x.function === "__jsm").length ? [`${piiMacros.filter((x) => x.function === "__jsm").length} × custom JavaScript reading input values`] : []),
      ], fix: "Send form IDs and fixed labels, never field values.", where: m.id }));

    if (m.adsConv.length && !m.linker) out.push(F({ rule: "T7", sev: "medium", conf: "Confirmed", title: "Google Ads conversions run without a Conversion Linker",
      detail: "Without the linker, click IDs aren't stored first-party, so conversions from Safari and other ITP browsers are under-attributed.",
      evidence: [], fix: "Add a Conversion Linker tag firing on all pages.", where: m.id }));
    else if (m.adsConv.length && !m.userData && !m.adsConv.some((t) => /enhanced|userData|user_data|cssProvided/i.test(JSON.stringify(t.raw)))) out.push(F({ rule: "T7", sev: "low", conf: "Verify", title: "Enhanced conversions may be off for Google Ads",
      detail: "No user-provided data is mapped on the Ads conversion tags. Is enhanced conversions set up another way (in the Ads UI or server-side)?",
      evidence: [], fix: "Map hashed email/phone through a User-Provided Data variable, gated on ad_user_data consent.", where: m.id }));

    const hosts = [...new Set(m.html.flatMap((t) => [...String(t.raw.vtp_html || "").matchAll(/<script[^>]+src=["']https?:\/\/([^/"']+)/gi)].map((x) => x[1])))].filter((h) => !KNOWN_SCRIPT_HOSTS.test(h));
    if (hosts.length) out.push(F({ rule: "T9", sev: "medium", conf: "Verify", title: "Custom HTML loads third-party scripts",
      detail: `Custom HTML tags in ${m.id} load scripts from ${hosts.join(", ")}. Are these vendors approved, and are they consent-gated?`,
      evidence: hosts, fix: "Replace custom HTML with gallery templates where possible, and gate every vendor on consent.", where: m.id }));
  }

  for (const s of statuses.filter((x) => x.status === 404)) out.push(F({ rule: "T8", sev: "medium", conf: "Confirmed", title: `${s.id} returns 404`,
    detail: `The page references ${s.id}, but Google no longer serves a tag for it. Anything relying on it (conversions, remarketing) is configured to send nothing.`,
    evidence: [s.id], fix: "Remove the reference, or replace it with the current tag ID from the account.", where: s.id }));

  return out;
}

// One finding per rule: when a rule fires in several containers or properties,
// fold them into a single finding that names every place it was seen.
const MERGED_TITLE = {
  G1: "Generic events are marked as key events", G9: "Failed or attempted actions are marked as key events", G2: "Conversions are counted from thank-you page views",
  G3: "Key events are built on the same condition", G4: "Some create-event rules can never fire",
  G5: "Automatic collection of user-provided data is on, with email redaction off", G8: "No internal-traffic rule is defined",
  N1: "Event names break naming conventions", T3: "Conversions fire on CSS selectors or button text",
  T4: "Form-submit triggers fire without checking validation", T5: "Ad and pixel tags have no consent requirement",
  T6: "Variables read values from the page", T7: "Google Ads conversion setup is incomplete",
  T8: "Some tag IDs return 404", T9: "Custom HTML loads third-party scripts",
};
const SEV_RANK = { high: 0, medium: 1, low: 2 }, CONF_RANK = { Confirmed: 0, Likely: 1, Verify: 2 };

export function mergeFindings(findings) {
  const by = new Map();
  for (const f of findings) by.set(f.rule, [...(by.get(f.rule) || []), f]);
  return [...by.values()].map((group) => {
    if (group.length === 1) return group[0];
    const first = [...group].sort((a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev] || CONF_RANK[a.conf] - CONF_RANK[b.conf])[0];
    const wheres = [...new Set(group.map((f) => f.where))];
    return {
      ...first,
      title: MERGED_TITLE[first.rule] || first.title,
      detail: wheres.length > 1 ? `Seen in ${wheres.length} places (${wheres.join(", ")}). For example: ${first.detail}` : `${group.length} instances. For example: ${first.detail}`,
      evidence: [...new Set(group.flatMap((f) => f.evidence))].slice(0, 10),
      where: wheres.join(", "),
    };
  });
}

const SEV = { high: 18, medium: 9, low: 3 };
const CONF = { Confirmed: 1, Likely: 0.7, Verify: 0.35 };
export const SCORE_NOTE = "Starts at 100. Each finding subtracts points by severity (high 18, medium 9, low 3), weighted by confidence (Confirmed 100%, Likely 70%, Verify 35%).";

export function score(findings) {
  const s = findings.reduce((acc, f) => acc - SEV[f.sev] * CONF[f.conf], 100);
  return Math.max(0, Math.round(s));
}

export function rank(findings) {
  const sevO = { high: 0, medium: 1, low: 2 }, confO = { Confirmed: 0, Likely: 1, Verify: 2 };
  return [...findings].sort((a, b) => sevO[a.sev] - sevO[b.sev] || confO[a.conf] - confO[b.conf]);
}
