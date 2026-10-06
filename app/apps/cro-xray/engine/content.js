// CRO X-Ray, step 1: read a page's HTML the way a visitor would meet it.
// Pulls out the headline, the calls to action and where they point, the promises made
// near them, anything that sits on top of the page (cookie banners, chat), and the forms.
// Everything here is read from public HTML. Nothing is clicked, submitted or logged into.
import { findForms } from "../../lead-path/engine/forms";

const decode = (s) => String(s || "")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "'")
  .replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;|&ndash;/g, "-").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));
const text = (html) => decode(String(html || "").replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")) || []).slice(1).find((x) => x != null) || "";

// Words that start a call to action.
const ACTION = /^(call|get|start|try|book|request|schedule|talk|contact|sign[\s-]?up|join|buy|download|see|watch|view|claim|subscribe|apply|order|shop|explore|learn more|let'?s|free|demo|create|build|launch|reserve|register|enquire|inquire|speak|chat|calculate|compare|check|find|discover|begin|open an?|become)\b/i;
const STRONG = /^(call|get|start|try|book|request|schedule|talk|sign[\s-]?up|join|buy|download|claim|subscribe|apply|order|create|reserve|register|enquire|inquire|speak|calculate|begin|open an?|become|contact (?:sales|us)|free)\b|\b(demo|trial|quote|free|started|now|today|call|consultation)\b/i;
const WEAK = /^(learn more|see|watch|view|play|explore|discover|read|find out|more|how it works|check)\b/i;
const MENU_WORD = /^(contact|pricing|about|blog|tools?|products?|solutions?|resources?|company|customers?|careers?|docs?|support|help|features?|proof|stack|faq|method|approach|home|services?|work|team|news|events?|partners?|platform|login)$/i;
const NOT_A_CTA = /^(log ?in|sign ?in|skip to|menu|search|close|accept|reject|allow|decline|cookie|privacy|terms|next|previous|prev|back|read more|more|home|english|en|share|tweet|©)/i;
const SOCIAL = /facebook\.com|twitter\.com|x\.com|linkedin\.com|instagram\.com|youtube\.com|tiktok\.com|pinterest\.|github\.com|wa\.me|t\.me/i;

// Promises a headline or button makes, and what would contradict each one.
export const PROMISES = [
  { key: "time", re: /\b(?:in|within|under|takes?|just)\s+(?:just\s+|only\s+|about\s+|under\s+)?(\d+)\s*(seconds?|secs?|minutes?|mins?)\b/i, label: (m) => m[0] },
  { key: "time", re: /\b(instant(?:ly)?|in minutes|in seconds|right away|immediately|same[\s-]day)\b/i, label: (m) => m[0] },
  { key: "no_card", re: /\bno\s+(?:credit\s+)?card(?:\s+(?:required|needed))?\b/i, label: (m) => m[0] },
  { key: "trial", re: /\b(?:start|begin|try)\b[^.]{0,30}\b(?:free\s+)?trial\b|\bfree\s+trial\b|\btry\s+(?:it\s+)?(?:for\s+)?free\b|\b\d+[\s-]day\s+free\b/i, label: (m) => m[0] },
  { key: "free", re: /\b(?:100%\s+)?free\b(?!\s+(?:trial|shipping|delivery))/i, label: (m) => m[0] },
  { key: "no_sales", re: /\bno\s+(?:sales\s+)?(?:calls?|demo|commitment|obligation|contract)\b|\bself[\s-]serve\b|\bcancel\s+any\s?time\b/i, label: (m) => m[0] },
];

const COOKIE = [[/cookiebot|consent\.cookiebot/i, "Cookiebot"], [/onetrust|cookielaw\.org|optanon/i, "OneTrust"], [/cookieyes|cookie-law-info/i, "CookieYes"], [/osano/i, "Osano"], [/termly/i, "Termly"], [/iubenda/i, "iubenda"], [/usercentrics/i, "Usercentrics"], [/complianz|cmplz/i, "Complianz"], [/trustarc|truste\.com|truste-/i, "TrustArc"], [/didomi/i, "Didomi"], [/class=["'][^"']*(?:cookie-(?:banner|consent|notice|bar)|cookie_notice|cc-window|gdpr-banner)/i, "a cookie banner"]];
const CHAT = [[/widget\.intercom\.io|intercomSettings/i, "Intercom"], [/js\.driftt\.com|drift\.com\/core/i, "Drift"], [/client\.crisp\.chat/i, "Crisp"], [/embed\.tawk\.to/i, "Tawk.to"], [/js\.usemessages\.com|hs-scripts\.com/i, "HubSpot chat"], [/static\.zdassets\.com|zopim/i, "Zendesk chat"], [/cdn\.livechatinc\.com/i, "LiveChat"], [/code\.tidio\.co/i, "Tidio"], [/wchat\.freshchat\.com|fw-cdn\.com/i, "Freshchat"], [/static\.olark\.com/i, "Olark"], [/widget\.gorgias|config\.gorgias\.chat/i, "Gorgias"], [/cdn\.botpress|landbot\.io|manychat/i, "a chatbot"]];
const POPUP = [[/optinmonster|omapi/i, "OptinMonster"], [/privy\.com|widget\.privy/i, "Privy"], [/sumo\.com|sumome/i, "Sumo"], [/klaviyo\.com\/onsite/i, "Klaviyo popup"], [/poptin\.com/i, "Poptin"], [/wisepops/i, "Wisepops"], [/sleeknote/i, "Sleeknote"]];

// What kind of thing a button offers, so the form behind it can be compared with it.
export function offerKind(s) {
  const t = String(s || "").toLowerCase();
  if (/\b(download|pdf|guide|checklist|e-?book|white\s?paper|template|report|cheat\s?sheet|newsletter|subscribe|updates|webinar)\b/.test(t)) return "light";
  if (/\b(quote|demo|consult|trial|contact|talk|sales|call|book|schedule|pricing|proposal|audit|assessment|apply|enquir|inquir|estimate)\b/.test(t)) return "heavy";
  if (/\b(buy|order|checkout|cart|shop|purchase)\b/.test(t)) return "buy";
  return "unknown";
}

export function readPage(html, pageUrl) {
  const src = String(html || "");
  const body = src.slice(Math.max(0, src.search(/<body\b/i)));
  const visible = text(body);
  const h1m = body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Full = h1m ? text(h1m[1]) : "";
  const h1Parts = [...new Set((h1Full.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map((x) => x.trim()).filter((x) => x.split(" ").length >= 3))];
  const h1Rotates = h1Parts.length >= 2 && h1Full.split(" ").length > 16 ? h1Parts.length : 0;
  const h1 = (h1Rotates ? h1Parts[0] : h1Full).slice(0, 200);
  const h1At = h1m ? h1m.index : -1;
  // The paragraph that follows the headline.
  const after = h1At >= 0 ? body.slice(h1At + h1m[0].length, h1At + h1m[0].length + 3000) : "";
  const sub = text((after.match(/<(p|h2)\b[^>]*>([\s\S]*?)<\/\1>/i) || [])[2] || "").slice(0, 260);

  // Where the navigation and the footer are, so links inside them are not mistaken for the main CTA.
  const ranges = (re) => [...body.matchAll(re)].map((m) => [m.index, m.index + m[0].length]);
  const navR = ranges(/<nav\b[\s\S]*?<\/nav>/gi), footR = ranges(/<footer\b[\s\S]*?<\/footer>/gi), headR = ranges(/<header\b[\s\S]*?<\/header>/gi);
  const inside = (rs, i) => rs.some(([a, b]) => i >= a && i < b);

  const ctas = [];
  for (const m of body.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const tag = m[1].toLowerCase(), open = m[2];
    const label = (text(m[3]) || decode(attr(open, "aria-label")) || decode(attr(open, "title"))).replace(/\s*[→›»>↗]+\s*$/, "").trim().replace(/^(.{3,40}?)\s+\1$/i, "$1");
    if (!label || label.length < 2 || label.length > 44 || NOT_A_CTA.test(label)) continue;
    const cls = attr(open, "class"), href = decode(attr(open, "href"));
    if (tag === "button" && /type\s*=\s*["']?submit/i.test(open)) continue; // a form's own submit button
    if (href && SOCIAL.test(href)) continue;
    const looksLikeButton = /\b(btn|button|cta)\b|btn-|button-|-btn|-button|-cta/i.test(cls) || /role\s*=\s*["']?button/i.test(open) || tag === "button";
    if (!ACTION.test(label) && !looksLikeButton) continue;
    if (!ACTION.test(label) && label.split(" ").length > 4) continue;
    let abs = "", kind = "none";
    if (/^(mailto|tel):/i.test(href)) { abs = href; kind = href.slice(0, 3).toLowerCase() === "tel" ? "phone" : "email"; }
    else if (!href || href === "#" || /^javascript:/i.test(href)) kind = tag === "button" ? "script" : "empty";
    else if (href.startsWith("#")) { abs = href; kind = "anchor"; }
    else { try { abs = new URL(href, pageUrl).toString(); kind = "link"; } catch { kind = "empty"; } }
    ctas.push({ label, href: abs, kind, at: m.index, inNav: inside(navR, m.index), inHeader: inside(headR, m.index), inFooter: inside(footR, m.index), action: ACTION.test(label), button: looksLikeButton });
  }

  // "Early" means near the headline: roughly what a visitor sees before scrolling.
  const heroStart = h1At >= 0 ? h1At : 0;
  const heroEnd = heroStart + 6000;
  for (const c of ctas) c.early = !c.inFooter && (c.inHeader || c.inNav || (c.at >= heroStart - 1500 && c.at <= heroEnd));
  // The main button: the strongest request to act, closest to the headline.
  // "Learn more", "Watch" and bare menu words are weak; "Get a quote" or "Start free trial" are strong.
  const score = (c) => {
    if (c.inFooter || c.kind === "empty") return -1;
    const strong = STRONG.test(c.label), weak = WEAK.test(c.label) || MENU_WORD.test(c.label);
    if (weak && !strong) return 0;
    const inHero = h1At >= 0 && c.at >= h1At - 200 && c.at <= heroEnd;
    return (strong ? 4 : c.action ? 2 : 0) + (c.button ? 1 : 0) + (inHero ? 3 : c.early ? 1 : 0) - (c.inNav ? 1 : 0) - (c.kind === "phone" || c.kind === "email" ? 3 : 0);
  };
  const best = ctas.map((c) => [score(c), c]).filter(([n]) => n >= 4).sort((a, b) => b[0] - a[0] || a[1].at - b[1].at)[0];
  const primary = best ? best[1] : null;

  // Promises made in the headline, the line under it and the main button.
  const heroText = [h1, sub, primary?.label].filter(Boolean).join(" · ");
  const promises = [];
  for (const p of PROMISES) { const m = heroText.match(p.re); if (m && !promises.some((x) => x.key === p.key)) promises.push({ key: p.key, quote: p.label(m).trim() }); }

  const find = (list) => list.filter(([re]) => re.test(src)).map(([, n]) => n);
  const overlays = { cookie: find(COOKIE), chat: find(CHAT), popup: find(POPUP) };
  const fixedBar = /position\s*:\s*(?:fixed|sticky)[^}]{0,200}(?:bottom|top)\s*:\s*0/i.test(src);

  // Tools that record behaviour or run experiments, when they are loaded straight from the page.
  const HEAT = [[/static\.hotjar\.com|hotjar\.com\/c\//i, "Hotjar"], [/clarity\.ms/i, "Microsoft Clarity"], [/crazyegg\.com/i, "Crazy Egg"], [/fullstory\.com/i, "FullStory"], [/mouseflow\.com/i, "Mouseflow"], [/luckyorange/i, "Lucky Orange"], [/smartlook/i, "Smartlook"], [/contentsquare\.net/i, "Contentsquare"]];
  const TESTING = [[/optimizely\.com/i, "Optimizely"], [/visualwebsiteoptimizer|vwo\.com/i, "VWO"], [/abtasty\.com/i, "AB Tasty"], [/convertexperiments|convert\.com\/js/i, "Convert"], [/kameleoon/i, "Kameleoon"]];
  const research = { heat: find(HEAT), testing: find(TESTING) };
  const hasSearch = /type=["']search["']|role=["']search["']|<input\b[^>]*name=["'](?:s|q|search|query)["']/i.test(src);
  const hasLang = /<html\b[^>]*\blang=/i.test(src);
  const has = (re) => re.test(visible);
  const sections = {
    pricing: has(/\bpricing\b|\bper month\b|\/mo\b|\bplans?\b/i), faq: has(/\bfaq\b|frequently asked/i),
    testimonials: has(/\btestimonial|what (?:our )?(?:customers|clients) say|★|⭐|\b\d(?:\.\d)?\s*\/\s*5\b|\breviews?\b/i),
    logos: /(?:trusted by|used by|our clients|as seen (?:in|on)|featured in|customers include)/i.test(visible),
    guarantee: has(/money[\s-]back|guarantee|no risk|cancel any ?time/i), security: has(/\bSOC ?2\b|\bISO ?27001\b|\bGDPR\b|\bHIPAA\b|secure checkout|ssl/i),
  };

  // Menu size, how often the main button is repeated, and reassurance or proof in the text.
  const linksIn = (rs) => rs.reduce((n, [a, b]) => n + (body.slice(a, b).match(/<a\b/gi) || []).length, 0);
  const navLinks = linksIn(navR.length ? navR : headR);
  const mainLabel = primary ? primary.label.toLowerCase() : "";
  const sameAsMain = mainLabel ? ctas.filter((c) => c.label.toLowerCase() === mainLabel) : [];
  const repeats = { count: sameAsMain.length, late: sameAsMain.some((c) => c.at > body.length * 0.6) };
  const reassure = ((visible.match(/no spam|never share your|we respect your privacy|(?:reply|respond|get back to you|response|hear from us)[^.]{0,40}(?:within|in)\s+(?:\d+|one|two|a few)\s*(?:hours?|business days?|working days?|minutes?|days?)|no obligation|no commitment|no credit card/i) || [])[0] || "").slice(0, 90);
  const proofNumber = ((visible.match(/\b\d[\d,.]*\s?(?:k|m|%)?\+?\s+(?:happy |satisfied |global |active )?(?:customers|clients|users|companies|businesses|projects|reviews|countries|years|teams|brands|professionals|experts|employees)\b/i) || [])[0] || "").slice(0, 60);

  return {
    navLinks, repeats, reassure, proofNumber, h1Rotates, research, hasSearch, hasLang,
    title: text((src.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").slice(0, 160),
    description: decode(attr((src.match(/<meta\b[^>]*name=["']description["'][^>]*>/i) || [""])[0], "content")).slice(0, 260),
    h1, sub, h1Count: (body.match(/<h1\b/gi) || []).length,
    ctas: ctas.map(({ at, ...c }) => c), primary: primary ? (({ at, ...c }) => c)(primary) : null,
    promises, overlays, fixedBar, sections,
    forms: findForms(src),
    textLength: visible.length, jsBuilt: visible.length < 700,
    hasViewport: /<meta\b[^>]*name=["']viewport["']/i.test(src),
    words: visible.split(" ").length,
    // Phrases on the page that change what a "free trial" or "instant" promise means.
    salesWords: (visible.match(/\b(talk to sales|contact sales|request a demo|book a demo|schedule a (?:demo|call)|speak (?:to|with) (?:sales|an expert)|get in touch with sales)\b/gi) || []).map((s) => s.toLowerCase()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3),
    cardField: /<input\b[^>]*(?:name|id|autocomplete)=["'][^"']*(?:cc-number|cardnumber|card[-_ ]?number|cc[-_ ]?num|cvv|cvc)/i.test(src) || /js\.stripe\.com|checkout\.stripe|braintree|paddle\.js|chargebee/i.test(src),
  };
}
