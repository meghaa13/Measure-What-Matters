// POST /api/ai-citations
//   { step: "questions", url }        → 5 buyer-style questions written from the site's own content
//   { step: "ask", url, question }    → asks Claude (with live web search) and reports whether the site
//                                       was cited (linked) or mentioned. The client runs the 5 asks in parallel.
// This is a sample run now, not a total: no AI vendor publishes citation counts.
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { parseInput } from "../../apps/tag-scanner/engine/discover";
import { safeFetch } from "../../apps/tag-scanner/engine/fetcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 26;

const MODEL = "claude-opus-5-5";
const DAY = 24 * 60 * 60 * 1000;
const cache = new Map(); // key -> { at, value }
const hits = new Map();
const cached = (k) => { const c = cache.get(k); return c && Date.now() - c.at < DAY ? c.value : null; };
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < DAY);
  list.push(now); hits.set(ip, list);
  return list.length > 30; // ~5 full checks per visitor per day (the free single question counts too)
}

const client = () => new Anthropic({ timeout: 24000, maxRetries: 0 });
const bare = (h) => h.replace(/^www\./, "").toLowerCase();

async function siteSummary(url) {
  const r = await safeFetch(url, { timeout: 6000 });
  const h = r.text || "";
  const pick = (re) => (h.match(re) || [])[1]?.replace(/\s+/g, " ").trim() || "";
  return {
    host: bare(new URL(r.url).hostname),
    title: pick(/<title[^>]*>([^<]*)/i),
    description: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)/i),
    h1: pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, ""),
    brand: pick(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)/i),
  };
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  const input = parseInput(body.url);
  if (input.kind !== "url") return NextResponse.json({ error: "Enter a website address." }, { status: 400 });

  try {
    if (body.step === "questions") {
      const key = `q:${input.host}`;
      const hit = cached(key); if (hit) return NextResponse.json(hit);
      if (limited(ip)) return NextResponse.json({ error: "Daily limit reached. Try again tomorrow." }, { status: 429 });
      const site = await siteSummary(input.url);
      const res = await client().beta.messages.create({
        model: MODEL, max_tokens: 16000,
        output_config: { effort: "low", format: { type: "json_schema", schema: { type: "object", properties: { brand: { type: "string" }, questions: { type: "array", items: { type: "string" } } }, required: ["brand", "questions"], additionalProperties: false } } },
        betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
        system: "You write the questions a potential customer would type into an AI assistant when looking for what a business offers. Use only the site details given. Never include the business's name or domain in a question: the point is to see whether AI recommends it unprompted. Write exactly 5 short, natural questions covering different needs. Also return the business's brand name as it would appear in text.",
        messages: [{ role: "user", content: JSON.stringify(site) }],
      });
      if (res.stop_reason === "refusal") return NextResponse.json({ error: "Couldn't write questions for this site." }, { status: 422 });
      const json = JSON.parse(res.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
      const value = { host: site.host, brand: json.brand || site.brand || site.host, questions: json.questions.slice(0, 5) };
      cache.set(key, { at: Date.now(), value });
      return NextResponse.json(value);
    }

    if (body.step === "ask") {
      const q = String(body.question || "").slice(0, 300);
      const brand = String(body.brand || "").slice(0, 80);
      if (!q) return NextResponse.json({ error: "No question." }, { status: 400 });
      const key = `a:${input.host}:${q}`;
      const hit = cached(key); if (hit) return NextResponse.json(hit);
      if (limited(ip)) return NextResponse.json({ error: "Daily limit reached. Try again tomorrow." }, { status: 429 });

      const res = await client().beta.messages.create({
        model: MODEL, max_tokens: 16000,
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
        messages: [{ role: "user", content: q }],
      });
      if (res.stop_reason === "refusal") return NextResponse.json({ question: q, refused: true });

      const host = input.host;
      const isSite = (u) => { try { const h = bare(new URL(u).hostname); return h === host || h.endsWith(`.${host}`); } catch { return false; } };
      const results = res.content.filter((b) => b.type === "web_search_tool_result" && Array.isArray(b.content)).flatMap((b) => b.content).filter((r) => r.type === "web_search_result");
      const citations = res.content.filter((b) => b.type === "text").flatMap((b) => b.citations || []).filter((c) => c.url);
      const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join(" ");
      const citedUrls = [...new Set(citations.filter((c) => isSite(c.url)).map((c) => c.url))];
      const otherDomains = [...new Set(citations.map((c) => { try { return bare(new URL(c.url).hostname); } catch { return null; } }).filter((h) => h && h !== host))];
      const mentioned = !!brand && new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text) || text.toLowerCase().includes(host);
      const value = {
        question: q,
        cited: citedUrls.length > 0, citedUrls,
        mentioned,
        foundInSearch: results.some((r) => isSite(r.url)),
        competitors: otherDomains.slice(0, 6),
        model: res.model,
      };
      cache.set(key, { at: Date.now(), value });
      return NextResponse.json(value);
    }
    return NextResponse.json({ error: "Unknown step." }, { status: 400 });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "The AI service is busy. Try again in a minute." }, { status: 429 });
    if (e instanceof Anthropic.APIError) return NextResponse.json({ error: `AI service error (${e.status}).` }, { status: 502 });
    return NextResponse.json({ error: "The check didn't complete. Try again." }, { status: 500 });
  }
}
