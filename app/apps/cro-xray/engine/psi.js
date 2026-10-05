// Speed, mobile and accessibility, from Google's PageSpeed Insights API.
// Called from the visitor's browser, not from a server function: a run takes 10-30
// seconds, and waiting on it server-side would cost compute for nothing.
// The key is public by design (NEXT_PUBLIC_PAGESPEED_KEY): restrict it in Google Cloud
// to this site's address and to the PageSpeed Insights API only.
// Lighthouse renames audits between versions, so every audit is read defensively:
// one that is missing is skipped, never reported as a failure.
const KEY = process.env.NEXT_PUBLIC_PAGESPEED_KEY || "";

const firstNode = (o, depth = 0) => {
  if (!o || typeof o !== "object" || depth > 6) return null;
  if (o.snippet || o.nodeLabel) return { label: o.nodeLabel || "", snippet: o.snippet || "", selector: o.selector || "" };
  for (const v of Array.isArray(o) ? o : Object.values(o)) { const n = firstNode(v, depth + 1); if (n) return n; }
  return null;
};
const nodes = (audit) => (audit?.details?.items || []).map((i) => firstNode(i)).filter(Boolean).slice(0, 4);
const show = (n) => (n.label && n.label.length < 90 ? `"${n.label}"` : n.selector || n.snippet.slice(0, 90));

export async function runPsi(url, strategy) {
  const q = new URLSearchParams({ url, strategy });
  q.append("category", "performance"); q.append("category", "accessibility");
  if (KEY) q.set("key", KEY);
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(res.status === 429 ? "PageSpeed's free limit has been reached for now." : json.error?.message?.split("\n")[0]?.slice(0, 160) || "PageSpeed couldn't test this page."), { status: res.status });
  return summarise(json, strategy);
}

// Pick what the report needs out of a PageSpeed response.
export function summarise(json, strategy) {
  const lr = json.lighthouseResult || {}, a = lr.audits || {};
  const le = json.loadingExperience?.metrics ? json.loadingExperience : null;
  const m = le?.metrics || {};
  return {
    strategy, version: lr.lighthouseVersion || null,
    lab: { lcp: a["largest-contentful-paint"]?.numericValue ?? null, cls: a["cumulative-layout-shift"]?.numericValue ?? null, tbt: a["total-blocking-time"]?.numericValue ?? null },
    // Real-user numbers, when Google has enough visits. origin = for the whole site, not this page.
    field: le ? { lcp: m.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null, cls: m.CUMULATIVE_LAYOUT_SHIFT_SCORE ? m.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100 : null, inp: m.INTERACTION_TO_NEXT_PAINT?.percentile ?? null, origin: !!le.origin_fallback } : null,
    lcpNode: firstNode(a["largest-contentful-paint-element"]?.details) || firstNode(a["lcp-breakdown-insight"]?.details) || firstNode(a["lcp-discovery-insight"]?.details),
    clsNode: firstNode(a["layout-shifts"]?.details) || firstNode(a["layout-shift-elements"]?.details) || firstNode(a["cls-culprits-insight"]?.details),
    audits: Object.fromEntries(["color-contrast", "label", "image-alt", "target-size", "link-name", "button-name", "meta-viewport", "viewport", "viewport-insight"]
      .filter((id) => a[id] && a[id].score != null).map((id) => [id, { pass: a[id].score >= 0.9, nodes: nodes(a[id]) }])),
    screenshot: a["final-screenshot"]?.details?.data || lr.fullPageScreenshot?.screenshot?.data || null,
  };
}

const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;

