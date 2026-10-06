// POST /api/cro-xray  { url, second? }
// Reads one page and the page its main button leads to, then returns the content-side
// insights (tracking, promises, dead ends, form size). The speed-side insights come from
// Google PageSpeed, which the visitor's browser calls directly (see engine/psi.js).
// Reads public HTML only. Never submits a form, logs in, or works around bot protection.
import { NextResponse } from "next/server";
import { parseInput, extractIds, isChallenge } from "../../apps/tag-scanner/engine/discover";
import { safeFetch } from "../../apps/tag-scanner/engine/fetcher";
import { fetchContainer } from "../../apps/tag-scanner/engine/parse";
import { gtmInventory, gtagInventory } from "../../apps/tag-scanner/engine/inventory";
import { readGtag } from "../../apps/tag-scanner/engine/rules";
import { readPage, offerKind } from "../../apps/cro-xray/engine/content";
import { contentInsights } from "../../apps/cro-xray/engine/insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 26;

// Light per-instance rate limit: 6 audits per IP per minute.
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 6;
}
// One result per address per day.
const results = new Map();
const DAY = 86_400_000;

const FORM_EVENT = /form|submit|lead|contact|enquir|inquir|demo|quote|signup|sign_up|register|book|generate_lead/i;
const clean = (u) => { try { const x = new URL(u); x.hash = ""; return x.toString(); } catch { return u; } };
const sameHost = (a, b) => { try { return new URL(a).hostname.replace(/^www\./, "") === new URL(b).hostname.replace(/^www\./, ""); } catch { return false; } };

async function get(url, opts) {
  try {
    const r = await safeFetch(url, { timeout: 7000, maxBytes: 1_500_000, ...opts });
    return { ok: true, status: r.status, url: r.url, html: r.text, hops: r.hops.length, blocked: r.status === 403 || r.status === 503 || isChallenge(r) };
  } catch (e) { return { ok: false, status: 0, url, html: "", hops: 0, error: e.message, blocked: false }; }
}

