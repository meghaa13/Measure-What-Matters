// POST /api/cro { url } → what can be read about one page from its HTML: headline,
// calls to action, sections, trust signals, forms and analytics tags.
// One short call per page. Speed and accessibility come from PageSpeed, which the
// visitor's browser calls directly, so this function never waits on it.
import { NextResponse } from "next/server";
import { parseInput, isChallenge } from "../../apps/tag-scanner/engine/discover";
import { safeFetch } from "../../apps/tag-scanner/engine/fetcher";
import { analysePage } from "../../apps/cro-xray/engine/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const HOUR = 60 * 60 * 1000;
const cache = new Map(); // url -> { at, value }
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  return list.length > 12; // a scan is up to 3 pages
}

export async function POST(req) {
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many checks. Try again in a minute." }, { status: 429 });
  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  const input = parseInput(body.url);
  if (input.kind !== "url") return NextResponse.json({ error: "Enter a page address, like example.com/pricing." }, { status: 400 });

  const hit = cache.get(input.url);
  if (hit && Date.now() - hit.at < HOUR) return NextResponse.json(hit.value);

  let res;
  try { res = await safeFetch(input.url, { timeout: 8000 }); }
  catch (e) {
    if (e.message === "blocked_host") return NextResponse.json({ error: "That address can't be checked." }, { status: 400 });
    return NextResponse.json({ url: input.url, host: input.host, blocked: true, reason: "The page couldn't be reached or didn't respond in time." });
  }
  // Bot protection or an error page: say so instead of reporting "not found" for everything.
  if (isChallenge(res) || res.status >= 400) {
    return NextResponse.json({ url: res.url, host: input.host, blocked: true, reason: res.status === 404 ? "That page returns 404 (not found)." : `The site refused the request (status ${res.status}), usually bot protection.` });
  }

  const value = { host: input.host, blocked: false, ...analysePage(res.text, res.url) };
  cache.set(input.url, { at: Date.now(), value });
  console.log(JSON.stringify({ evt: "cro_xray", limited: value.limited, rules: value.findings.filter((f) => f.sev !== "pass" && f.sev !== "info").map((f) => f.id) }));
  return NextResponse.json(value);
}
