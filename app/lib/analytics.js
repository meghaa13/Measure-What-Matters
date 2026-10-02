// Single entry point for every dataLayer push on the site.
// Spec: docs/datalayer-requirements.md. Never pass personal data (names, emails, free text) as params.

export function track(event, params = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

// Shared events for every micro tool, so one GA4 tag and one `tool_name` dimension cover them all.
//   stage: "start" | "complete" | "error" | "action"
// Never pass what the visitor typed (URLs, emails); only labels and counts.
export const TOOLS = { scan: "tag_health_scan", lead: "lead_path_xray", ai: "ai_visibility", plan: "clean_tracking_plan" };
export function toolEvent(tool, stage, params = {}) {
  track(`tool_${stage}`, { tool_name: tool, ...params });
}
