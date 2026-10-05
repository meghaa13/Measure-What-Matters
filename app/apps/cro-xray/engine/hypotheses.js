// Turn findings into the two lists at the end of the report: ideas worth testing
// (the outcome is uncertain) and fixes that need no test (plain defects).
// Order: severity first, then how many of the scanned pages show the same thing.
const RANK = { high: 3, medium: 2, low: 1 };
const path = (url) => { try { const u = new URL(url); return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname); } catch { return url; } };

function group(pages, pick) {
  const map = new Map();
  for (const p of pages) for (const f of p.findings) {
    if (!pick(f) || !RANK[f.sev]) continue;
    const g = map.get(f.id) || { ...f, pages: [] };
    if (RANK[f.sev] > RANK[g.sev]) g.sev = f.sev;
    if (!g.pages.includes(path(p.url))) g.pages.push(path(p.url));
    map.set(f.id, g);
  }
  return [...map.values()].sort((a, b) => RANK[b.sev] - RANK[a.sev] || b.pages.length - a.pages.length);
}

export function buildPlan(pages) {
  const tests = group(pages, (f) => f.hyp).slice(0, 5).map((f) => ({
    id: f.id, sev: f.sev, area: f.area, pages: f.pages,
    text: `Because ${f.hyp.because} on ${f.pages.join(" and ")}, we believe ${f.hyp.change} will improve ${f.hyp.metric}.`,
    guardrail: f.hyp.guardrail,
  }));
  const fixes = group(pages, (f) => f.quick).slice(0, 8).map((f) => ({ id: f.id, sev: f.sev, area: f.area, pages: f.pages, title: f.title, fix: f.fix }));
  return { tests, fixes };
}

export const AREAS = ["Positioning", "Calls to action", "Trust", "Forms", "Speed", "Mobile", "Accessibility", "Measurement"];

// One line per area for the summary tiles: the worst thing found there.
export function areaStatus(pages) {
  return AREAS.map((area) => {
    const fs = pages.flatMap((p) => p.findings.filter((f) => f.area === area));
    const worst = fs.reduce((m, f) => Math.max(m, RANK[f.sev] || 0), 0);
    const n = fs.filter((f) => RANK[f.sev]).length;
    if (area === "Positioning" && !worst) return { area, cls: "unknown", text: "For your review" };
    if (!fs.length) return { area, cls: "unknown", text: "Not checked" };
    return { area, cls: worst === 3 ? "bad" : worst ? "warn" : "ok", text: n ? `${n} to look at` : "Nothing flagged" };
  });
}
