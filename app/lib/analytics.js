// Single entry point for every dataLayer push on the site.
// Spec: docs/datalayer-requirements.md. Never pass personal data (names, emails, free text) as params.

export function track(event, params = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

// Turns data-ev-* attributes into snake_case params: data-ev-cta-location="hero" -> { cta_location: "hero" }
export function paramsFromDataset(el) {
  const out = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    if (!k.startsWith("ev") || k === "ev") continue;
    const key = k.slice(2).replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
    out[key] = v;
  }
  return out;
}
