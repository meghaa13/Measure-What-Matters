// POST /api/ai-gate { url }  → which AI crawlers can reach the site, grouped by purpose.
import { NextResponse } from "next/server";
import { parseInput } from "../../apps/tag-scanner/engine/discover";
import { safeFetch } from "../../apps/tag-scanner/engine/fetcher";
import { BOTS, PURPOSES, PRESETS, REGISTRY_VERIFIED } from "../../apps/ai-crawler-gate/engine/bots";
import { allowed, generateRobots, parseRobots } from "../../apps/ai-crawler-gate/engine/robots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  return list.length > 10;
}

export async function POST(req) {
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many checks. Try again in a minute." }, { status: 429 });
  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  const input = parseInput(body.url);
  if (input.kind !== "url") return NextResponse.json({ error: "Enter a website address, like example.com." }, { status: 400 });

  const origin = new URL(input.url).origin;
  const [robotsRes, homeRes, llmsRes] = await Promise.all([
    safeFetch(`${origin}/robots.txt`, { accept: "text/plain,*/*", maxBytes: 500_000 }).catch((e) => ({ error: e.message })),
    safeFetch(input.url).catch((e) => ({ error: e.message })),
    safeFetch(`${origin}/llms.txt`, { accept: "text/plain,*/*", maxBytes: 200_000 }).catch(() => null),
  ]);
  if (robotsRes.error === "blocked_host" || homeRes.error === "blocked_host") return NextResponse.json({ error: "That address can't be checked." }, { status: 400 });

  const checks = [];
  const add = (id, status, conf, title, detail, fix) => checks.push({ id, status, conf, title, detail, fix });

  // AG3 robots.txt itself
  let robotsText = "", robotsState = "ok";
  const looksHtml = (t) => /^\s*<(!doctype|html)/i.test(t || "");
  if (robotsRes.error) { robotsState = "unreachable"; add("AG3", "fail", "Confirmed", "robots.txt didn't respond", "Crawlers that can't fetch robots.txt may back off the whole site. Google treats a server error on robots.txt as \"don't crawl\".", "Make /robots.txt return quickly with status 200."); }
  else if (robotsRes.status >= 500) { robotsState = "error"; add("AG3", "fail", "Confirmed", `robots.txt returns ${robotsRes.status}`, "Google treats a 5xx robots.txt as a full block until it recovers.", "Fix the server error on /robots.txt."); }
  else if (robotsRes.status === 404 || robotsRes.status === 410) { robotsState = "missing"; add("AG3", "info", "Confirmed", "No robots.txt", "Every crawler is allowed by default. That's valid, but it gives you no control over training crawlers.", null); }
  else if (robotsRes.status >= 400 || looksHtml(robotsRes.text)) { robotsState = "odd"; add("AG3", "warn", "Confirmed", "robots.txt doesn't look like a robots file", robotsRes.status >= 400 ? `Returns ${robotsRes.status}.` : "It returns an HTML page (often a soft 404), so crawlers treat it as having no rules.", "Serve a plain-text robots.txt at /robots.txt."); }
  else robotsText = robotsRes.text;
  const { groups, sitemaps } = parseRobots(robotsText);

  // AG1 access per bot (homepage path)
  const path = new URL(homeRes.url || input.url).pathname || "/";
  const bots = BOTS.map((b) => ({ ...b, ...allowed(groups, b.token, path) }));

  // AG2 mismatched intent per vendor: search blocked while training allowed
  for (const vendor of [...new Set(BOTS.map((b) => b.vendor))]) {
    const v = bots.filter((b) => b.vendor === vendor);
    const searchBlocked = v.filter((b) => b.purpose !== "training" && !b.allowed);
    const trainAllowed = v.filter((b) => b.purpose === "training" && b.allowed);
    if (searchBlocked.length && trainAllowed.length) add("AG2", "fail", "Confirmed", `${vendor}: search blocked, training allowed`,
      `${searchBlocked.map((b) => b.token).join(", ")} ${searchBlocked.length > 1 ? "are" : "is"} blocked, so ${vendor} can't cite the site, while ${trainAllowed.map((b) => b.token).join(", ")} can still collect it for training. Most businesses want the opposite.`,
      "Use the \"Be cited, not trained on\" preset below.");
  }
  const searchBlocked = bots.filter((b) => b.purpose === "search" && !b.allowed);
  if (searchBlocked.length && !checks.some((c) => c.id === "AG2")) add("AG2", "warn", "Confirmed", "Some AI search crawlers are blocked", `${searchBlocked.map((b) => `${b.token} (${b.product})`).join(", ")} can't index the site, so it won't be cited there.`, "Allow search crawlers unless that's a deliberate choice.");

  // AG3 overly broad rules / crawl-delay
  const star = groups.filter((g) => g.agents.includes("*"));
  if (star.some((g) => g.rules.some((r) => r.type === "disallow" && r.path === "/")) && !star.some((g) => g.rules.some((r) => r.type === "allow" && r.path === "/")))
    add("AG3", "fail", "Confirmed", "robots.txt blocks every crawler not named", "\"User-agent: * / Disallow: /\" blocks any bot without its own group, including new AI search crawlers as they launch.", "Replace the blanket block with targeted rules.");
  const delays = groups.filter((g) => g.crawlDelay).map((g) => `${g.agents.join(", ")}: ${g.crawlDelay}s`);
  if (delays.length) add("AG3", "info", "Confirmed", "Crawl-delay is set", `${delays.join("; ")}. Googlebot ignores crawl-delay; some AI crawlers honour it and crawl very slowly.`, null);

  // AG4 snippet controls on the homepage
  const html = homeRes.text || "";
  const metaRobots = [...html.matchAll(/<meta[^>]+name=["'](robots|googlebot)["'][^>]+content=["']([^"']+)/gi)].map((m) => m[2].toLowerCase()).join(", ");
  const xRobots = (homeRes.headers?.get?.("x-robots-tag") || "").toLowerCase();
  const snippetRules = [metaRobots, xRobots].join(" ");
  if (/nosnippet|max-snippet:\s*0|noindex/.test(snippetRules)) add("AG4", "fail", "Confirmed", "Snippet controls limit AI answers",
    `${metaRobots ? `Meta robots: "${metaRobots}". ` : ""}${xRobots ? `X-Robots-Tag: "${xRobots}". ` : ""}nosnippet or max-snippet:0 stops Google quoting the page in AI Overviews; noindex removes it entirely.`, "Remove nosnippet / max-snippet:0 from pages you want cited.");
  const dataNoSnippet = (html.match(/data-nosnippet/gi) || []).length;
  if (dataNoSnippet) add("AG4", "info", "Confirmed", `${dataNoSnippet} element${dataNoSnippet > 1 ? "s" : ""} marked data-nosnippet`, "Those parts of the page can't be quoted in snippets or AI Overviews.", null);

  // AG5 (phase 2): content that only appears after JavaScript runs
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (homeRes.status === 200 && text.length < 600 && /<script[^>]+src=/i.test(html)) add("AG5", "warn", "Likely", "Little text in the raw HTML", `Only ${text.length} characters of text before JavaScript runs. Most AI crawlers don't run JavaScript, so they may see an almost empty page.`, "Server-render the main content.");

  // AG6 CDN that can block bots at the network level
  const h = homeRes.headers;
  const cdn = h?.get?.("cf-ray") || /cloudflare/i.test(h?.get?.("server") || "") ? "Cloudflare" : h?.get?.("x-served-by") && /cache/i.test(h.get("x-served-by")) ? "Fastly" : /akamai/i.test(h?.get?.("server") || "") || h?.get?.("x-akamai-transformed") ? "Akamai" : h?.get?.("x-vercel-id") ? "Vercel" : null;
  if (cdn === "Cloudflare") add("AG6", "warn", "Verify", "Behind Cloudflare: AI crawlers may be blocked before robots.txt applies",
    "Since July 2025, Cloudflare blocks AI crawlers by default on new domains, whatever robots.txt says. This can't be tested truthfully from outside, because verified bots are recognised by IP address. Is \"Block AI bots\" / AI Crawl Control switched on in the Cloudflare dashboard?", "Check Cloudflare → AI Crawl Control (or Security → Bots) and allow the search crawlers you want.");
  else if (cdn) add("AG6", "info", "Verify", `Served through ${cdn}`, `${cdn} can block bots at the network level. Are any bot-blocking rules on?`, null);

  // AG7 llms.txt (information only, not scored)
  const llms = llmsRes && llmsRes.status === 200 && !looksHtml(llmsRes.text);
  add("AG7", "info", "Info", llms ? "llms.txt present" : "No llms.txt", "Reported for information only. No major AI search engine has said it uses llms.txt, so it isn't scored.", null);

  // How an AI reads the page: metadata, structured data, text before JavaScript
  const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));
  const pick = (re) => decode((html.match(re) || [])[1]?.replace(/\s+/g, " ").trim() || "");
  const schemaTypes = [...new Set([...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
    try {
      const walk = (o) => (Array.isArray(o) ? o.flatMap(walk) : o && typeof o === "object" ? [...[].concat(o["@type"] || []), ...walk(o["@graph"] || [])] : []);
      return walk(JSON.parse(m[1].trim()));
    } catch { return []; }
  }))].slice(0, 12);
  const reading = {
    title: pick(/<title[^>]*>([^<]*)/i),
    description: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i),
    h1: pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, "").trim(),
    schemaTypes,
    textChars: text.length,
    lang: pick(/<html[^>]+lang=["']([^"']+)/i),
  };

  const presets = Object.fromEntries(Object.keys(PRESETS).map((k) => [k, { label: PRESETS[k].label, warn: PRESETS[k].warn || null, robots: generateRobots(robotsText, k) }]));
  console.log(JSON.stringify({ evt: "ai_gate", robots: robotsState, blocked: bots.filter((b) => !b.allowed).map((b) => b.token), cdn, ag: checks.filter((c) => c.status === "fail").map((c) => c.id) }));

  return NextResponse.json({
    host: new URL(input.url).hostname, robotsState, robotsText, sitemaps, cdn, llms,
    bots, purposes: PURPOSES, registryVerified: REGISTRY_VERIFIED, checks, presets, path, reading,
  });
}
