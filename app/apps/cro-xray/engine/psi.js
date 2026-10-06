// CRO X-Ray, step 3: Google PageSpeed Insights, called from the visitor's browser.
//
// Why the browser and not the server: a PageSpeed run takes 10 to 30 seconds, longer than
// a Netlify function is allowed to run, and the answer is 1 to 2 MB. Calling Google
// directly costs the site no function time and no bandwidth.
//
// Field names: Lighthouse 13 moved several audits to new "insight" IDs. Each value below
// is looked up under its old and its new name, and node details are found by searching
// the audit instead of trusting one fixed path.
import { PSI_KEY } from "../../../lib/site";

const API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const DAY = 86_400_000;

// First { type: "node" } object anywhere inside an audit's details.
function findNodes(obj, out = [], depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 8 || out.length >= 6) return out;
  if (obj.type === "node" && (obj.snippet || obj.selector || obj.nodeLabel)) { out.push({ snippet: obj.snippet || "", selector: obj.selector || "", label: obj.nodeLabel || "" }); return out; }
  for (const v of Array.isArray(obj) ? obj : Object.values(obj)) findNodes(v, out, depth + 1);
  return out;
}
const first = (audits, ids) => ids.map((id) => audits[id]).find(Boolean) || null;

export function readPsi(json) {
  const L = json?.lighthouseResult;
  if (!L?.audits) return null;
  const A = L.audits;
  const num = (id) => (typeof A[id]?.numericValue === "number" ? A[id].numericValue : null);

  const shots = A["screenshot-thumbnails"]?.details?.items || [];
  const lcpAudit = first(A, ["largest-contentful-paint-element", "lcp-breakdown-insight", "lcp-discovery-insight", "lcp-phases-insight"]);
  const shiftAudit = first(A, ["layout-shifts", "cls-culprits-insight", "layout-shift-elements"]);

  // Other companies' scripts, heaviest first. Old audit: third-party-summary. New: third-parties-insight.
  const tpAudit = first(A, ["third-party-summary", "third-parties-insight"]);
  const firstParty = (L.entities || []).find((e) => e.isFirstParty)?.name;
  const rows = (tpAudit?.details?.items || []).map((it) => ({
    name: typeof it.entity === "string" ? it.entity : it.entity?.text || it.entity?.name || "Unknown",
    ms: it.blockingTime ?? it.mainThreadTime ?? 0,
  })).filter((t) => t.ms > 0);
  const thirdParty = rows.filter((t) => t.name !== firstParty).sort((a, b) => b.ms - a.ms);
  const firstPartyMs = rows.find((t) => t.name === firstParty)?.ms ?? null;

  // Real-visitor data (Chrome UX Report), only present when the site has enough traffic.
  const m = json.loadingExperience?.metrics || {};
  const field = m.LARGEST_CONTENTFUL_PAINT_MS || m.CUMULATIVE_LAYOUT_SHIFT_SCORE || m.INTERACTION_TO_NEXT_PAINT ? {
    lcpMs: m.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null,
    inpMs: m.INTERACTION_TO_NEXT_PAINT?.percentile ?? null,
    cls: m.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null ? m.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100 : null,
    overall: json.loadingExperience?.overall_category || null,
    scope: json.loadingExperience?.origin_fallback ? "whole site" : "this page",
  } : null;

  const a11y = (id) => (A[id] ? (A[id].score === 1 ? "pass" : A[id].score === 0 ? "fail" : "na") : "na");
  return {
    screenshot: A["final-screenshot"]?.details?.data || L.fullPageScreenshot?.screenshot?.data || null,
    // Only call it an image when the element itself is one, and keep its file name so it can be found.
    lcpIsImage: /^\s*<(img|picture|video|svg)\b/i.test(findNodes(lcpAudit?.details)[0]?.snippet || ""),
    lcpFile: (() => {
      const src = ((findNodes(lcpAudit?.details)[0]?.snippet || "").match(/\bsrc=["']([^"']+)["']/i) || [])[1] || "";
      let real = src.replace(/&amp;/g, "&");
      const inner = real.match(/[?&]url=([^&]+)/);
      if (inner) { try { real = decodeURIComponent(inner[1]); } catch { /* keep as is */ } }
      const name = real.split(/[?#]/)[0].split("/").pop().slice(0, 60);
      return /\.[a-z0-9]{2,5}$/i.test(name) ? name : "";
    })(),
    filmstrip: shots.map((f) => ({ ms: f.timing, src: f.data })),
    lcpMs: num("largest-contentful-paint"), fcpMs: num("first-contentful-paint"), tbtMs: num("total-blocking-time"), cls: num("cumulative-layout-shift"),
    lcpNode: findNodes(lcpAudit?.details)[0] || null,
    shiftNodes: findNodes(shiftAudit?.details),
    thirdParty, firstPartyMs,
    field,
    score: L.categories?.performance?.score != null ? Math.round(L.categories.performance.score * 100) : null,
    failing: { contrast: findNodes(A["color-contrast"]?.details).map((n) => n.label).filter(Boolean), tapTargets: findNodes(A["target-size"]?.details).map((n) => n.label).filter(Boolean) },
    a11y: {
      score: L.categories?.accessibility?.score != null ? Math.round(L.categories.accessibility.score * 100) : null,
      failed: (L.categories?.accessibility?.auditRefs || []).map((x) => A[x.id]).filter((a) => a && a.score === 0).map((a) => ({ id: a.id, title: String(a.title || "").replace(/[`\[\]]/g, "") })).slice(0, 10),
    },
    checks: { contrast: a11y("color-contrast"), tapTargets: a11y("target-size"), formLabels: a11y("label"), viewport: a11y("meta-viewport") },
    version: L.lighthouseVersion || null,
  };
}

// One run per address per day is kept in this tab's storage, so re-opening a report is instant.
export async function runPsi(url, { signal, strategy = "mobile" } = {}) {
  const key = `mk_psi5_${strategy}_${url}`;
  try { const c = JSON.parse(sessionStorage.getItem(key) || "null"); if (c && Date.now() - c.at < DAY) return { ok: true, data: c.data, cached: true }; } catch { /* no storage */ }
  const qs = new URLSearchParams({ url, strategy });
  qs.append("category", "performance"); qs.append("category", "accessibility");
  if (PSI_KEY) qs.set("key", PSI_KEY);
  let res;
  try { res = await fetch(`${API}?${qs}`, { signal }); } catch (e) { return { ok: false, reason: e?.name === "AbortError" ? "timeout" : "network" }; }
  if (!res.ok) return { ok: false, reason: res.status === 429 ? "quota" : res.status === 400 ? "unreachable" : "refused", status: res.status };
  const data = readPsi(await res.json().catch(() => null));
  if (!data) return { ok: false, reason: "unreadable" };
  // The filmstrip is the bulky part; keep it small enough for storage.
  try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch { /* too big or blocked: skip the cache */ }
  return { ok: true, data };
}
