// CRO X-Ray, step 2: turn what was read into insights.
//
// An insight is a sentence the site owner probably did not already know, with evidence
// they can see. Wording rules, on purpose:
//   - "We couldn't find" tracking, never "there is none" (it may live in a CRM or on a server).
//   - A promise that doesn't match the next step is a question for the owner, not a verdict.
//   - Speed numbers are "on a simulated slow phone" unless they come from real-visitor data.
//   - Speed "can slow" or "can cause"; never a lost-revenue figure.
//
// Shape: { key, n, title, evidence: [{ kind, ... }], why, action: { type, text, hypothesis?, guardrail? },
//          confidence, closeness 1-3, size 1-3 }.  Priority = closeness x confidence x size.

const CONF = { Confirmed: 3, "Confirmed (lab)": 3, Likely: 2, Estimate: 1, "AI read": 1 };
export const priority = (i) => i.closeness * (CONF[i.confidence] || 1) * i.size;
export const rank = (list) => [...list].sort((a, b) => priority(b) - priority(a));
const q = (s) => `"${s}"`;
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

// ───────── Insights from the page content (run on the server)
export function contentInsights(d) {
  const out = [];
  const { page, dest, cta, tracking } = d;
  if (!page || d.blocked) return out;
  const form = d.form; // the form the main CTA leads to, when one was found

  // 0. No main call to action at all: a finding in its own right.
  if (!cta) {
    out.push({
      key: "no_cta", n: 0, title: "We couldn't find a main call to action on this page",
      evidence: [{ kind: "quote", label: "Headline", text: page.h1 || "(no headline found)" }, { kind: "list", label: "Buttons and action links found", items: page.ctas.slice(0, 5).map((c) => c.label), empty: "None near the headline" }],
      why: "A visitor who is convinced has no obvious next step, so the page can persuade and still not convert.",
      action: { type: "Test", text: "Add one clear button near the headline that says what happens next.", hypothesis: "One visible next step will raise clicks to your lead page.", guardrail: "Lead quality (not only the number of leads)" },
      confidence: page.jsBuilt ? "Estimate" : "Likely", closeness: 3, size: 3,
    });
    return out;
  }

  // 1. Blind conversion: the form behind the main CTA has no tracking we can find.
  // Only when (a) the form looks like a real lead form, and (b) we could actually read the
  // tag setup and it has no form tracking, or the form sits in another company's frame.
  // If no Google tag was found at all we can't judge, so we stay silent rather than guess.
  const leadForm = form && (form.iframe || form.embed || (form.fields >= 2 && form.hasEmail) || form.fields >= 3);
  if (leadForm) {
    const third = form.iframe || /iframe/i.test(form.method || "");
    const signals = tracking.signals;
    if ((third && d.offer !== "light") || (tracking.tagsFound && !signals.length)) {
      const where = form.tool && form.tool !== "Custom form" ? `a ${form.tool} form` : "a form";
      out.push({
        key: "blind_conversion", n: 1,
        title: third
          ? `Your main CTA ${q(cta.label)} leads to ${where} inside a third-party frame, and we couldn't find tracking for it`
          : `Your main CTA ${q(cta.label)} leads to ${where}, and we couldn't find tracking for its submission`,
        evidence: [
          { kind: "path", from: cta.label, to: d.destSame ? "a form on this page" : host(d.destUrl) + (() => { try { return new URL(d.destUrl).pathname; } catch { return ""; } })() },
          { kind: "list", label: "Form tracking found in the Google tag and GTM setup", items: signals, empty: tracking.tagsFound ? "None" : "No Google tag or GTM container found on the page" },
          ...(third ? [{ kind: "note", text: `The form loads from ${form.tool}. Analytics on your page can't see what happens inside another site's frame unless the embed is set up to send events.` }] : []),
        ],
        why: "It may be tracked somewhere we can't see: your CRM, a server, or the form tool itself. If it isn't, you can't tell whether any change to this page works.",
        action: { type: "Fix", text: third ? `Check whether ${form.tool} sends a submission event to GA4. If not, add its event listener or a thank-you page.` : "Submit the form once with GA4 DebugView open. If no event appears, add a form-submit event and mark it as a key event." },
        tool: { href: "/apps/tag-scanner", name: "Tag Health Scan", why: "lists every event this site sends, to confirm whether the form is counted" },
        confidence: "Likely", closeness: 3, size: tracking.tagsFound ? 2 : 3,
      });
    }
  }

  // 2. A promise near the CTA, compared with what the next step asks for. A question, not a verdict.
  const target = dest || page;
  const tForm = form;
  const clashes = [];
  for (const p of page.promises) {
    if (p.key === "time" && tForm?.fields >= 6) clashes.push({ promise: p.quote, found: `the form behind it has ${plural(tForm.fields, "field")}${tForm.phoneRequired ? ", with a required phone number" : ""}`, size: tForm.fields >= 10 ? 3 : 2 });
    if (p.key === "no_card" && target.cardField) clashes.push({ promise: p.quote, found: "the next step includes a card payment field", size: 3 });
    if (p.key === "trial" && (target.salesWords.length || tForm?.phoneRequired || tForm?.fields >= 8)) {
      const bits = [target.salesWords[0] && `wording like ${q(target.salesWords[0])}`, tForm?.fields && `${plural(tForm.fields, "field")}`, tForm?.phoneRequired && "a required phone number"].filter(Boolean);
      clashes.push({ promise: p.quote, found: `the next step has ${bits.join(", ")}`, size: target.salesWords.length && tForm?.fields >= 6 ? 3 : 2 });
    }
    if (p.key === "no_sales" && target.salesWords.length) clashes.push({ promise: p.quote, found: `the next step says ${q(target.salesWords[0])}`, size: 2 });
  }
  if (clashes.length) {
    const c = clashes.sort((a, b) => b.size - a.size)[0];
    out.push({
      key: "broken_promise", n: 2,
      title: `The page says ${q(c.promise)}, and ${c.found}`,
      evidence: [{ kind: "quote", label: "On the page", text: c.promise }, { kind: "quote", label: d.destSame ? "The form" : `After clicking ${q(cta.label)}`, text: c.found.replace(/^the /, "The ") }],
      why: "If this is deliberate (a sales-led trial, for example), ignore it. If not, visitors meet a different deal from the one they clicked for, and that is where people leave.",
      action: { type: "Test", text: "Either change the promise to match the step, or shorten the step to match the promise.", hypothesis: "Matching the promise and the next step will raise form completion.", guardrail: "Lead quality and sales acceptance rate" },
      confidence: "Confirmed", closeness: 3, size: c.size,
    });
  }

  // 3. CTA dead ends.
  const links = d.links || [];
  const dead = links.filter((l) => l.status >= 400 || l.status === 0);
  const longChains = links.filter((l) => l.hops >= 3 && l.status < 400);
  const empties = page.ctas.filter((c) => c.early && c.kind === "empty");
  const byFinal = new Map();
  for (const l of links.filter((x) => x.status && x.status < 400)) byFinal.set(l.final, [...(byFinal.get(l.final) || []), l.label]);
  const merged = [...byFinal.entries()].filter(([, labels]) => new Set(labels.map((s) => s.toLowerCase())).size >= 3);
  if (dead.length || longChains.length || empties.length) {
    const parts = [dead.length && `${plural(dead.length, "button")} ${dead.length === 1 ? "leads" : "lead"} to a page that fails to load`, longChains.length && `${plural(longChains.length, "button")} ${longChains.length === 1 ? "goes" : "go"} through 3 or more redirects`, empties.length && `${plural(empties.length, "button")} ${empties.length === 1 ? "has" : "have"} no destination`].filter(Boolean);
    out.push({
      key: "cta_dead_ends", n: 3, title: `Near your headline, ${parts.join(", and ")}`,
      evidence: [{ kind: "table", label: "Where the buttons near your headline go", rows: [...dead.map((l) => [l.label, l.status ? `Error ${l.status}` : "Did not load", "bad"]), ...longChains.map((l) => [l.label, `${l.hops} redirects`, "warn"]), ...empties.slice(0, 3).map((c) => [c.label, "No link", "warn"]), ...links.filter((l) => l.status && l.status < 400 && l.hops < 3).slice(0, 3).map((l) => [l.label, "Works", "ok"])] }],
      why: dead.length ? "A visitor who clicks a broken button has already decided to act. This is the most expensive place to lose them." : "Each extra redirect adds waiting time on a phone, and a button that does nothing reads as a broken site.",
      action: { type: "Fix", text: dead.length ? "Repair or remove the broken link today. No test is needed for this." : "Point each button straight at its final address." },
      confidence: "Confirmed", closeness: dead.some((l) => l.primary) ? 3 : 2, size: dead.length ? 3 : 2,
    });
  } else if (merged.length) {
    const [final, labels] = merged[0];
    out.push({
      key: "cta_dead_ends", n: 3, title: `${labels.length} differently worded buttons all lead to the same page`,
      evidence: [{ kind: "table", label: `All of these go to ${host(final)}${(() => { try { return new URL(final).pathname; } catch { return ""; } })()}`, rows: [...new Set(labels)].slice(0, 5).map((l) => [l, "Same page", "info"]) }],
      why: "Someone who clicked \"See pricing\" and someone who clicked \"Book a demo\" wanted different things. One generic page serves neither well.",
      action: { type: "Test", text: "Give the two most-clicked buttons their own destination, or reword them to say the same thing.", hypothesis: "A destination that matches the button will raise completion.", guardrail: "Total leads across all buttons" },
      confidence: "Confirmed", closeness: 2, size: 1,
    });
  }

  // 7. The form, field by field. Not "too many fields": which ones, and why each is worth testing.
  const fields = form?.preview?.fields || [];
  if (form?.fields && fields.length) {
    const offer = d.offer;
    const lab = (f) => String(f.label || "").replace(/[”"*]+$/g, "").trim();
    const sourceQ = fields.find((f) => /how did you (find|hear)|where did you hear|how you heard|referr(ed|al)|lead source/i.test(f.label || ""));
    const phoneReq = fields.find((f) => f.required && (f.type === "tel" || /phone|mobile|tel/i.test(f.label || "")));
    const reqCount = fields.filter((f) => f.required).length;
    const notes = new Map(); // field -> why it is worth a test
    if (sourceQ) notes.set(lab(sourceQ), "Your tracking can answer this without asking");
    if (phoneReq) notes.set(lab(phoneReq), "Required. Many people will not give a number before seeing a price");
    for (const f of fields.filter((x) => x.required && x.type === "select" && x !== sourceQ).slice(2)) notes.set(lab(f), "A required choice. Could it come later in the conversation?");
    const light = offer === "light";
    const fire = sourceQ || (light && (form.fields >= 5 || phoneReq)) || (!light && reqCount >= 6 && (phoneReq || form.fields >= 9)) || form.fields >= 10;
    if (fire) {
      const lead = sourceQ ? `Your form makes ${q(lab(sourceQ))} ${sourceQ.required ? "a required question" : "one of its questions"}, and tracking can answer it for you`
        : `Your form requires ${reqCount} of its ${form.fields} fields${phoneReq ? ", including a phone number" : ""}`;
      const drop = [sourceQ && lab(sourceQ), phoneReq && `${lab(phoneReq)} (make it optional)`].filter(Boolean);
      out.push({
        key: "friction_vs_offer", n: 7,
        title: sourceQ && reqCount >= 6 ? `${lead}. It is one of ${reqCount} required fields` : lead,
        evidence: [
          { kind: "fields", label: `The form behind ${q(cta.label)}: ${plural(form.fields, "field")}, ${reqCount} required`, rows: fields.slice(0, 14).map((f) => [lab(f), f.required ? "Required" : "Optional", notes.get(lab(f)) || ""]) },
          ...(sourceQ ? [{ kind: "note", text: "Where a visitor came from is already in the address they arrived on (the campaign tags and click IDs). A hidden field can save it with every submission, more accurately than people remember it." }] : []),
        ],
        why: sourceQ ? "Each required question is one more reason to leave, and this one asks the visitor to do your tracking's job." : "There is no universal right number of fields. The question is whether each one is needed before the first conversation, or could be asked after.",
        action: { type: "Test", text: drop.length ? `Run the form without: ${drop.join("; ")}.` : "Try removing the fields sales does not use in the first conversation.", hypothesis: "Fewer required questions will raise completed quote requests.", guardrail: "Lead quality: check that sales still accepts the leads, and that source is still recorded" },
        tool: sourceQ ? { href: "/apps/lead-path", name: "Lead Path X-Ray", why: "checks whether this form already captures where each lead came from" } : null,
        confidence: sourceQ ? "Confirmed" : "Likely", closeness: 3, size: sourceQ && reqCount >= 6 ? 3 : 2,
      });
    }
  }

  // 10. A phone-number button, and no sign that taps on it are counted.
  const phone = d.phoneCta;
  if (phone && tracking.readable && !tracking.callSignals.length) {
    out.push({
      key: "blind_calls", n: 10,
      title: `${q(phone.label)} is one of your buttons, and we couldn't find anything counting taps on it`,
      evidence: [{ kind: "list", label: "Phone-tap tracking found in the Google tag and GTM setup", items: tracking.callSignals, empty: "None" }, { kind: "list", label: "What is tracked instead", items: tracking.signals.slice(0, 4), empty: "No form tracking found either" }],
      why: "If calls are a real source of leads, they are missing from your numbers, so pages and ads that produce calls look worse than they are. It may be tracked by a call-tracking service we can't see.",
      action: { type: "Fix", text: "Add a GA4 event for clicks on phone links (a GTM click trigger on links that start with tel:), and mark it as a key event." },
      tool: { href: "/apps/tag-scanner", name: "Tag Health Scan", why: "lists every event this site sends, so you can confirm what is and isn't counted" },
      confidence: "Likely", closeness: phone.early ? 3 : 2, size: 2,
    });
  }

  // 11. Data the site already collects that answers a conversion question today.
  const steps = (tracking.signals || []).filter((x) => /filled|field|step|start|focus|interaction/i.test(x));
  const submit = (tracking.signals || []).find((x) => /submit|lead|success|complete/i.test(x));
  if (form?.fields >= 5 && steps.length >= 2 && submit) {
    out.push({
      key: "use_your_data", n: 11,
      title: "You already record each step of this form, so you can see exactly which field loses people",
      evidence: [{ kind: "list", label: "Form events this site already sends", items: tracking.signals }],
      why: "Most sites have to guess which field costs them leads. You are already collecting the answer; it only needs to be looked at as a funnel.",
      action: { type: "Test", text: `In GA4, build a funnel from ${steps[0].replace(/^[^"]*"|"$/g, "")} to ${submit.replace(/^[^"]*"|"$/g, "")}. The step with the biggest drop is your first test.`, hypothesis: "Changing the field with the biggest drop will raise completions more than any other single change.", guardrail: "Lead quality" },
      tool: { href: "/apps/tag-scanner", name: "Tag Health Scan", why: "shows what each of these events sends and when it fires" },
      confidence: "Confirmed", closeness: 3, size: 2,
    });
  }
  return out;
}

// ───────── Insights from Google PageSpeed (run in the visitor's browser, once the test finishes)
const HERO = /<(h1|img|picture|video|form|button|input)\b|hero|banner|headline|cta|btn/i;
export function speedInsights(d, s) {
  const out = [];
  if (!s) return out;
  const cta = d?.cta;
  const overlays = d?.page?.overlays || { cookie: [], chat: [], popup: [] };

  // (There is no "first mobile screen" finding. Where a button sits on a phone can't be read
  // reliably from a page's code: on the first real test the page had two buttons on screen
  // and the tool said it had none. The screenshot is shown in its own section instead.)

  // 5. Waiting for the main content. Lead with real-visitor data when Google has it.
  // When Google has real-visitor data, that decides: a slow lab run on a simulated phone is
  // not a finding if real visitors see the page quickly.
  const fieldLcp = s.field?.lcpMs, labLcp = s.lcpMs;
  // Lab runs vary a lot between tries (the same page measured 6.6 s and 12.1 s), so with no
  // real-visitor data the bar is Google's "poor" line of 4 s, not the 2.5 s target.
  if (fieldLcp ? fieldLcp > 2500 : labLcp && labLcp > 4000) {
    const heroish = s.lcpNode && HERO.test(`${s.lcpNode.snippet || ""} ${s.lcpNode.selector || ""}`);
    const title = fieldLcp && fieldLcp > 2500
      ? `For a quarter of your real mobile visitors, the main content takes longer than ${secs(fieldLcp)} to appear`
      : `On a simulated slow phone, the main content took ${secs(labLcp)} to appear`;
    const worst = fieldLcp || labLcp || 0;
    out.push({
      key: "waiting", n: 5, title,
      evidence: [
        ...(s.filmstrip?.length ? [{ kind: "filmstrip", label: "What the test phone showed, moment by moment", frames: s.filmstrip, markMs: labLcp }] : []),
        { kind: "metrics", items: [fieldLcp ? ["Real visitors (Chrome data, 75th percentile)", secs(fieldLcp), fieldLcp > 4000 ? "bad" : fieldLcp > 2500 ? "warn" : "ok"] : null, labLcp ? ["Test on a simulated slow phone", secs(labLcp), labLcp > 4000 ? "bad" : labLcp > 2500 ? "warn" : "ok"] : null, ["Google's target", "2.5 s or less", "info"]].filter(Boolean) },
      ],
      why: heroish ? "The element that arrives last looks like part of your headline area, so until then a visitor has nothing to act on." : "Until the main content appears, a visitor has nothing to read or click. Slow pages can lose people before the page has made its case.",
      action: { type: "Fix", text: (() => {
        // Google sometimes names an element by its CSS path ("section.relative > div > img"),
        // which is not a name a site owner can use.
        const raw = (s.lcpNode?.label || "").replace(/\s+/g, " ").trim().slice(0, 70);
        const name = / > |^[\w-]+[.#][\w-]/.test(raw) ? "" : raw;
        if (s.lcpIsImage) return `The last thing to appear is an image${s.lcpFile ? `, ${q(s.lcpFile)}` : name && name.length < 40 ? ` (${q(name)})` : ""}. Compress it, serve it at the size it is shown, and preload it.`;
        return `The last thing to appear is ${name ? `the text ${q(name)}` : "the main text"}. Text arrives late when fonts or scripts hold it back: preload the font, and load scripts that the first screen doesn't need after it.`;
      })() },
      confidence: fieldLcp && fieldLcp > 2500 ? "Confirmed" : "Confirmed (lab)", closeness: heroish ? 3 : 2, size: worst > 6000 ? 3 : worst > 4000 ? 2 : 1,
    });
  }

  // 6. Tag tax: time the phone's processor spends on other companies' scripts.
  const tp = s.thirdParty || [];
  const total = tp.reduce((n, t) => n + (t.ms || 0), 0);
  const tapsFine = s.field?.inpMs != null && s.field.inpMs <= 200;
  if (total >= 600 && tp.length && !tapsFine) {
    const top = tp.slice(0, 5);
    const more = s.firstPartyMs != null && total > s.firstPartyMs;
    out.push({
      key: "tag_tax", n: 6,
      title: `${plural(tp.length, "outside script")} kept the test phone busy for ${secs(total)}${more ? ", more than your own code" : ""}`,
      evidence: [{ kind: "bars", label: "Processor time by company, on a simulated slow phone", unit: "ms", rows: [...top.map((t) => [t.name, Math.round(t.ms)]), ...(s.firstPartyMs != null ? [["Your own code", Math.round(s.firstPartyMs)]] : [])] }],
      why: "While the phone is busy with these scripts it can be slow to respond to taps. Tags are useful, so this is a cost to weigh, not a fault.",
      action: { type: "Test", text: `Load ${top[0].name} after the page is interactive, or only on pages that need it.`, hypothesis: "Delaying it will make the page respond sooner without losing data you use.", guardrail: "The reports that depend on that tag" },
      confidence: "Confirmed (lab)", closeness: 2, size: total > 2500 ? 3 : total > 1200 ? 2 : 1,
    });
  }

  // 8. Things that move while the page loads.
  const cls = s.field?.cls ?? s.cls;
  if (cls != null && cls > 0.1) {
    const near = (s.shiftNodes || []).find((n) => /form|button|btn|cta|input/i.test(`${n.snippet || ""} ${n.selector || ""}`));
    out.push({
      key: "jumping", n: 8, title: `Parts of the page move while it loads${near ? ", including something near a form or button" : ""}`,
      evidence: [{ kind: "metrics", items: [[s.field?.cls != null ? "Layout shift, real visitors" : "Layout shift, test phone", cls.toFixed(2), cls > 0.25 ? "bad" : "warn"], ["Google's target", "0.10 or less", "info"]] }, ...((s.shiftNodes || []).length ? [{ kind: "list", label: "Elements that moved", items: s.shiftNodes.slice(0, 4).map((n) => (n.label || n.snippet || n.selector || "").slice(0, 110)) }] : [])],
      why: "When content jumps as an image or banner arrives, a tap can land on the wrong thing. It can also make a page feel unreliable.",
      action: { type: "Fix", text: "Give images and embeds a fixed width and height so the space is held before they load." },
      confidence: s.field?.cls != null ? "Confirmed" : "Confirmed (lab)", closeness: near ? 3 : 1, size: cls > 0.25 ? 3 : 2,
    });
  }
  return out;
}

// The one-line verdict at the top of the report.
export function verdict(top, d, speedState) {
  if (d?.blocked) return "This site blocks automated visits, so only the speed results could be checked.";
  if (!top.length) return speedState === "loading" ? "Nothing major in the page content so far. The speed test is still running." : speedState === "unavailable" ? "Nothing major in the page content. Speed couldn't be checked this time." : "From the outside, this page has no major conversion problems.";
  const short = {
    no_cta: "there is no clear next step on the page", blind_conversion: "we couldn't find tracking for your main form", broken_promise: "the page promises one thing and the next step asks for another",
    cta_dead_ends: "some buttons near the headline don't lead anywhere useful", friction_vs_offer: "your form asks questions it may not need", blind_calls: "taps on your phone button aren't being counted", use_your_data: "you already hold the data to find your form's weakest field",
    waiting: "mobile visitors wait for the main content", tag_tax: "outside scripts keep phones busy", jumping: "the page moves while it loads",
  };
  const a = short[top[0].key], b = top[1] && short[top[1].key];
  const s = b ? `${a}, and ${b}` : a;
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}
