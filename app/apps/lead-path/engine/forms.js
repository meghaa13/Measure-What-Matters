// Form X-Ray: find lead forms (including JS embeds), work out the tool, and check
// whether each one keeps the lead's source on its way to the CRM.
// Rules depend on the tool: HubSpot, Marketo and Pardot capture attribution through
// their own cookies, so missing hidden fields aren't a gap there.

const ATTR_FIELD = /utm_|gclid|gbraid|wbraid|msclkid|fbclid|lead_?source|source|referr|landing|first_?touch|attribution|campaign|channel/i;
const CONSENT_FIELD = /consent|gdpr|sms|marketing_opt|opt_?in|agree|terms|privacy/i;

// Tools whose own scripts store attribution (no hidden fields needed).
const SELF_ATTR = new Set(["HubSpot", "Marketo", "Pardot"]);
// Tools rendered in a third-party iframe (the site's GA4 can't see the submit).
const IFRAMED = new Set(["Typeform", "Jotform", "Calendly", "Pardot (iframe)", "Google Forms", "Microsoft Forms", "Tally"]);

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1] : null;
}

const strip = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/\s+/g, " ").trim();
const nice = (name) => String(name || "").replace(/^(your|input|field)[-_]?/i, "").replace(/[\[\]]/g, " ").replace(/[-_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim().replace(/^./, (x) => x.toUpperCase());

// Human-readable description of one form: nearest heading, field labels, button text.
function preview(html, start, open, body, inputs) {
  // nearest heading in the 4,000 characters before the form
  const before = html.slice(Math.max(0, start - 4000), start);
  const hs = [...before.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map((m) => strip(m[1])).filter((t) => t && t.length < 120);
  const heading = hs[hs.length - 1] || null;
  const labels = Object.fromEntries([...body.matchAll(/<label\b[^>]*for=["']([^"']+)["'][^>]*>([\s\S]*?)<\/label>/gi)].map((m) => [m[1], strip(m[2])]));
  const fields = inputs.filter((i) => !["hidden", "submit", "button", "image", "reset"].includes(i.type)).map((i) => {
    const id = attr(i.raw, "id");
    const label = (id && labels[id]) || attr(i.raw, "placeholder") || attr(i.raw, "aria-label") || nice(i.name) || i.type;
    const text = strip(label).replace(/\s*\*+\s*$/, "");
    return { label: text.slice(0, 60), type: i.type, required: /\brequired\b|aria-required=["']true/i.test(i.raw) || /\*\s*$/.test(strip(label)) };
  });
  const buttons = [...body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
  const btn = buttons.find((b) => /type=["']submit["']/i.test(b[1])) || buttons.filter((b) => !/type=["']button["']/i.test(b[1])).pop() || buttons.pop();
  const sub = body.match(/<input\b[^>]*type=["']submit["'][^>]*>/i);
  const submit = strip(sub ? attr(sub[0], "value") : btn ? btn[2] : "") || "Submit";
  const ident = attr(open, "id") || attr(open, "name") || null;
  return { heading, fields, submit: submit.slice(0, 40), ident };
}

function toolFromForm(open, body) {
  const action = attr(open, "action") || "";
  const cls = `${attr(open, "class") || ""} ${attr(open, "id") || ""}`;
  if (/webto\.salesforce\.com|servlet\.WebToLead/i.test(action)) return "Salesforce Web-to-Lead";
  if (/hs-form|hbspt/i.test(cls)) return "HubSpot";
  if (/mktoForm/i.test(cls)) return "Marketo";
  if (/wpcf7/i.test(cls + body)) return "Contact Form 7";
  if (/gform/i.test(cls)) return "Gravity Forms";
  if (/elementor-form/i.test(cls)) return "Elementor";
  if (/w-form|data-wf-|wf-form/i.test(open + cls)) return "Webflow";
  if (/wpforms/i.test(cls)) return "WPForms";
  if (/formspree\.io/i.test(action)) return "Formspree";
  if (/search/i.test(cls) || /role=["']search/i.test(open)) return "search";
  return "Custom form";
}

// Plain <form> elements in the HTML.
function htmlForms(html) {
  const out = [];
  for (const m of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const open = `<form${m[1]}>`, body = m[2];
    if (/id=["']wmtb["']/i.test(open)) continue; // archive.org's own toolbar (real forms keep their rewritten action)
    const tool = toolFromForm(open, body);
    if (tool === "search") continue;
    const inputs = [...body.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)].map((x) => ({ tag: x[1].toLowerCase(), raw: x[2], type: (attr(x[2], "type") || (x[1].toLowerCase() === "input" ? "text" : x[1].toLowerCase())).toLowerCase(), name: attr(x[2], "name") || attr(x[2], "id") || "" }));
    const visible = inputs.filter((i) => !["hidden", "submit", "button", "image", "reset"].includes(i.type));
    if (!visible.length) continue; // newsletter-less wrappers, etc.
    if (visible.length === 1 && /search|^q$|^s$/i.test(visible[0].name)) continue;
    const hidden = inputs.filter((i) => i.type === "hidden").map((i) => i.name).filter(Boolean);
    out.push({
      preview: preview(html, m.index, open, body, inputs),
      tool, method: (attr(open, "method") || "get").toUpperCase(), action: attr(open, "action") || "",
      methodExplicit: !!attr(open, "method"), jsHandled: !attr(open, "method") && !attr(open, "action"),
      fields: visible.length,
      required: visible.filter((i) => /\brequired\b|aria-required=["']true/i.test(i.raw)).length,
      hasEmail: visible.some((i) => i.type === "email" || /mail/i.test(i.name)),
      phoneRequired: visible.some((i) => (i.type === "tel" || /phone|mobile|tel/i.test(i.name)) && /\brequired\b/i.test(i.raw)),
      consent: visible.filter((i) => i.type === "checkbox" && CONSENT_FIELD.test(i.name)).map((i) => i.name),
      hidden, attrFields: hidden.filter((n) => ATTR_FIELD.test(n)),
      redirect: null, inline: null, embed: false,
    });
  }
  return out;
}

// Forms built by JavaScript or loaded in iframes: detect the embed code.
function embedForms(html) {
  const out = [];
  for (const m of html.matchAll(/hbspt\.forms\.create\(\s*\{([\s\S]{0,1500}?)\}\s*\)/g)) {
    const cfg = m[1];
    out.push({ tool: "HubSpot", embed: true, id: (cfg.match(/formId\s*:\s*["']([^"']+)/) || [])[1] || null, portal: (cfg.match(/portalId\s*:\s*["']?(\d+)/) || [])[1] || null,
      redirect: (cfg.match(/redirectUrl\s*:\s*["']([^"']+)/) || [])[1] || null, inline: /inlineMessage/.test(cfg) ? "inline message" : null });
  }
  for (const m of html.matchAll(/MktoForms2\.loadForm\(\s*["'][^"']+["']\s*,\s*["']([^"']+)["']\s*,\s*(\d+)/g)) out.push({ tool: "Marketo", embed: true, id: m[2], portal: m[1] });
  const iframes = [...html.matchAll(/<iframe\b[^>]*src=["']([^"']+)["']/gi)].map((x) => x[1]);
  const iframeTool = [[/go\.pardot\.com|pi\.pardot\.com|\/l\/\d+\//i, "Pardot (iframe)"], [/typeform\.com/i, "Typeform"], [/jotform\.com/i, "Jotform"], [/calendly\.com/i, "Calendly"], [/docs\.google\.com\/forms/i, "Google Forms"], [/forms\.office\.com/i, "Microsoft Forms"], [/tally\.so/i, "Tally"]];
  for (const src of iframes) { const t = iframeTool.find(([re]) => re.test(src)); if (t) out.push({ tool: t[1], embed: true, iframe: true, src }); }
  if (/embed\.typeform\.com|data-tf-(widget|popup|live)/i.test(html) && !out.some((f) => f.tool === "Typeform")) out.push({ tool: "Typeform", embed: true, iframe: true });
  if (/assets\.calendly\.com\/assets\/external\/widget/i.test(html) && !out.some((f) => f.tool === "Calendly")) out.push({ tool: "Calendly", embed: true, iframe: true });
  return out.map((f) => ({ method: f.iframe ? "iframe" : "POST", fields: null, required: null, hidden: [], attrFields: [], consent: [], redirect: null, inline: null,
    preview: { heading: null, fields: [], submit: null, ident: f.id ? `${f.tool} form ${f.id}` : null, embed: f.iframe ? `Embedded ${f.tool} (loads in an iframe)` : `${f.tool} form loaded by JavaScript`, src: f.src || null }, ...f }));
}

export function findForms(html) {
  const plain = htmlForms(html);
  const embeds = embedForms(html);
  // HubSpot/Marketo embeds render a <form> later; if the raw HTML also has one, keep both details on one card.
  return [...plain, ...embeds.filter((e) => !plain.some((p) => p.tool === e.tool))];
}

// Pages likely to hold lead forms: homepage plus contact/demo/quote/pricing links, up to `limit`.
export function leadPages(html, baseUrl, limit = 10) {
  const base = new URL(baseUrl);
  const host = base.hostname.replace(/^www\./, "");
  const seen = new Set([base.origin + base.pathname]);
  const out = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi)) {
    let u; try { u = new URL(m[1], base); } catch { continue; }
    if (u.hostname.replace(/^www\./, "") !== host || !/^https?:$/.test(u.protocol)) continue;
    const text = m[2].replace(/<[^>]+>/g, " ");
    if (!/contact|demo|quote|pricing|get-?started|book|talk|consult|request|enquir|inquir|trial|sign-?up/i.test(u.pathname + " " + text)) continue;
    const key = u.origin + u.pathname;
    if (seen.has(key)) continue;
    seen.add(key); out.push(key);
    if (out.length >= limit - 1) break;
  }
  return out;
}

// Checks per form. `tracking` = form-related events/triggers found in the site's tags.
export function formChecks(f, { tracking, utmSurvives, attrInTags = [] }) {
  const checks = [];
  const add = (id, status, conf, title, detail, fix) => checks.push({ id, status, conf, title, detail, fix });

  if (f.method === "GET" && (f.hasEmail || f.fields > 1)) {
    if (f.methodExplicit || f.action) add("FX1", "fail", "Confirmed", "Form submits with GET",
      "Whatever people type (names, emails) ends up in the URL, in server logs and in GA4's page_location.", "Change the form's method to POST.");
    else add("FX1", "warn", "Verify", "Form has no method set",
      "It's probably submitted by JavaScript, which is fine. If JavaScript fails, the browser falls back to GET and puts the typed values in the URL. Does the handler always prevent the default submit?", 'Add method="post" to the form tag as a safety net.');
  }

  const iframed = IFRAMED.has(f.tool);
  if (iframed) add("FX4", "fail", "Confirmed", `${f.tool} runs in a third-party iframe`,
    "The site's GA4 and Ads tags can't see submissions inside it, so these leads look like visits that didn't convert.",
    f.tool === "Calendly" ? "Listen for Calendly's postMessage events (calendly.event_scheduled) and push a dataLayer event." : `Listen for ${f.tool}'s postMessage / submit callback and push a dataLayer event.`);

  let attrNote;
  if (SELF_ATTR.has(f.tool)) attrNote = `${f.tool} stores the original source in its own cookie and sends it to the CRM.`;
  else if (iframed) attrNote = "Attribution has to be passed into the iframe through URL parameters.";
  else if (f.attrFields.length) attrNote = `Hidden fields for ${f.attrFields.join(", ")}.`;
  else if (attrInTags.length) {
    attrNote = `No hidden fields, but form events in the tags send ${attrInTags.slice(0, 4).join(", ")}.`;
    add("FX2", "warn", "Verify", "Attribution travels with the analytics event, not the form",
      `The form has no hidden fields, but its tracking sends ${attrInTags.slice(0, 4).join(", ")}. Does the same data reach the CRM record, or only GA4?`, "If the CRM needs it, add hidden fields filled from the same values.");
  } else {
    attrNote = "No hidden fields for UTMs, click IDs or the landing page.";
    add("FX2", "fail", "Likely", "Form doesn't capture where the lead came from",
      `${f.tool} doesn't store attribution on its own, and this form has no hidden fields for it. Leads reach the CRM without a source.`,
      "Add hidden fields (utm_source, utm_medium, utm_campaign, gclid, landing_page) and fill them from first-touch values stored on arrival.");
  }

  if (!tracking.length && !iframed) add("FX5", "warn", "Likely", "No tag tracks this form's submission",
    "Nothing in the tag setup listens for a form event, so lead volume by channel can't be reported.", "Push a dataLayer event (e.g. generate_lead) after the server confirms the submission.");

  if (f.redirect) add("FX6", "info", "Likely", "Sends people to a thank-you page", `After submitting: ${f.redirect}. Track it with a dataLayer event fired once, not with the thank-you page view (refreshes count again).`, null);
  else if (f.inline) add("FX6", "info", "Likely", "Shows an inline success message", "No page change after submitting, so tracking must hook the form's success callback.", null);

  const friction = [f.fields != null ? `${f.fields} field${f.fields === 1 ? "" : "s"}${f.required ? `, ${f.required} required` : ""}` : null, f.phoneRequired ? "phone required" : null, f.consent.length ? `consent: ${f.consent.join(", ")}` : null].filter(Boolean);
  if (friction.length) add("FX7", "info", "Info", "Form details", friction.join(" · "), null);
  add("FX3", "info", "Verify", "Hidden fields filled on arrival?", "Checking whether hidden fields actually get the UTMs needs a browser render (phase 2). Never submitted.", null);

  // One-line path of the lead's source
  const captured = SELF_ATTR.has(f.tool) || f.attrFields.length > 0;
  const viaTags = !captured && attrInTags.length > 0;
  const path = [
    utmSurvives ? "UTMs survive the URL" : "UTMs are lost in redirects",
    iframed ? "the form is in an iframe" : captured ? (SELF_ATTR.has(f.tool) ? `captured by ${f.tool}'s cookie` : "captured in hidden fields") : viaTags ? "sent with the analytics event, not the form" : "not captured by the form",
    !utmSurvives || (!captured && !iframed && !viaTags) ? "lead arrives in the CRM as Direct / unknown" : viaTags ? "reaches GA4; CRM unknown (verify)" : "source should reach the CRM (mapping: verify)",
  ].join(" → ");

  return { ...f, attrNote, checks, path, ok: !checks.some((c) => c.status === "fail") };
}

// Snippet handed to developers when FX2 fails (from the Clean Tracking Plan).
export const HIDDEN_FIELD_SNIPPET = `<!-- Store first-touch attribution on arrival, fill hidden fields on every form -->
<script>
(function () {
  var KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid','msclkid','fbclid'];
  var q = new URLSearchParams(location.search), saved = {};
  try { saved = JSON.parse(localStorage.getItem('first_touch') || '{}'); } catch (e) {}
  if (!saved.landing_page && KEYS.some(function (k) { return q.get(k); })) {
    KEYS.forEach(function (k) { if (q.get(k)) saved[k] = q.get(k); });
    saved.landing_page = location.pathname;
    try { localStorage.setItem('first_touch', JSON.stringify(saved)); } catch (e) {}
  }
  document.querySelectorAll('form').forEach(function (form) {
    Object.keys(saved).forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      if (el && !el.value) el.value = saved[k];
    });
  });
})();
</script>`;
