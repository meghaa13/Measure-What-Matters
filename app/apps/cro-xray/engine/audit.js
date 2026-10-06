// CRO X-Ray, step 4: the audit.
//
// The page is walked through the way a conversion review is: area by area, each with the
// question a reviewer asks, what was seen on this page (quoted), and what to do about it.
// Every row is one of:
//   ok    in place
//   fix   a defect: repair it, no test needed
//   test  a judgement call: worth an A/B test, with the reasoning stated
//   info  context only, not counted in the score
// Rows never claim a lost-revenue figure, and "couldn't find" is used where a thing may
// exist but can't be seen from outside.

const q = (s) => `"${String(s).trim()}"`;
const count = (t, re) => (String(t).match(re) || []).length;
const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
const path = (u) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "") + (x.pathname === "/" ? "" : x.pathname); } catch { return u; } };
// Button labels that state an action without saying what the visitor gets.
const GENERIC = /^(submit|send|send message|learn more|read more|click here|contact us|contact|get in touch|get started|more|explore|discover|go|enter|continue|next|apply|sign up|register|let'?s connect|let'?s talk)$/i;
const STOP = new Set(["with", "your", "that", "this", "from", "have", "more", "about", "what", "will", "free", "page", "home"]);
const words = (s) => new Set((String(s).toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !STOP.has(w)));

const ok = (label, saw) => ({ label, saw, status: "ok" });
const info = (label, saw) => ({ label, saw, status: "info" });
const test = (label, saw, action, hypothesis, covers) => ({ label, saw, status: "test", action, hypothesis, covers });
const fix = (label, saw, action, covers) => ({ label, saw, status: "fix", action, covers });

