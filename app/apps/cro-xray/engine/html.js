// CRO X-Ray: what can be judged about one page from its HTML alone.
// Every finding carries how it was found: "Rule" (read straight from the markup) or
// "Heuristic" (a pattern match that can miss custom designs). Nothing here gives a
// verdict on the messaging itself: the headline is quoted with plain signals, for review.
import { findForms } from "../../lead-path/engine/forms";

const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));
const strip = (s) => decode(String(s || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i")) || [])[1] || "";
// Blank out a block but keep its length, so positions in the page stay comparable.
const blank = (html, re) => html.replace(re, (m) => " ".repeat(m.length));

// How much visible text comes before each position (one pass over the page).
function textBefore(body, positions) {
  const want = [...positions].sort((a, b) => a - b), out = new Map();
  let inTag = false, n = 0, k = 0;
  for (let i = 0; i <= body.length && k < want.length; i++) {
    while (k < want.length && want[k] === i) out.set(want[k++], n);
    const c = body[i];
    if (c === "<") inTag = true; else if (c === ">") inTag = false; else if (!inTag && c > " ") n++;
  }
  return out;
}

const ACTION = /\b(book|get|start|try|request|contact|talk|schedule|demo|quote|buy|order|sign ?up|apply|download|subscribe|join|call|register|enquir|inquir|shop|add to|free trial|pricing|consult)/i;
const VAGUE = /^(submit|send|click here|learn more|read more|more|more info|go|continue|here|details|view more|see more|find out more|ok|enter)$/i;
const NOT_CTA = /menu|close|search|next|prev|accept|reject|cookie|toggle|skip to|log ?in|sign ?in|language|back to top/i;
const JARGON = ["solutions", "leverage", "synergy", "cutting-edge", "cutting edge", "world-class", "best-in-class", "innovative", "seamless", "robust", "end-to-end", "next-generation", "next-gen", "revolutionary", "holistic", "empower", "unlock", "transform", "state-of-the-art", "turnkey", "scalable", "one-stop"];
const SECTIONS = [
  ["offer", "What is offered", /service|feature|what we|what i|solution|product|pricing|plans?\b|offer|capabilit/i],
  ["proof", "Proof", /testimonial|review|client|customer|case stud|trusted|result|success|say about|stories|portfolio|our work/i],
  ["how", "How it works", /how it works|how we work|process|steps|approach|method|getting started/i],
  ["faq", "Questions answered", /faq|question/i],
  ["contact", "Contact or next step", /contact|get in touch|talk|book|get started|reach|let's|lets /i],
];
const TAGS = [
  ["Google Tag Manager", /googletagmanager\.com\/gtm\.js|\bGTM-[A-Z0-9]{4,10}\b/], ["Google Analytics 4", /gtag\/js\?id=G-|\bG-[A-Z0-9]{8,12}\b/], ["Meta Pixel", /connect\.facebook\.net\/[^"']*fbevents|fbq\(\s*['"]init/i],
  ["LinkedIn Insight", /snap\.licdn\.com/i], ["Microsoft Clarity", /clarity\.ms\/tag/i], ["Hotjar", /static\.hotjar\.com/i], ["HubSpot", /js\.hs-scripts\.com/i], ["Segment", /cdn\.segment\.com/i],
  ["Plausible", /plausible\.io\/js/i], ["Matomo", /matomo\.js|piwik\.js/i], ["Adobe Launch", /assets\.adobedtm\.com/i], ["Fathom", /usefathom\.com/i],
];

export function analysePage(html, url) {
  const findings = [];
  const add = (id, area, sev, method, title, detail, extra = {}) => findings.push({ id, area, sev, method, title, detail, ...extra });

  const cleaned = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, (m) => " ".repeat(m.length));
  const start = Math.max(0, cleaned.search(/<body\b/i));
  const body = cleaned.slice(start);
  const text = strip(body);
  // A page that builds its content with JavaScript has almost nothing to read here.
  const limited = text.length < 600 && /<script[^>]+src=/i.test(html);

  // ── Positioning: quoted, with plain signals. No verdict.
  const h1s = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const head = h1s[0] || body.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  const headline = head ? strip(head[1]) : "";
  let sub = "";
  if (head) {
    const after = body.slice(head.index + head[0].length, head.index + head[0].length + 3000);
    for (const m of after.matchAll(/<(p|h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi)) { const t = strip(m[2]); if (t.length >= 25 && t.length <= 400) { sub = t; break; } }
  }
  const both = `${headline} ${sub}`.toLowerCase();
  const count = (re) => (both.match(re) || []).length;
  const positioning = {
    title: strip((html.match(/<title[^>]*>([^<]*)/i) || [])[1]), headline, sub,
    description: decode(attr((html.match(/<meta[^>]+name=["']description["'][^>]*>/i) || [""])[0], "content")),
    words: headline ? headline.split(/\s+/).length : 0,
    you: count(/\b(you|your|you're|yours)\b/g), we: count(/\b(we|our|us|we're|i|my)\b/g),
    hasNumber: /\d/.test(both), jargon: JARGON.filter((j) => both.includes(j)),
  };
  if (!h1s.length && !limited) add("PO-1", "Positioning", "medium", "Rule", "No main heading (h1) on the page", headline ? `The first heading is an h2: "${headline}".` : "No heading was found in the page HTML.",
    { fix: "Give the page one h1 that says what is offered and for whom.", quick: true });
  else if (h1s.length > 1) add("PO-2", "Positioning", "info", "Rule", `${h1s.length} main headings (h1)`, "Only the first is treated as the headline here.");

  // ── Calls to action (navigation and footer are left out; forms are handled below)
  const forms = findForms(html);
  let zone = blank(blank(body, /<nav\b[\s\S]*?<\/nav>/gi), /<footer\b[\s\S]*?<\/footer>/gi);
  zone = blank(zone, /<form\b[\s\S]*?<\/form>/gi);
  const raw = [];
  for (const m of zone.matchAll(/<(a|button)\b([^>]*)>([\s\S]{0,400}?)<\/\1>/gi)) {
    const t = strip(m[3]);
    if (t.length < 2 || t.length > 40 || NOT_CTA.test(t)) continue;
    const buttonish = m[1].toLowerCase() === "button" || /\b(btn|button|cta)\b/i.test(attr(m[2], "class")) || /role=["']button/i.test(m[2]);
    const action = ACTION.test(t);
    if (buttonish || action) raw.push({ text: t, href: attr(m[2], "href"), at: m.index, action, buttonish });
  }
  const headings = [...body.matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ level: +m[1], text: strip(m[2]), at: m.index })).filter((h) => h.text && h.text.length < 140).slice(0, 60);
  const pos = textBefore(body, [...raw.map((c) => c.at), ...headings.map((h) => h.at), body.length]);
  const total = pos.get(body.length) || 1;
  const pct = (at) => Math.round(((pos.get(at) || 0) / total) * 100);
  const ctas = raw.map((c) => ({ ...c, pct: pct(c.at) }));
  const primary = ctas.find((c) => c.action && c.buttonish) || ctas.find((c) => c.action) || ctas[0];
  const long = total > 4000;
  if (!limited) {
    if (!primary) add("CTA-1", "Calls to action", "medium", "Heuristic", "No clear call to action detected", "No button or link with action wording (book, get, start, contact…) was found outside the navigation. Custom-built buttons can be missed.",
      { absence: true, hyp: { because: "no clear call to action was detected", change: "adding one primary button under the headline that names the next step", metric: "clicks on the primary call to action", guardrail: "bounce rate" } });
    else {
      if (long && primary.pct > 25) add("CTA-2", "Calls to action", "medium", "Heuristic", `First call to action sits about ${primary.pct}% down the page`, `"${primary.text}" is the first one found outside the navigation. The position is an estimate from the page's text, not a measured screen position.`,
        { quote: primary.text, hyp: { because: `the first call to action ("${primary.text}") sits about ${primary.pct}% down`, change: "placing the same call to action directly under the headline", metric: "clicks on the primary call to action", guardrail: "lead quality" } });
      if (VAGUE.test(primary.text)) add("CTA-3", "Calls to action", "medium", "Rule", `Primary call to action says "${primary.text}"`, "It doesn't name what the visitor gets or does next.",
        { quote: primary.text, hyp: { because: `the primary call to action reads "${primary.text}"`, change: "wording it as the outcome (for example \"Get my quote\" or \"Book a 20-minute call\")", metric: "clicks on that button", guardrail: "form completion rate" } });
      // "Book a call" and "Book a call →" are the same call to action
      const early = [...new Set(ctas.filter((c) => c.pct <= 20 && c.action).map((c) => c.text.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, "").trim()))];
      if (early.length > 2) add("CTA-4", "Calls to action", "medium", "Heuristic", `${early.length} different calls to action near the top`, `Found: ${early.slice(0, 5).map((t) => `"${t}"`).join(", ")}. Several equal choices can split attention.`,
        { hyp: { because: `${early.length} different calls to action compete near the top`, change: "keeping one primary action and styling the others as plain links", metric: "clicks on the primary call to action", guardrail: "total clicks on any call to action" } });
      const last = ctas.filter((c) => c.action).pop();
      if (total > 9000 && last && last.pct < 70) add("CTA-5", "Calls to action", "low", "Heuristic", "No call to action near the end of the page", `The last one found ("${last.text}") is about ${last.pct}% down a long page.`,
        { hyp: { because: "a long page ends without a call to action", change: "repeating the primary call to action after the last section", metric: "clicks on the primary call to action", guardrail: "scroll depth" } });
      if (!findings.some((f) => f.area === "Calls to action")) add("CTA-0", "Calls to action", "pass", "Heuristic", `Primary call to action found: "${primary.text}"`, `About ${primary.pct}% down the page (estimate).`);
    }
  }

  // ── Sections: found or not found. The order is information, not a judgement.
  const sections = SECTIONS.map(([key, label, re]) => { const h = headings.find((x) => re.test(x.text)); return { key, label, found: !!h, heading: h ? h.text : null }; });
  const order = headings.filter((h) => h.level === 2).slice(0, 14).map((h) => h.text);

  // ── Trust signals: pattern matches only
  const trust = {
    testimonials: /testimonial|what (our |my )?(clients|customers) say|<blockquote\b/i.test(body) || /"@type"\s*:\s*"Review"/i.test(html),
    ratings: /aggregateRating|trustpilot|g2\.com|capterra|clutch\.co|★|\b[1-5](\.\d)?\s?(\/|out of)\s?5\b/i.test(html),
    logos: /(class|alt|id|aria-label)=["'][^"']*(clients?|partners?|logos?|trusted|as[-_ ]seen|customers?)[^"']*["']/i.test(body) || /trusted by|as seen (in|on)|our clients/i.test(text),
    contact: /href=["'](tel:|mailto:)/i.test(body) || /<address\b|PostalAddress/i.test(html),
  };
  if (!limited) {
    if (!trust.testimonials && !trust.ratings && !trust.logos) add("TR-1", "Trust", "medium", "Heuristic", "No reviews, client logos or testimonials detected", "Detected from wording, class names and image descriptions, so a custom design can be missed.",
      { absence: true, hyp: { because: "no reviews, client logos or testimonials were detected", change: "adding two named testimonials or a client logo row near the first call to action", metric: "clicks on the primary call to action", guardrail: "time to first interaction" } });
    else add("TR-0", "Trust", "pass", "Heuristic", `Detected: ${[trust.testimonials && "testimonials", trust.ratings && "ratings", trust.logos && "client or partner logos"].filter(Boolean).join(", ")}`, "Presence only. Whether they are specific and believable needs a human read.");
    if (!trust.contact) add("TR-2", "Trust", "low", "Heuristic", "No phone, email or address detected on this page", "Visible contact details are a basic trust signal, especially for services.", { absence: true, fix: "Show an email or phone number in the footer or near the form.", quick: true });
  }

  // ── Forms. Read from the markup only; nothing is ever submitted.
  const formFacts = forms.map((f) => {
    if (f.embed) {
      add("FM-9", "Forms", "info", "Rule", `Form is embedded from ${f.tool}`, f.iframe ? "It loads in an iframe, so its fields can't be read from outside." : "It is built by JavaScript after the page loads, so its fields aren't in the HTML.");
      return { tool: f.tool, embed: true };
    }
    const fields = f.preview.fields, where = f.preview.heading ? ` ("${f.preview.heading}")` : "", name = `The form${where}`;
    const has = (re) => fields.some((x) => re.test(`${x.label} ${x.name}`));
    add("FM-1", "Forms", "info", "Rule", `${f.fields} field${f.fields === 1 ? "" : "s"}, ${f.required} marked required${where}`, fields.map((x) => x.label).slice(0, 12).join(" · "));
    if (f.fields >= 7) add("FM-2", "Forms", "medium", "Rule", `Form asks for ${f.fields} fields`, `${name} shows ${f.fields} fields before it can be sent.`,
      { hyp: { because: `the form asks for ${f.fields} fields`, change: "cutting it to the fields needed for a first reply", metric: "form completion rate", guardrail: "lead quality" } });
    if (f.phoneRequired) add("FM-3", "Forms", "medium", "Rule", "Phone number is required", `${name} can't be sent without a phone number.`,
      { hyp: { because: "the form requires a phone number", change: "making the phone field optional", metric: "form completion rate", guardrail: "share of leads that can be reached" } });
    const sensitive = fields.filter((x) => /budget|revenue|company size|employees|turnover|salary|income|date of birth|\bdob\b/i.test(`${x.label} ${x.name}`)).map((x) => x.label);
    if (sensitive.length) add("FM-4", "Forms", "low", "Rule", `Asks for ${sensitive.join(", ")} up front`, `${name} asks qualifying details before the visitor has had anything back.`,
      { hyp: { because: `the form asks for ${sensitive.join(", ")} before any value is shown`, change: "moving those questions to a second step or the follow-up call", metric: "form completion rate", guardrail: "lead quality" } });
    const bare = fields.filter((x) => !x.labelled && !["checkbox", "radio"].includes(x.type) && !/[0-9a-f]{8,}/i.test(x.label));
    if (bare.length && f.labelTags < fields.length) add("FM-5", "Forms", "medium", "Heuristic", `${bare.length} field${bare.length === 1 ? " has" : "s have"} no label detected`, `${bare.map((x) => x.label).slice(0, 5).join(", ")}: these seem to rely on placeholder text, which disappears once someone types.`,
      { fix: "Add a visible <label> for each field.", quick: true });
    const wrong = [has(/e-?mail/i) && !fields.some((x) => x.type === "email") && "email", has(/phone|mobile|tel/i) && !fields.some((x) => x.type === "tel") && "phone"].filter(Boolean);
    if (wrong.length) add("FM-6", "Forms", "low", "Rule", `${wrong.join(" and ")} field doesn't use the matching input type`, "On phones the right type brings up the right keyboard and lets the browser fill the field in.", { fix: 'Use type="email" and type="tel".', quick: true });
    if (VAGUE.test(f.preview.submit)) add("FM-7", "Forms", "medium", "Rule", `Form button says "${f.preview.submit}"`, "It doesn't say what happens when it is pressed.",
      { quote: f.preview.submit, hyp: { because: `the form button reads "${f.preview.submit}"`, change: "naming the outcome on the button (for example \"Get my quote\")", metric: "form completion rate", guardrail: "lead quality" } });
    if (f.method === "GET" && (f.methodExplicit || f.action) && (f.hasEmail || has(/name|phone|mobile|tel/i))) add("FM-8", "Forms", "high", "Rule", "Form sends personal details in the URL", `${name} submits with GET, so what people type ends up in the address bar, server logs and analytics.`, { fix: "Change the form's method to POST.", quick: true });
    const near = strip(html.slice(Math.max(0, f.index - 700), f.end + 700));
    if (!/privacy|no spam|unsubscribe|secure|confidential|we('ll| will) (reply|respond|get back|be in touch)|within \d+ ?(hours?|business|working|minutes?|days?)/i.test(near)) add("FM-10", "Forms", "low", "Heuristic", "No reassurance or next-step line detected near the form", "Nothing near it mentions privacy or what happens after sending.",
      { absence: true, hyp: { because: "nothing near the form says what happens after sending", change: "adding one line under the button (for example \"We reply within one working day. No spam.\")", metric: "form completion rate", guardrail: "lead quality" } });
    return { tool: f.tool, heading: f.preview.heading, fields: fields.map((x) => ({ label: x.label, type: x.type, required: x.required })), submit: f.preview.submit, method: f.method };
  });
  if (!forms.length && !limited) add("FM-0", "Forms", "info", "Rule", "No form found in the page HTML", "A form added by JavaScript after loading wouldn't show up here.", { absence: true });

  // ── Measurement: is anything there to measure a fix with?
  const tags = TAGS.filter(([, re]) => re.test(html)).map(([n]) => n);
  if (tags.length) add("ME-0", "Measurement", "pass", "Rule", `Analytics detected: ${tags.join(", ")}`, "Presence only. Whether conversions are tracked correctly is what the Tag Health Scan checks.");
  else add("ME-1", "Measurement", "medium", "Heuristic", "No analytics tag detected in the page HTML", "Without measurement, no change on this page can be judged. A tag loaded later by a consent tool would not show up here.", { absence: true, fix: "Confirm analytics is installed, then run the Tag Health Scan.", quick: true });

  const kept = limited ? findings.filter((f) => !f.absence) : findings;
  return {
    url, limited, textChars: text.length, positioning, sections, order, trust, tags, forms: formFacts,
    // first place each wording appears
    ctas: [...new Map(ctas.filter((c) => c.action).reverse().map((c) => [c.text.toLowerCase(), { text: c.text, pct: c.pct }])).values()].reverse().slice(0, 10),
    textSample: text.slice(0, 3500),
    findings: kept.map(({ absence, ...f }) => f),
  };
}
