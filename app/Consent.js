"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { track } from "./lib/analytics";

// Cookie consent for visitors in consent-required regions (EEA, UK, Switzerland).
// Region comes from the browser time zone: free, no extra request, no IP lookup.
// Google's own Consent Mode default (in Analytics.js) already denies storage in
// these countries by IP, so a missed visitor stays denied, never tracked by mistake.
// While the banner is up the page is blurred and can't be used.
const KEY = "mk_consent_v1";
const EU_ATLANTIC = ["Atlantic/Canary", "Atlantic/Madeira", "Atlantic/Azores", "Atlantic/Reykjavik", "Atlantic/Faroe"];
const NON_EEA = ["Europe/Moscow", "Europe/Minsk", "Europe/Istanbul", "Europe/Kaliningrad", "Europe/Samara", "Europe/Volgograd", "Europe/Saratov", "Europe/Ulyanovsk", "Europe/Astrakhan", "Europe/Kirov"];

function needsConsent() {
  try {
    if (testMode()) return true; // preview from outside Europe
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return (tz.startsWith("Europe/") && !NON_EEA.includes(tz)) || EU_ATLANTIC.includes(tz);
  } catch { return false; }
}

// ?consent=test previews the banner for the rest of the tab session.
function testMode() {
  try {
    if (new URLSearchParams(window.location.search).get("consent") === "test") sessionStorage.setItem("mk_consent_test", "1");
    return sessionStorage.getItem("mk_consent_test") === "1";
  } catch { return false; }
}

function read() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
function save(c) { try { localStorage.setItem(KEY, JSON.stringify({ ...c, at: Date.now() })); } catch { /* private mode */ } }

// GTM only reads consent commands pushed as an arguments object, like gtag() does.
function gtag() { window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }
function apply({ analytics, ads }) {
  gtag("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: ads ? "granted" : "denied",
    ad_user_data: ads ? "granted" : "denied",
    ad_personalization: ads ? "granted" : "denied",
  });
}

export function openConsent() { window.dispatchEvent(new Event("mk:consent")); }

export default function Consent() {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [choice, setChoice] = useState({ analytics: true, ads: false });
  const [decided, setDecided] = useState(false);
  const pathname = usePathname();
  // The privacy notice must stay readable, so the banner steps aside there and returns after.
  const onPrivacy = pathname === "/privacy";

  useEffect(() => {
    const stored = read();
    if (stored && !testMode()) { apply(stored); setChoice(stored); setDecided(true); }
    else if (needsConsent()) setOpen(true);
  }, []);

  useEffect(() => {
    const reopen = () => { setMore(true); setOpen(true); };
    window.addEventListener("mk:consent", reopen);
    return () => window.removeEventListener("mk:consent", reopen);
  }, []);

  // Blur and lock the page behind the banner (see show below).
  const show = open && (!onPrivacy || decided || more);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("consent-open", show);
    return () => root.classList.remove("consent-open");
  }, [show]);

  const decide = (c, method) => {
    apply(c); save(c); setChoice(c); setDecided(true); setOpen(false); setMore(false);
    track("consent_update", { analytics_consent: c.analytics ? "granted" : "denied", ads_consent: c.ads ? "granted" : "denied", method });
  };

  if (!show) return null;
  return (
    <div className="consent-layer" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="consent-card">
        <span className="eyebrow">PRIVACY</span>
        <h2 id="consent-title">Can I measure your visit?</h2>
        <p>I use Google Analytics to see which pages and tools are useful. No ads, no selling data, and nothing you type into the tools is stored. <a href="/privacy">Privacy notice</a></p>
        {more && (
          <div className="consent-opts">
            <label><input type="checkbox" checked disabled /> <span><b>Essential</b> Remembers this choice. Always on.</span></label>
            <label><input type="checkbox" checked={choice.analytics} onChange={(e) => setChoice({ ...choice, analytics: e.target.checked })} /> <span><b>Analytics</b> Anonymous visit and tool usage stats (Google Analytics).</span></label>
            <label><input type="checkbox" checked={choice.ads} onChange={(e) => setChoice({ ...choice, ads: e.target.checked })} /> <span><b>Advertising</b> Measures whether my ads led you here (Google Ads, LinkedIn).</span></label>
          </div>
        )}
        <div className="consent-btns">
          <button type="button" className="btn btn-ghost" onClick={() => decide({ analytics: false, ads: false }, "reject_all")}>Reject all</button>
          {more
            ? <button type="button" className="btn btn-ghost" onClick={() => decide(choice, "save_choices")}>Save choices</button>
            : <button type="button" className="btn btn-ghost" onClick={() => setMore(true)}>Choose</button>}
          <button type="button" className="btn btn-primary" onClick={() => decide({ analytics: true, ads: true }, "accept_all")}>Accept all</button>
        </div>
      </div>
    </div>
  );
}

export function ConsentLink({ className }) {
  return <button type="button" className={`consent-link ${className || ""}`} onClick={openConsent}>Cookie settings</button>;
}