// Findings from one PageSpeed run. Thresholds are Google's published "good" limits.
export function psiFindings(p) {
  const out = [], dev = p.strategy === "mobile" ? "on mobile" : "on desktop";
  const add = (id, area, sev, title, detail, extra = {}) => out.push({ id, area, sev, method: "PageSpeed", title, detail, ...extra });
  const real = p.field && !p.field.origin;
  const src = real ? "real visitors" : "a lab test";

  const lcp = real && p.field.lcp != null ? p.field.lcp : p.lab.lcp;
  if (lcp != null) {
    const el = p.lcpNode ? ` The largest element is ${show(p.lcpNode)}.` : "";
    if (lcp > 2500) add("SP-1", "Speed", lcp > 4000 ? "high" : "medium", `Main content takes ${sec(lcp)} to appear ${dev}`, `Largest Contentful Paint from ${src}; Google's "good" limit is 2.5 s.${el}`, { fix: "Make the largest element load first: smaller image, preload it, less blocking script.", quick: true });
    else add("SP-0", "Speed", "pass", `Main content appears in ${sec(lcp)} ${dev}`, `Largest Contentful Paint from ${src}; within Google's 2.5 s limit.`);
  }
  const cls = real && p.field.cls != null ? p.field.cls : p.lab.cls;
  if (cls != null && cls > 0.1) add("SP-2", "Speed", "medium", `Layout shifts while loading ${dev} (score ${cls.toFixed(2)})`, `Cumulative Layout Shift from ${src}; Google's "good" limit is 0.1.${p.clsNode ? ` Shifting element: ${show(p.clsNode)}.` : ""}`, { fix: "Reserve space for images, embeds and late-loading banners.", quick: true });
  // Responsiveness (INP) only exists as real-visitor data. The lab number is a stand-in.
  if (p.field?.inp != null && p.field.inp > 200) add("SP-3", "Speed", "medium", `Slow to respond to taps and clicks (${Math.round(p.field.inp)} ms)`, `Interaction to Next Paint from real visitors${p.field.origin ? " across the whole site" : ""}; Google's "good" limit is 200 ms.`, { fix: "Reduce the JavaScript that runs on interaction.", quick: true });
  else if (p.field?.inp == null && p.lab.tbt != null && p.lab.tbt > 300) add("SP-4", "Speed", "low", `Page is busy for ${Math.round(p.lab.tbt)} ms while loading ${dev}`, "Total Blocking Time from a lab test. It stands in for responsiveness, which can only be measured on real visitors.", { fix: "Defer or trim JavaScript that runs at load.", quick: true });

  const A = p.audits, list = (x) => (x.nodes.length ? ` For example: ${x.nodes.map(show).join(", ")}.` : "");
  if (A["color-contrast"] && !A["color-contrast"].pass) add("AC-1", "Accessibility", "medium", "Some text is hard to read against its background", `Contrast below the WCAG minimum.${list(A["color-contrast"])}`, { fix: "Darken the text or lighten the background until it passes.", quick: true });
  if (A.label && !A.label.pass) add("AC-2", "Accessibility", "medium", "Form fields without a name a screen reader can announce", `${list(A.label).trim() || "Fields are missing labels."}`, { fix: "Give each field a label.", quick: true });
  if (A["image-alt"] && !A["image-alt"].pass) add("AC-3", "Accessibility", "low", "Images without a text description", list(A["image-alt"]).trim() || "Images are missing alt text.", { fix: "Add alt text to meaningful images.", quick: true });
  const unnamed = ["link-name", "button-name"].filter((id) => A[id] && !A[id].pass);
  if (unnamed.length) add("AC-4", "Accessibility", "medium", "Links or buttons with no readable name", unnamed.map((id) => list(A[id]).trim()).filter(Boolean).join(" ") || "Usually icon-only buttons.", { fix: "Add visible text or an aria-label.", quick: true });
  if (p.strategy === "mobile") {
    if (A["target-size"] && !A["target-size"].pass) add("MB-1", "Mobile", "medium", "Tap targets are too small or too close together", `Below the WCAG 2.2 minimum of 24 × 24 px.${list(A["target-size"])}`, { fix: "Give links and buttons more size or spacing on phones.", quick: true });
    const vp = A["meta-viewport"] || A.viewport || A["viewport-insight"];
    if (vp && !vp.pass) add("MB-2", "Mobile", "high", "Page isn't set up to fit phone screens", "The viewport setting is missing or blocks zooming.", { fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> and allow zoom.', quick: true });
  }
  for (const area of ["Accessibility", "Mobile"]) if ((area !== "Mobile" || p.strategy === "mobile") && !out.some((f) => f.area === area)) add(`${area.slice(0, 2).toUpperCase()}-0`, area, "pass", `No ${area.toLowerCase()} problems found by the automated checks`, "Automated checks cover only part of this; a manual review finds more.");
  return out;
}