// d: what the server read. m, k: Google's mobile and desktop runs (either may be missing).
export function audit(d, m, k) {
  if (!d?.page || d.blocked) return [];
  const { page, dest, cta, form, tracking } = d;
  const areas = [];
  const area = (key, name, asks, rows) => { const r = rows.filter(Boolean); if (r.length) areas.push({ key, name, asks, rows: r }); };

  // ── 1. Headline and offer
  const h = page.h1 || "", hw = h ? h.split(/\s+/).length : 0, hero = `${h} ${page.sub || ""}`;
  const we = count(hero, /\b(we|our|us)\b/gi), you = count(hero, /\b(you|your)\b/gi);
  area("offer", "Content and messaging", "Can a first-time visitor tell what you offer, and why it matters to them, within five seconds?", [
    !h ? fix("Headline", "No main headline (h1) was found in the page's code.", "Add one headline that says what you offer and who it is for.")
      : hw > 14 ? test("Headline", `${q(h)} runs to ${hw} words.`, "Test a headline of 6 to 12 words that leads with the result the visitor gets.", "A shorter headline is read by more visitors before they scroll or leave.")
      : hw < 3 ? test("Headline", `${q(h)} says very little by itself.`, "Test a headline that names what you do and who it is for.", "Visitors who understand the offer at once are more likely to keep reading.")
      : ok("Headline", q(h)),
    h && page.h1Rotates ? test("Rotating headline", `The headline cycles through ${page.h1Rotates} different messages. Most visitors only see the first: ${q(h)}`, "Test one fixed headline that carries your strongest message against the rotating one.", "A single message is understood faster than several that replace each other.") : null,
    h && page.h1Count > 1 ? fix("One main headline", `The page has ${page.h1Count} main headlines (h1).`, "Keep one h1 and make the others h2, so the page has a single clear message.") : null,
    h ? (we > 0 && you === 0 ? test("Who it talks about", `The headline area says "we / our" ${we === 1 ? "once" : `${we} times`} and never "you / your".`, "Test a version written from the visitor's side: the problem they have, or the result they get.", "People respond to their own outcome more than to a description of the company.")
      : you > 0 ? ok("Who it talks about", "The headline area speaks to the visitor (you / your).") : info("Who it talks about", "Neither \"we\" nor \"you\": a neutral statement.")) : null,
    h ? (page.sub ? ok("Supporting line", q(page.sub.slice(0, 150))) : test("Supporting line", "We couldn't find a sentence directly under the headline.", "Add one line under the headline: who this is for and what they get.", "A supporting line answers \"is this for me?\" before the visitor has to look for it.")) : null,
    h ? (/\d/.test(hero) ? ok("Something concrete", "The headline area includes a number.") : page.proofNumber ? ok("Something concrete", `Found further down the page: ${q(page.proofNumber)}`)
      : test("Something concrete", "No number or measurable claim was found near the headline.", "Test one specific proof point beside the headline: clients served, time saved, or a result achieved.", "A specific claim is believed more readily than a general one.")) : null,
  ]);

  // ── 2. Call to action
  const early = (page.ctas || []).filter((c) => c.early && !c.inNav && c.action);
  const distinct = [...new Map(early.map((c) => [c.label.toLowerCase(), c.label])).values()];
  const dead = (d.links || []).filter((l) => !l.status || l.status >= 400);
  const rep = page.repeats || { count: 0, late: false };
  area("cta", "Call to action", "Is there one obvious thing to do next, and does the button say what the visitor gets?", [
    !cta ? fix("Main button", "No clear call to action was found on the page.", "Add one button near the headline that names the next step.", "no_cta")
      : GENERIC.test(cta.label.trim()) ? test("Button wording", `Your main button says ${q(cta.label)}. That names an action, not what the visitor gets.`, `Test wording that states the result, in the style of "Get my quote" or "See pricing", against ${q(cta.label)}.`, "A button that states the outcome is clicked more than one that states the task.")
      : ok("Button wording", `${q(cta.label)} tells the visitor what they get.`),
    cta ? (distinct.length > 3 ? test("Competing buttons", `${distinct.length} different buttons sit near the headline: ${distinct.slice(0, 6).map(q).join(", ")}.`, "Test one main button with at most one quieter second choice.", "Fewer choices at the top send more visitors to the main one.")
      : ok("Competing buttons", distinct.length <= 1 ? "One button near the headline." : `${distinct.length} buttons near the headline: ${distinct.map(q).join(", ")}.`)) : null,
    cta ? (rep.count >= 2 && rep.late ? ok("Repeated down the page", `${q(cta.label)} appears ${rep.count} times, including near the end.`)
      : test("Repeated down the page", rep.count < 2 ? `${q(cta.label)} appears once on the page.` : `${q(cta.label)} appears ${rep.count} times, but not in the last part of the page.`, "Repeat the main button after each major section and at the end of the page.", "Visitors who read to the bottom shouldn't have to scroll back up to act.")) : null,
    dead.length ? fix("Buttons that work", `${dead.length === 1 ? "One button" : `${dead.length} buttons`} near the headline did not load: ${dead.map((l) => q(l.label)).join(", ")}.`, "Repair or remove these links.", "cta_dead_ends")
      : (d.links || []).length ? ok("Buttons that work", d.links.length === 1 ? "The one button checked leads to a working page." : `All ${d.links.length} buttons checked lead to a working page.`) : null,
    d.phoneCta ? info("Phone", `${q(d.phoneCta.label)} gives visitors a way to call.`) : null,
  ]);

  // ── 3. The step after the click
  if (cta) {
    const a = words(`${cta.label} ${page.h1}`), b = words(`${dest?.h1 || ""} ${dest?.title || ""}`);
    const shared = [...a].some((w) => b.has(w));
    area("next", "Conversion journey", "When someone presses the main button, do they land where they expected?", [
      d.destSame ? ok("Where the button leads", "To a form on this same page, so there is no second page to wait for.")
        : !d.destStatus || d.destStatus >= 400 ? fix("Where the button leads", `${path(d.destUrl)} did not load (${d.destStatus || "no answer"}).`, "Repair this link first. Nothing else on the page matters until it works.", "cta_dead_ends")
        : d.offDomain ? test("Where the button leads", `To another site: ${path(d.destUrl)}.`, "Check that the hand-off keeps your branding, and that the visit is still tracked on the other side.", "A change of site mid-journey makes some visitors stop.")
        : ok("Where the button leads", path(d.destUrl)),
      dest && !d.destSame ? (!dest.h1 ? test("Message match", "The next page has no headline.", "Give the next page a headline that repeats the button's words.", "Visitors who see their click confirmed are less likely to leave.")
        : shared ? ok("Message match", `The next page's headline, ${q(dest.h1)}, continues the message.`)
        : test("Message match", `The button says ${q(cta.label)}. The next page's headline says ${q(dest.h1)}.`, "Test a next-page headline that repeats the button's words, so visitors know they landed in the right place.", "Matching the promise reduces the share who leave straight after the click.")) : null,
      dest && !d.destSame && form ? (dest.navLinks > 8 ? test("Ways out of the form page", `The page with the form shows a menu of ${dest.navLinks > 30 ? "more than 30 links, counting drop-downs" : `about ${dest.navLinks} links`}.`, "Test the form page with the menu cut down to the logo.", "Fewer exits from the form page means more completed forms.")
        : ok("Ways out of the form page", dest.navLinks ? `A short menu (about ${dest.navLinks} links).` : "No menu competing with the form.")) : null,
    ]);
  }

  // ── 4. The form
  if (form) {
    const submit = form.preview?.submit, where = dest || page;
    area("form", "The form", "Does the form ask only for what is needed, and does it tell people what happens next?", [
      info("What it asks", form.fields ? `${form.fields} field${form.fields === 1 ? "" : "s"}, ${form.required || 0} required${form.tool ? ` (${form.tool})` : ""}.` : `An embedded ${form.tool || "third-party"} form. Its fields can't be read from outside.`),
      form.fields ? (form.fields <= 5 ? ok("Length", `${form.fields} field${form.fields === 1 ? "" : "s"} is short.`) : null) : null,
      submit ? (GENERIC.test(submit.trim()) ? test("Submit button", `The form's button says ${q(submit)}.`, `Test a button that names the result, in the style of "Get my quote" or "Send my request", against ${q(submit)}.`, "The last click is easier when it says what the visitor receives.") : ok("Submit button", q(submit))) : null,
      where.reassure ? ok("Reassurance beside the form", `Found: ${q(where.reassure)}`)
        : test("Reassurance beside the form", "We couldn't find a line about privacy, response time or obligation near the form.", "Add one short line under the button: when they will hear back, and that their details are not shared.", "Saying what happens next reduces hesitation at the last step."),
    ]);
  } else {
    area("form", "The form", "Does the form ask only for what is needed, and does it tell people what happens next?", [
      info("Form", "No form was found on this page or behind the main button. If leads arrive by phone, chat or a booking tool, that is expected."),
    ]);
  }

  // ── 5. Trust and proof
  const P = page.sections || {}, D = dest?.sections || {};
  area("trust", "Trust and proof", "Why should a stranger believe this page?", [
    P.testimonials ? ok("Reviews or testimonials", "Found on the page.") : test("Reviews or testimonials", "We couldn't find reviews or customer quotes on this page.", "Add two or three short customer quotes with a name and company, close to the main button.", "Proof from people like the visitor raises the share who act."),
    P.logos ? ok("Customer logos", "A \"trusted by\" or client section was found.") : test("Customer logos", "We couldn't find a \"trusted by\" or client-logo section.", "Test a row of recognisable client logos directly under the headline.", "Familiar names lend credibility before the visitor has read anything."),
    P.guarantee || P.security ? ok("Risk reducers", [P.guarantee && "a guarantee or cancellation promise", P.security && "security or compliance mentions"].filter(Boolean).join(" and ") + " found.")
      : test("Risk reducers", "No guarantee, certification or security mention was found.", "If you hold any (certifications, guarantees, clear cancellation terms), show them beside the form or button.", "Removing a perceived risk helps the visitors who are nearly convinced."),
    page.proofNumber ? ok("Numbers", `Found: ${q(page.proofNumber)}`) : null,
    dest && !d.destSame && form ? (D.testimonials || D.logos ? ok("Proof on the form page", "The page with the form also shows proof.")
      : test("Proof on the form page", "The page with the form shows no reviews or client names.", "Place one testimonial or a short logo row beside the form.", "Doubt is highest at the form, so proof placed there lifts completion.")) : null,
  ]);

  // ── 6. Questions and objections
  area("objections", "Questions and objections", "Does the page answer what a buyer would ask before committing?", [
    P.faq ? ok("Common questions", "An FAQ section was found.") : test("Common questions", "We couldn't find an FAQ section.", "Add the four to six questions your sales team hears most, each answered in two lines.", "Answering an objection on the page keeps visitors who would otherwise leave to look for it."),
    P.pricing ? ok("Price signal", "Pricing or plans are mentioned.") : info("Price signal", "No price or range is mentioned. Worth testing only if price is one of the first things buyers ask your sales team."),
  ]);

  // ── 7. Distractions
  const formMenu = dest && !d.destSame && form && dest.navLinks > 8; // already raised under "Conversion journey"
  const many = (n) => (n > 30 ? "more than 30 links, counting drop-downs" : `about ${n} links`);
  const over = [...(page.overlays?.cookie || []).map((n) => `${n} (cookie banner)`), ...(page.overlays?.chat || []).map((n) => `${n} (chat button)`), ...(page.overlays?.popup || []).map((n) => `${n} (pop-up)`)];
  area("distractions", "Navigation and structure", "Can visitors find their way, and is anything pulling attention away from the main action?", [
    page.navLinks > 12 ? (page.hasSearch ? ok("Site search", "A search box was found, which helps on a site with this many pages.") : info("Site search", "We couldn't find a search box. On a site with a large menu, search helps visitors who know what they want.")) : null,
    !page.navLinks ? info("Menu", "No standard menu was found in the page's code.")
      : formMenu ? null
      : page.navLinks > 8 ? test("Menu", `The top menu has ${many(page.navLinks)}.`, "If this page receives paid traffic, test a version with the menu removed or cut to three links.", "A landing page with fewer exits keeps more paid visitors on the way to the form.")
      : ok("Menu", `A short menu (about ${page.navLinks} links).`),
    over.length >= 2 ? test("Things that sit on top of the page", `On arrival, the page can show: ${over.join(", ")}.`, "Open the page on a phone in a private window. If these cover the main button, delay the chat button and any pop-up until the visitor has scrolled.", "A clear first screen lets more visitors reach the main button.")
      : over.length ? info("Things that sit on top of the page", over[0] + ".") : ok("Things that sit on top of the page", "None found."),
  ]);

  // ── 8. Speed and devices
  const speedRows = [], accRows = [];
  if (m) {
    const real = m.field?.lcpMs, v = real || m.lcpMs;
    if (v) speedRows.push((real ? v <= 2500 : v <= 4000) ? ok("Phone: main content appears", `${secs(v)} ${real ? "for real visitors" : "on a simulated slow phone"}.`)
      : fix("Phone: main content appears", `${secs(v)} ${real ? "for a quarter of real visitors or worse. Google's target is 2.5 s" : "on a simulated slow phone"}.`, "See the detail below for the element that arrives last.", "waiting"));
  }
  if (k) {
    const real = k.field?.lcpMs, v = real || k.lcpMs;
    if (v) speedRows.push(v <= 2500 ? ok("Desktop: main content appears", `${secs(v)} ${real ? "for real visitors" : "in Google's desktop test"}.`)
      : fix("Desktop: main content appears", `${secs(v)} ${real ? "for a quarter of real desktop visitors or worse" : "in Google's desktop test"}. The target is 2.5 s.`, k.lcpIsImage ? `The last thing to appear on desktop is an image${k.lcpFile ? `, ${q(k.lcpFile)}` : ""}. Compress it, serve it at the size it is shown, and preload it.` : k.lcpNode?.label ? `The last thing to appear on desktop is the text ${q(k.lcpNode.label.replace(/\s+/g, " ").trim().slice(0, 60))}. Preload its font and load scripts the first screen doesn't need after it.` : "Compress the largest image on the first screen and defer scripts that are not needed to show it."));
    const cls = k.field?.cls ?? k.cls;
    if (cls != null && cls > 0.1) speedRows.push(fix("Desktop: page holds still", `Layout shift of ${cls.toFixed(2)} on desktop (target 0.10 or less).`, "Give images, embeds and banners a fixed width and height so the space is held before they load."));
  }
  if (m) {
    const cls = m.field?.cls ?? m.cls;
    if (cls != null) speedRows.push(cls <= 0.1 ? ok("Phone: page holds still", "Nothing jumps noticeably while loading.") : fix("Phone: page holds still", `Layout shift of ${cls.toFixed(2)} (target 0.10 or less).`, "See the detail below.", "jumping"));
    const tidy = (list) => [...new Set((list || []).map((x) => String(x).replace(/\s+/g, " ").trim().slice(0, 40)).filter(Boolean))].slice(0, 3);
    const names = (list) => (tidy(list).length ? ` For example: ${tidy(list).map(q).join(", ")}.` : "");
    const onMain = cta && (m.failing?.contrast || []).some((x) => String(x).trim().toLowerCase() === cta.label.toLowerCase());
    if (m.checks?.tapTargets === "fail") accRows.push(fix("Phone: buttons big enough to tap", `Some buttons or links are too small or too close together.${names(m.failing?.tapTargets)}`, "Make every tap target at least 24 by 24 px, and main buttons 48 px tall, with space between them."));
    else if (m.checks?.tapTargets === "pass") accRows.push(ok("Phone: buttons big enough to tap", "Passed Google's check."));
    if (m.checks?.contrast === "fail") accRows.push(fix("Text easy to read", `Some text does not stand out enough from its background${onMain ? `, including your main button ${q(cta.label)}` : ""}.${names(m.failing?.contrast)}`, onMain ? `Start with ${q(cta.label)}: darken the button or its text until the contrast is at least 4.5 to 1.` : "Raise the contrast of that text to at least 4.5 to 1."));
    else if (m.checks?.contrast === "pass") accRows.push(ok("Text easy to read", "Passed Google's contrast check."));
  }
  if (page.hasViewport === false) accRows.push(fix("Built for phones", "The page has no mobile viewport setting, so phones show a shrunken desktop page.", "Add a viewport meta tag and a mobile layout."));
  area("speed", "Performance and loading", "Does the page appear quickly, on a phone and on a desktop?", speedRows);

  // ── Mobile and accessibility (WCAG): Google's automated checks, in plain words.
  const PLAIN = {
    "image-alt": ["Images described for screen readers", "Some images have no text description (alt text), so a screen reader skips them.", "Add a short alt text to every image that carries meaning."],
    "link-name": ["Links have a readable name", "Some links have no text a screen reader can announce.", "Give each link visible text or an aria-label."],
    "button-name": ["Buttons have a readable name", "Some buttons have no text a screen reader can announce (often icon-only buttons).", "Give each icon button an aria-label that says what it does."],
    "html-has-lang": ["Page language declared", "The page doesn't say what language it is in, so screen readers may mispronounce it.", "Add a lang attribute to the html tag."],
    "heading-order": ["Headings in order", "Headings skip levels (for example h2 straight to h4), which makes the page hard to navigate by keyboard or screen reader.", "Use headings in order: one h1, then h2, then h3."],
    label: ["Form fields labelled", "Some form fields have no label, so a screen reader can't say what to type.", "Give every field a visible label, not just placeholder text."],
    "meta-viewport": ["Zooming allowed", "The page blocks pinch-zoom, which stops people enlarging small text.", "Remove user-scalable=no and maximum-scale from the viewport tag."],
  };
  if (m?.a11y) {
    const skip = new Set(["color-contrast", "target-size"]);
    for (const f of m.a11y.failed.filter((x) => !skip.has(x.id)).slice(0, 6)) {
      const t = PLAIN[f.id];
      accRows.push(t ? fix(t[0], t[1], t[2]) : fix("Accessibility check", f.title + ".", "Ask your developer to open Google's accessibility report for this page and repair this item."));
    }
    if (m.a11y.score != null) accRows.unshift(info("Google's accessibility score", `${m.a11y.score} out of 100. This is an automated check. It catches only part of what real users run into, so keyboard and screen-reader testing still matter.`));
  }
  area("access", "Mobile and accessibility", "Can everyone use the page: on a small screen, with a keyboard, or with a screen reader?", accRows);

  // ── 9. Measurement
  const heat = page.research?.heat || [], testing = page.research?.testing || [];
  area("measure", "Data recording", "Is the page recording what you need to judge a change, and to see where people struggle?", [
    heat.length ? ok("Heatmaps or session recordings", `${heat.join(", ")} found.`) : test("Heatmaps or session recordings", "We couldn't find a heatmap or session-recording tool in the page's code. It may be loaded through Tag Manager.", "If none is running, add Microsoft Clarity (free) and review scroll depth and form recordings before choosing your first test.", "Seeing where real visitors stop and hesitate picks better tests than guessing."),
    testing.length ? ok("Testing tool", `${testing.join(", ")} found.`) : info("Testing tool", "No A/B testing tool was found in the page's code. You will need one to run the tests in the roadmap."),
    tracking?.signals?.length ? ok("Form submissions counted", tracking.signals.slice(0, 3).join(", ") + ".")
      : form ? fix("Form submissions counted", tracking?.tagsFound ? "We couldn't find an event for form submissions in your Google tag setup. It may be tracked somewhere we can't see, such as your CRM." : "No Google tag was found on the page.", "Send a GA4 event when the form is submitted successfully, and mark it as a key event. Without it, no test on this page can be judged.", "blind_conversion") : null,
    d.phoneCta ? (tracking?.callSignals?.length ? ok("Phone taps counted", tracking.callSignals.join(", ") + ".") : tracking?.readable ? fix("Phone taps counted", "We couldn't find an event for taps on your phone number.", "Add a GA4 event for clicks on links that start with tel:.", "blind_calls") : null) : null,
    tracking?.tagsFound ? null : info("Analytics", "No Google tag or Tag Manager container was found in the page's code."),
  ]);

  return areas;
}

