"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { track } from "./lib/analytics";
import { audienceKey } from "./lib/site";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const LP_VERSION = "v4";

const pageType = (path) => (path.startsWith("/apps/") ? "app" : "home");

// Site-wide measurement. Spec: docs/datalayer-requirements.md
export default function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  // Declarative clicks: data-track="event" data-loc="where" data-app="app_key".
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest?.("[data-track]");
      if (!el) return;
      track(el.dataset.track, {
        cta_location: el.dataset.loc || null,
        cta_text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
        app_name: el.dataset.app || null,
        link_url: el.getAttribute("href") || null,
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Once per page load: context, booking confirmation, engagement timers.
  useEffect(() => {
    const qs = Object.fromEntries(new URLSearchParams(window.location.search));
    track("lp_context", {
      lp_audience: audienceKey(), lp_version: LP_VERSION, page_type: pageType(pathname),
      utm_source: qs.utm_source, utm_medium: qs.utm_medium, utm_campaign: qs.utm_campaign, utm_content: qs.utm_content, utm_term: qs.utm_term,
      has_gclid: !!qs.gclid,
    });
    // The booking tool redirects back with ?booked=1. This is the primary conversion.
    if (qs.booked === "1") track("call_booked", { lp_audience: audienceKey() });
    const timers = [30, 60].map((s) => setTimeout(() => { if (document.visibilityState === "visible") track(`engaged_${s}s`); }, s * 1000));
    return () => timers.forEach(clearTimeout);
  }, [pathname]);

  // Client-side navigation doesn't reload the page, so GA4 needs a virtual page_view.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    track("virtual_page_view", { page_path: pathname, page_title: document.title, page_type: pageType(pathname) });
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