export async function POST(req) {
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many checks. Try again in a minute." }, { status: 429 });
  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  const input = parseInput(body.url);
  if (input.kind !== "url") return NextResponse.json({ error: "Enter a page address, like example.com/pricing." }, { status: 400 });
  const second = body.second ? parseInput(body.second) : null;
  const cacheKey = `${input.url}|${second?.kind === "url" ? second.url : ""}`;
  const hit = results.get(cacheKey);
  if (hit && Date.now() - hit.at < DAY) return NextResponse.json(hit.value);

  // 1. The page itself
  const pg = await get(input.url);
  if (pg.error === "blocked_host") return NextResponse.json({ error: "That address can't be checked." }, { status: 400 });
  if (!pg.ok || (pg.status >= 400 && !pg.blocked)) return NextResponse.json({ error: pg.status ? `That page returned an error (${pg.status}). Check the address and try again.` : "That page didn't respond. Check the address and try again." }, { status: 400 });
  const pageUrl = clean(pg.url);
  const base = { host: new URL(pageUrl).hostname.replace(/^www\./, ""), url: pageUrl };
  if (pg.blocked) {
    const value = { ...base, blocked: true, insights: [], checklist: null, note: "This site blocks automated visits, so its content could not be read. The speed results below still work, because Google's own test usually gets through." };
    return NextResponse.json(value);
  }
  const page = readPage(pg.html, pageUrl);
  // A page whose call to action is a form (an email box with a "Start free trial" button)
  // has its main button inside that form.
  const formCta = page.forms.find((f) => f.preview?.submit && !f.embed);
  const cta = page.primary || (formCta ? { label: formCta.preview.submit, href: "", kind: "form", early: true, action: true, button: true, inNav: false, inHeader: false, inFooter: false } : null);
  if (cta && !page.primary) page.ctas.unshift(cta);

  // 2. Where the main button leads: a form further down this page, or another page.
  let dest = null, destUrl = pageUrl, destSame = true, destStatus = 200, offDomain = false;
  const override = second?.kind === "url" ? second.url : null;
  const goTo = override || (cta?.kind === "link" && clean(cta.href) !== pageUrl ? cta.href : null);
  let destHtml = pg.html;
  if (goTo) {
    const d = await get(goTo);
    destSame = false; destStatus = d.status; destUrl = clean(d.url || goTo); offDomain = !sameHost(destUrl, pageUrl);
    if (d.ok && d.status < 400 && !d.blocked) { dest = readPage(d.html, destUrl); destHtml = d.html; }
  }
  const forms = (dest || page).forms;
  // The form a visitor is being sent to: the first real form on the destination.
  const form = forms.find((f) => !f.embed && f.fields) || forms[0] || null;

  // 3. Every button near the headline: does it lead somewhere that works?
  const seen = new Set();
  const toCheck = page.ctas.filter((c) => c.early && c.kind === "link" && !seen.has(clean(c.href)) && seen.add(clean(c.href))).slice(0, 6);
  const links = await Promise.all(toCheck.map(async (c) => {
    if (goTo && clean(c.href) === clean(goTo) && !override) return { label: c.label, status: destStatus, hops: 0, final: destUrl, primary: true };
    const r = await get(c.href, { timeout: 5000, maxBytes: 150_000 });
    // A blocked answer is a robot check, not a broken page: don't report it as dead.
    return { label: c.label, status: r.blocked ? 200 : r.status, hops: r.hops, final: clean(r.url || c.href), primary: cta && c.label === cta.label };
  }));

  // 4. Can the Google tag or GTM setup see a form submission?
  const ids = extractIds(pg.html), destIds = dest ? extractIds(destHtml) : { gtm: [], ga4: [] };
  const gtmIds = [...new Set([...ids.gtm, ...destIds.gtm])].slice(0, 2), ga4Ids = [...new Set([...ids.ga4, ...destIds.ga4])].slice(0, 2);
  const containers = await Promise.all([...gtmIds, ...ga4Ids].map(fetchContainer));
  const inv = containers.filter((c) => c.id.startsWith("GTM-") && c.resource).map(gtmInventory);
  const ga4 = containers.filter((c) => c.id.startsWith("G-") && c.resource).map((c) => { try { return gtagInventory(readGtag(c)); } catch { return null; } }).filter(Boolean);
  const signals = [...new Set([
    ...inv.flatMap((m) => m.tags).filter((t) => t.fn === "__gaawe" && !t.paused && FORM_EVENT.test(t.what)).map((t) => `GA4 event "${t.what}"`),
    ...inv.flatMap((m) => m.dlEvents).filter((e) => FORM_EVENT.test(e)).map((e) => `dataLayer event "${e.replace(/\s+\(pattern\)/, "")}"`),
    ...inv.flatMap((m) => m.tags).flatMap((t) => t.fires).filter((f) => /Form submissions/.test(f)).map(() => "GTM form-submit trigger"),
    ...ga4.filter((g) => (g.enhanced || []).some((e) => /form/i.test(e))).map(() => "GA4 enhanced measurement: form interactions"),
    ...ga4.flatMap((g) => g.keyEvents || []).filter((e) => FORM_EVENT.test(e)).map((e) => `GA4 key event "${e}"`),
  ])].slice(0, 6);
  // Phone-number buttons: is there anything listening for taps on "tel:" links?
  // "forminatorPhoneFilled" is someone typing a number into a form, not a tap on a call button.
  const CALL = /^(?!.*(fill|field|form|input|submit)).*(\bcall|phone|\btel\b|click[_ ]?to[_ ]?call)/i;
  const callSignals = [...new Set([
    ...inv.flatMap((m) => m.tags).filter((t) => t.fn === "__gaawe" && !t.paused && CALL.test(t.what)).map((t) => `GA4 event "${t.what}"`),
    ...inv.flatMap((m) => m.dlEvents).filter((e) => CALL.test(e)).map((e) => `dataLayer event "${e.replace(/\s+\(pattern\)/, "")}"`),
    ...inv.flatMap((m) => m.tags).flatMap((t) => t.fires).filter((f) => /tel:/i.test(f)).map(() => "GTM trigger on phone links"),
  ])].slice(0, 4);
  const phoneCta = page.ctas.find((c) => c.kind === "phone") || null;
  const tracking = { signals, callSignals, tagsFound: !!(gtmIds.length || ga4Ids.length || ids.ads?.length), readable: inv.length > 0 || ga4.length > 0 };

  const offer = offerKind(`${cta?.label || ""} ${dest?.h1 || ""}`);
  const lean = (p) => p && { research: p.research, hasSearch: p.hasSearch, hasLang: p.hasLang, h1Rotates: p.h1Rotates, navLinks: p.navLinks, repeats: p.repeats, reassure: p.reassure, proofNumber: p.proofNumber, h1: p.h1, sub: p.sub, title: p.title, ctas: p.ctas.slice(0, 14), promises: p.promises, overlays: p.overlays, salesWords: p.salesWords, cardField: p.cardField, jsBuilt: p.jsBuilt, sections: p.sections, hasViewport: p.hasViewport, h1Count: p.h1Count, words: p.words };
  const facts = { ...base, blocked: false, page: lean(page), dest: lean(dest), cta, phoneCta, destUrl, destSame, destStatus, offDomain, form: form && { ...form, preview: form.preview && { fields: form.preview.fields, heading: form.preview.heading, submit: form.preview.submit } }, offer, links, tracking };
  const insights = contentInsights(facts);

  // The checklist that sits, collapsed, at the bottom of the report.
  const checklist = [
    ["Main call to action", cta ? `"${cta.label}"` : "Not found", cta ? "ok" : "bad"],
    ["Headline", page.h1 ? `"${page.h1.slice(0, 80)}"` : "No <h1> found", page.h1 ? (page.h1Count > 1 ? "warn" : "ok") : "bad"],
    ["Buttons near the headline", String(page.ctas.filter((c) => c.early).length), "info"],
    ["Where the main button leads", !cta ? "—" : destSame ? "A form on this page" : destStatus >= 400 || !destStatus ? `Failed to load (${destStatus || "no answer"})` : `${offDomain ? "Another site: " : ""}${new URL(destUrl).hostname.replace(/^www\./, "")}${new URL(destUrl).pathname}`, !cta ? "info" : destStatus >= 400 || !destStatus ? "bad" : offDomain ? "warn" : "ok"],
    ["Form", form ? `${form.tool}${form.fields ? `, ${form.fields} field${form.fields === 1 ? "" : "s"}${form.required ? ` (${form.required} required)` : ""}` : ""}` : "None found", form ? "info" : "warn"],
    ["Form tracking found", signals.length ? signals.join(", ") : tracking.tagsFound ? "None found" : "No Google tag found", signals.length ? "ok" : "warn"],
    ["Trust signals", Object.entries({ testimonials: "reviews or testimonials", logos: "customer logos", guarantee: "a guarantee", security: "security badges" }).filter(([k]) => page.sections[k]).map(([, v]) => v).join(", ") || "None found", Object.values(page.sections).some(Boolean) ? "ok" : "warn"],
    ["Sections found", [page.sections.pricing && "pricing", page.sections.faq && "FAQ", page.sections.testimonials && "social proof"].filter(Boolean).join(", ") || "None of pricing, FAQ, social proof", "info"],
    ["Overlays", [...page.overlays.cookie.map((n) => `${n} (cookies)`), ...page.overlays.chat.map((n) => `${n} (chat)`), ...page.overlays.popup].join(", ") || "None found", "info"],
  ];

  const value = {
    ...facts, insights, checklist,
    note: page.jsBuilt ? "This page builds most of its content with JavaScript, so there was little text to read in its HTML. The content checks are limited; the speed results use Google's fully rendered view." : null,
  };
  // Anonymous aggregate: which insights fired, never the site.
  console.log(JSON.stringify({ evt: "cro_xray", insights: insights.map((i) => i.key), cta: !!cta, form: !!form }));
  if (results.size > 300) results.clear();
  results.set(cacheKey, { at: Date.now(), value });
  return NextResponse.json(value);
}