// Score and roadmap, from the audit rows plus the detailed findings.
//
// Each test is filed the way a CRO programme files a hypothesis: the bucket it belongs to,
// the kind of test that suits it, the effort to build it, and which goal it should move.
const B = { vp: "Value proposition", cj: "Conversion journey", en: "Engagement", cv: "Conversions" };
// label -> [bucket, test type, effort, expected effect 1-3, moves the primary goal?]
const META = {
  "Headline": [B.vp, "A/B test", "Low", 3, false],
  "Rotating headline": [B.vp, "A/B test", "Low", 3, false],
  "Who it talks about": [B.vp, "A/B test", "Low", 2, false],
  "Supporting line": [B.vp, "A/B test", "Low", 2, false],
  "Something concrete": [B.vp, "A/B test", "Low", 2, false],
  "Button wording": [B.cv, "A/B test", "Low", 3, false],
  "Competing buttons": [B.cv, "A/B test", "Low", 2, false],
  "Repeated down the page": [B.en, "A/B test", "Low", 1, false],
  "Where the button leads": [B.cj, "Split URL test", "Medium", 2, true],
  "Message match": [B.cj, "A/B test", "Low", 2, true],
  "Ways out of the form page": [B.cj, "Split URL test", "Medium", 2, true],
  "Submit button": [B.cv, "A/B test", "Low", 2, true],
  "Reassurance beside the form": [B.cv, "A/B test", "Low", 2, true],
  "Reviews or testimonials": [B.vp, "A/B test", "Medium", 2, false],
  "Customer logos": [B.vp, "A/B test", "Low", 2, false],
  "Risk reducers": [B.vp, "A/B test", "Low", 1, true],
  "Proof on the form page": [B.cv, "A/B test", "Low", 3, true],
  "Common questions": [B.en, "A/B test", "Medium", 1, false],
  "Menu": [B.cj, "Split URL test", "Medium", 2, false],
  "Things that sit on top of the page": [B.en, "A/B test", "Low", 1, false],
  "Heatmaps or session recordings": [B.en, "Set up, no test", "Low", 3, true],
};
const CARD_META = {
  friction_vs_offer: [B.cv, "A/B test", "Medium", 3, true],
  use_your_data: [B.cj, "Analysis first, then A/B test", "Low", 3, true],
  broken_promise: [B.cj, "A/B test", "Low", 3, true],
  tag_tax: [B.en, "A/B test", "Medium", 1, false],
};
const EFFORT = { Low: 0, Medium: 1, High: 2 };

