// Single entry point for every dataLayer push on the site.
// Spec: docs/datalayer-requirements.md. Never pass personal data (names, emails, free text) as params.

export function track(event, params = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}
