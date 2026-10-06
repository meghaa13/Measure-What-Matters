// Single entry point for every dataLayer push on the site.
// Spec: docs/datalayer-requirements.md.
//
// Every push carries the same universal context (CONTEXT below), then the
// parameters of its category: page_view, nav_click, cta_click, outbound_click,
// faq_interaction, ui_interaction, form_*, tool_*, engagement, consent.
// Never push what a visitor typed (names, emails, URLs). The only exception is
// the domain part of an email (email_domain), never the address itself.
import { canStoreIds } from "./region";

const SESSION_GAP = 30 * 60 * 1000; // a session ends after 30 minutes of inactivity
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, "").slice(0, 20);

// In-memory fallback, used when IDs may not be stored (no consent yet).
const mem = { vid: null, sid: null, path: null, prev: null };

function ids() {
  if (!canStoreIds()) {
    mem.vid ||= uid(); mem.sid ||= uid();
    return { session_id: mem.sid, visitor_id: mem.vid, visitor_type: "unknown" };
  }
  try {
    const now = Date.now();
    let v = JSON.parse(localStorage.getItem("mk_vid") || "null");
    let s = JSON.parse(sessionStorage.getItem("mk_sid") || "null");
    if (!v) v = { id: mem.vid || uid(), sessions: 0 };
    if (!s || now - s.last > SESSION_GAP) { s = { id: mem.sid || uid() }; v.sessions += 1; mem.sid = null; }
    s.last = now;
    localStorage.setItem("mk_vid", JSON.stringify(v));
    sessionStorage.setItem("mk_sid", JSON.stringify(s));
    return { session_id: s.id, visitor_id: v.id, visitor_type: v.sessions > 1 ? "returning" : "new" };
  } catch {
    mem.vid ||= uid(); mem.sid ||= uid();
    return { session_id: mem.sid, visitor_id: mem.vid, visitor_type: "unknown" };
  }
}

// Device from the window size, not the user agent (which is often wrong).
export function deviceType() {
  const w = window.innerWidth;
  return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

// Called by Analytics.js on every page change.
export function setPage(path) {
  if (mem.path === path) return;
  mem.prev = mem.path; mem.path = path;
}
function previousPath() {
  if (mem.prev) return mem.prev;
  try { const r = new URL(document.referrer); if (r.origin === window.location.origin) return r.pathname; } catch { /* no referrer */ }
  return "(entry)";
}

// CONTEXT: on every push.
function context() {
  return { ...ids(), page_path: window.location.pathname, previous_page_path: previousPath(), device_type: deviceType() };
}

export function track(event, params = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...context(), ...params });
}

// Forget stored IDs (called when analytics consent is rejected).
export function clearIds() {
  try { localStorage.removeItem("mk_vid"); sessionStorage.removeItem("mk_sid"); } catch { /* nothing stored */ }
}

// ── Category helpers ────────────────────────────────────────────────────────
// Tools: one schema for every micro tool. stage: "start" | "complete" | "error" | "action"
export const TOOLS = { scan: "tag_health_scan", lead: "lead_path_xray", ai: "ai_visibility", plan: "clean_tracking_plan", cro: "cro_xray" };
export function toolEvent(tool, stage, params = {}) {
  track(`tool_${stage}`, { tool_name: tool, ...params });
}

// Forms: only the email's domain is ever sent.
export const emailDomain = (email) => (String(email).trim().toLowerCase().match(/^[^\s@]+@([a-z0-9.-]+\.[a-z]{2,})$/)?.[1]) || null;
export function formSubmit(form_type, form_location, { email, status = "success", failure_reason = null, ...rest } = {}) {
  track("form_submit", { form_type, form_location, submit_status: status, failure_reason, email_domain: emailDomain(email), ...rest });
}

// Small UI controls (tabs, steppers, accordions that aren't the FAQ).
export function uiEvent(ui_kind, ui_label, ui_state, params = {}) {
  track("ui_interaction", { ui_kind, ui_label, ui_state, ...params });
}