export function summarise(areas, findings, d) {
  const have = new Set(findings.map((f) => f.key));
  const live = areas.map((a) => ({ ...a, rows: a.rows.filter((r) => !(r.covers && have.has(r.covers))), cards: findings.filter((f) => f.area === a.key) }));
  let pass = 0, total = 0;
  for (const a of live) {
    a.pass = a.rows.filter((r) => r.status === "ok").length;
    a.total = a.rows.filter((r) => r.status !== "info").length + a.cards.length;
    pass += a.pass; total += a.total;
  }
  const primary = d?.form ? "completed forms" : d?.cta ? `clicks on "${d.cta.label}"` : "conversions";
  const secondary = d?.form && d?.cta ? `clicks on "${d.cta.label}"` : "time and depth on the page";
  const item = (type, text, because, a, meta) => {
    const [bucket, kind, effort, impact, main] = meta || [a.name, "A/B test", "Low", 1, false];
    return { type, text, because, area: a.key, areaName: a.name, bucket, kind, effort, impact, goal: main ? `Primary goal: ${primary}` : `Secondary goal: ${secondary}` };
  };
  const items = [];
  for (const a of live) {
    for (const c of a.cards) items.push(item(c.action.type === "Fix" ? "fix" : "test", c.action.text, c.action.hypothesis, a, CARD_META[c.key]));
    for (const r of a.rows) if (r.action) items.push(item(r.status, r.action, r.hypothesis, a, META[r.label]));
  }
  const tests = items.filter((i) => i.type === "test").sort((x, y) => y.impact - x.impact || EFFORT[x.effort] - EFFORT[y.effort]);
  return { areas: live, pass, total, fixes: items.filter((i) => i.type === "fix"), tests };
}
