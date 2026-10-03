"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { track, setPage, emailDomain } from "./lib/analytics";
import { audienceKey, GTM_ID } from "./lib/site";

const LP_VERSION = "v4";

const pageType = (path) => (path.startsWith("/apps/") ? "tool" : path === "/" ? "home" : path === "/privacy" ? "legal" : "other");

// Site-wide measurement. Spec: docs/datalayer-requirements.md
export default function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  // Every click on something clickable is tracked, in the right category.
  // Tagged markup: data-track="nav_click | cta_click | outbound_click"
  // data-loc="surface" data-intent="what the CTA does" data-app="app_key".
  // Untagged: external links -> outbound_click, internal links -> nav_click,
  // buttons and other controls -> ui_interaction, unless the control's own
  // handler already pushed an event for this click. Dead clicks are ignored.
  useEffect(() => {
    const CLICKABLE = 'a[href], button, [role="button"], [role="tab"], [role="link"], summary, input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], select';
    const surfaceOf = (el) => el.dataset.loc || el.closest("[data-loc]")?.dataset.loc || (el.closest("footer") ? "footer" : el.closest("nav, header") ? "header" : null) || el.closest("[data-section]")?.dataset.section || el.closest("[role='dialog']")?.getAttribute("aria-labelledby") || "page";
    const textOf = (el) => el.getAttribute("aria-label") || (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60) || el.getAttribute("title") || el.value || null;
    const onClick = (e) => {
      const tagged = e.target.closest?.("[data-track]");
      const el = tagged || e.target.closest?.(CLICKABLE);
      if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return; // dead or non-clickable
      const href = el.getAttribute("href") || null;
      let host = null;
      try { const u = new URL(href, window.location.href); if (/^https?:$/.test(u.protocol) && u.host !== window.location.host) host = u.host; } catch { /* not a URL */ }
      const base = { click_surface: surfaceOf(el), click_text: textOf(el), click_url: href && href.startsWith("mailto:") ? "mailto" : href };

      if (tagged || host) {
        let event = tagged ? tagged.dataset.track : "outbound_click";
        // Booking is the primary CTA; every other call to action is secondary.
        const intent = el.dataset.intent || "book_call";
        if (event === "cta_click" && intent !== "book_call") event = "secondary_cta_click";
        if (event === "cta_click" || event === "secondary_cta_click") { base.cta_intent = intent; base.app_name = el.dataset.app || null; }
        if (event === "outbound_click") base.link_domain = host;
        track(event, base);
        return;
      }
      // Untagged control: wait for its own handler, then fill in if it stayed silent.
      const before = window.dataLayer?.length || 0;
      setTimeout(() => {
        if ((window.dataLayer?.length || 0) !== before) return;
        if (href) track("nav_click", base);
        else track("ui_interaction", { ui_kind: el.getAttribute("role") || el.type || el.tagName.toLowerCase(), ui_label: base.click_text, ui_state: el.getAttribute("aria-expanded") || el.getAttribute("aria-selected") || (el.checked != null ? String(el.checked) : "clicked"), click_surface: base.click_surface });
      }, 0);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Forms, by delegation. Markup: <form data-form="type" data-loc="where">.
  // form_start on first focus; form_details_entered when a valid email is left
  // in the field (domain only). form_submit is pushed by each form handler.
  useEffect(() => {
    const started = new WeakSet(), entered = new WeakMap();
    const info = (el) => { const f = el.closest?.("form[data-form]"); return f && { f, form_type: f.dataset.form, form_location: f.dataset.loc || null }; };
    const onFocus = (e) => { const i = info(e.target); if (!i || started.has(i.f)) return; started.add(i.f); track("form_start", { form_type: i.form_type, form_location: i.form_location }); };
    const onBlur = (e) => {
      const i = info(e.target); if (!i || e.target.type !== "email") return;
      const d = emailDomain(e.target.value); if (!d || entered.get(i.f) === d) return;
      entered.set(i.f, d);
      track("form_details_entered", { form_type: i.form_type, form_location: i.form_location, entered_fields: "email", email_domain: d });
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => { document.removeEventListener("focusin", onFocus); document.removeEventListener("focusout", onBlur); };
  }, []);

  // Errors, as one category: site_error. Covers script errors, failed promises,
  // files that fail to load, failed API calls and the 404 page. Messages are
  // trimmed and never include what a visitor typed. Capped per page to avoid floods.
  useEffect(() => {
    let sent = 0; const seen = new Set();
    const push = (p) => {
      const key = `${p.error_type}|${p.error_source}|${p.error_message}`;
      if (sent >= 10 || seen.has(key)) return;
      seen.add(key); sent++;
      track("site_error", { error_type: p.error_type, error_source: p.error_source || null, error_message: String(p.error_message || "").slice(0, 150), error_status: p.error_status ?? null, error_fatal: !!p.error_fatal });
    };
    const file = (u) => { try { const x = new URL(u, window.location.href); return x.host === window.location.host ? x.pathname : x.host + x.pathname; } catch { return null; } };
    const onError = (e) => {
      const t = e.target;
      // A script, image, stylesheet or font that failed to load.
      if (t && t !== window && (t.src || t.href)) { push({ error_type: "resource_load", error_source: file(t.src || t.href), error_message: `${t.tagName.toLowerCase()} failed to load` }); return; }
      push({ error_type: "javascript", error_source: e.filename ? `${file(e.filename)}:${e.lineno || 0}` : null, error_message: e.message, error_fatal: true });
    };
    const onRejection = (e) => push({ error_type: "unhandled_promise", error_source: null, error_message: e.reason?.message || String(e.reason) });
    // Failed calls to this site's own API (the tools).
    const realFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      const own = url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/");
      try {
        const res = await realFetch(...args);
        if (own && res.status >= 400) push({ error_type: res.status >= 500 ? "api_server" : res.status === 429 ? "api_rate_limited" : "api_request", error_source: file(url), error_message: `HTTP ${res.status}`, error_status: res.status });
        return res;
      } catch (err) {
        if (own) push({ error_type: "api_network", error_source: file(url), error_message: err?.name === "AbortError" ? "request aborted" : "network failure" });
        throw err;
      }
    };
    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    return () => { window.fetch = realFetch; window.removeEventListener("error", onError, true); window.removeEventListener("unhandledrejection", onRejection); };
  }, []);

  // page_view on load and on every client-side navigation, with campaign context.
  useEffect(() => {
    setPage(pathname);
    const qs = Object.fromEntries(new URLSearchParams(window.location.search));
    track("page_view", {
      page_title: document.title, page_type: pageType(pathname), navigation_type: first.current ? "load" : "route_change",
      lp_audience: audienceKey(), lp_version: LP_VERSION,
      utm_source: qs.utm_source || null, utm_medium: qs.utm_medium || null, utm_campaign: qs.utm_campaign || null, utm_content: qs.utm_content || null, utm_term: qs.utm_term || null,
      has_gclid: !!qs.gclid,
    });
    first.current = false;
    // The 404 page marks itself; report which missing address was asked for.
    if (document.querySelector("[data-error-page='404']")) track("site_error", { error_type: "page_not_found", error_source: pathname, error_message: "404 page shown", error_status: 404, error_fatal: false });
    // The booking tool redirects back with ?booked=1. This is the primary conversion.
    if (qs.booked === "1") track("call_booked", { lp_audience: audienceKey() });
    const timers = [30, 60].map((s) => setTimeout(() => { if (document.visibilityState === "visible") track("engaged_time", { engaged_seconds: s }); }, s * 1000));
    return () => timers.forEach(clearTimeout);
  }, [pathname]);

  // section_view (once each, 40% visible) and scroll_depth (25/50/75/90).
  useEffect(() => {
    const seen = new Set();
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      const name = en.target.dataset.section;
      if (en.isIntersecting && !seen.has(name)) { seen.add(name); track("section_view", { section_name: name }); io.unobserve(en.target); }
    }), { threshold: 0.4 });
    // Sections can appear later (tool reports), so keep picking up new ones.
    const watched = new WeakSet();
    const scan = () => document.querySelectorAll("[data-section]").forEach((el) => { if (!watched.has(el)) { watched.add(el); io.observe(el); } });
    const t = setTimeout(scan, 600);
    const iv = setInterval(scan, 1500);

    const hit = new Set();
    const onScroll = () => {
      const H = document.documentElement.scrollHeight - window.innerHeight;
      const pc = H > 0 ? (window.scrollY / H) * 100 : 0;
      for (const d of [25, 50, 75, 90]) if (pc >= d && !hit.has(d)) { hit.add(d); track("scroll_depth", { percent_scrolled: d }); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(t); clearInterval(iv); io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, [pathname]);

  if (!GTM_ID) return null;
  return (
    <Script id="gtm" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('consent', 'default', {
  analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  region: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','CH','GB'],
  wait_for_update: 500
});
gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
`}</Script>
  );
}
