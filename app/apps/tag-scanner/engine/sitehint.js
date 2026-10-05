// A tag ID does not say which website it belongs to. But a container's own settings
// often mention the site: in trigger conditions ("Page Hostname equals ..."), cross-domain
// lists, or link rules. This reads those mentions and returns the most likely site.
// It is a guess from public configuration, and is always labelled as one.

const TLDS = "com|net|org|io|co|ai|in|uk|de|fr|eu|app|dev|us|ca|au|nl|es|it|tech|me|info|biz|xyz|agency|studio|shop|store|online|site|cloud|health|edu|gov|ch|se|no|dk|ie|sg|ae|nz|jp|br|mx|za";
const TWO_PART = /\.(co|com|org|net|ac|gov)\.(uk|in|au|nz|za|jp|br|sg|mx)$/;
// Vendors and plumbing that appear in almost every container.
const NOT_A_SITE = /(^|\.)(google|googleapis|gstatic|googletagmanager|google-analytics|googleadservices|googlesyndication|doubleclick|g\.co|goo\.gl|youtube|ytimg|youtu|facebook|fb|fbcdn|instagram|whatsapp|linkedin|licdn|twitter|x|t|bing|microsoft|live|office|msn|clarity|hotjar|hubspot|hsforms|hs-scripts|hs-analytics|hubapi|cloudflare|cloudfront|jsdelivr|unpkg|jquery|bootstrapcdn|vimeo|schema|w3|example|cookiebot|onetrust|cookielaw|cookieyes|tiktok|snapchat|sc-static|pinterest|pinimg|reddit|quora|criteo|taboola|outbrain|amazon-adsystem|amazon|adnxs|segment|intercom|zendesk|calendly|typeform|statsig|growthbook|github|sentry|stripe|paypal|shopify|shopifycdn|wp|wordpress|gravatar|mailchimp|klaviyo|apple|android|mozilla|optimizely|vwo|crazyegg|mouseflow|fullstory|heap|mixpanel|amplitude|adroll|tealium|salesforce|pardot|marketo|drift|tawk|trustpilot|yandex|baidu|cdn|akamai|fastly|netlify|vercel|herokuapp|amazonaws|azure|appspot|recaptcha|addthis|sharethis|disqus|yahoo|yimg|zoominfo|6sense|demandbase|clearbit|leadfeeder|rb2b|apollo|lfeeder|wistia|vidyard|loom|typekit|adobe|omtrdc|demdex|fontawesome|polyfill|capterra|g2|bizible|rdstation|activecampaign|sendgrid|qualtrics|surveymonkey|hsappstatic|usemessages|hscollectedforms|hsadspixel|hs-banner)\.[a-z.]+$/;

function registrable(host) {
  const h = host.toLowerCase().replace(/^www\./, "");
  const parts = h.split(".");
  if (parts.length <= 2) return h;
  return TWO_PART.test(h) ? parts.slice(-3).join(".") : parts.slice(-2).join(".");
}

const TLD_SET = new Set(TLDS.split("|"));

// Every string value inside the container data, without building one huge text.
function* strings(node, depth = 0) {
  if (typeof node === "string") { if (node.length < 400) yield node; return; }
  if (!node || typeof node !== "object" || depth > 40) return;
  for (const v of Array.isArray(node) ? node : Object.values(node)) yield* strings(v, depth + 1);
}

export function inferSite(containers) {
  const counts = new Map();
  for (const c of containers) {
    if (!c?.resource) continue;
    for (const str of strings(c.resource)) {
      if (!str.includes(".")) continue;
      // split on anything that cannot be part of a host name, then test each piece
      for (const raw of str.toLowerCase().split(/[^a-z0-9.-]+/)) {
        const host = raw.replace(/^[.-]+|[.-]+$/g, "");
        const labels = host.split(".");
        if (labels.length < 2 || labels.length > 5 || host.length < 5 || host.length > 80) continue;
        if (!TLD_SET.has(labels[labels.length - 1])) continue;
        if (labels.some((l) => !l || l.length > 40 || l.startsWith("-") || l.endsWith("-"))) continue;
        if (/^d+$/.test(labels[0]) || NOT_A_SITE.test(host)) continue;
        const d = registrable(host);
        const name = d.split(".")[0];
        if (!d.includes(".") || name.length < 3 || NOT_A_SITE.test(d)) continue;
        // code that only looks like a domain: gtm.dom, event.target.id, a.b.co
        if (/^(gtm|vtp|event|window|document|this|data|ecommerce|user|page|item|items|click|form|element|target|value|config|settings|params?|consent|transaction|promo|product|cart|checkout|purchase|session|client|server|video|scroll|history|link|container|trigger|variable|macro|tag|function|undefined|null|true|false)$/.test(name)) continue;
        counts.set(d, (counts.get(d) || 0) + 1);
      }
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return null;
  const candidates = ranked.slice(0, 3).map(([d, n]) => ({ domain: d, mentions: n }));
  const [domain, mentions] = ranked[0];
  const runnerUp = ranked[1]?.[1] || 0;
  // Only name a site when it clearly stands out.
  if (mentions < 2 || mentions < runnerUp * 1.5) return { domain: null, candidates };
  return { domain, mentions, candidates };
}
