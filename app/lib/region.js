// Does this visitor need to give consent before anything is stored?
// Country comes from the mk_cc cookie (set by netlify/edge-functions/geo.js from
// IP geolocation), with the browser time zone as a fallback.
export const CONSENT_KEY = "mk_consent_v1";
const CONSENT_COUNTRIES = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH"];
const EU_ATLANTIC = ["Atlantic/Canary", "Atlantic/Madeira", "Atlantic/Azores", "Atlantic/Reykjavik", "Atlantic/Faroe"];
const NON_EEA = ["Europe/Moscow", "Europe/Minsk", "Europe/Istanbul", "Europe/Kaliningrad", "Europe/Samara", "Europe/Volgograd", "Europe/Saratov", "Europe/Ulyanovsk", "Europe/Astrakhan", "Europe/Kirov"];

// ?consent=test previews the banner for the rest of the tab session.
export function testMode() {
  try {
    if (new URLSearchParams(window.location.search).get("consent") === "test") sessionStorage.setItem("mk_consent_test", "1");
    return sessionStorage.getItem("mk_consent_test") === "1";
  } catch { return false; }
}

export function needsConsent() {
  try {
    if (testMode()) return true;
    const cc = /(?:^|;\s*)mk_cc=([A-Z]{2})/.exec(document.cookie)?.[1];
    if (cc) return CONSENT_COUNTRIES.includes(cc);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return (tz.startsWith("Europe/") && !NON_EEA.includes(tz)) || EU_ATLANTIC.includes(tz);
  } catch { return false; }
}

export function readConsent() { try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch { return null; } }

// May analytics IDs be kept in the browser? Yes once analytics is accepted, or
// where no consent is required. No before a choice (or after a rejection) in
// consent regions.
export function canStoreIds() {
  const c = readConsent();
  return c ? !!c.analytics : !needsConsent();
}
