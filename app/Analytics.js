"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { paramsFromDataset, track } from "./lib/analytics";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const pageType = (path) => (path.startsWith("/apps/") ? "app" : "home");

export default function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  // Declarative clicks: any element with data-track="event_name" plus data-ev-* params.
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest?.("[data-track]");
      if (el) track(el.dataset.track, paramsFromDataset(el));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Client-side navigation doesn't reload the page, so GA4 needs a virtual page_view.
  // The first load is covered by the GA4 config tag itself.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    track("virtual_page_view", { page_path: pathname, page_title: document.title, page_type: pageType(pathname) });
  }, [pathname]);

  // section_view: once per section per page load, when 40% of it is on screen.
  useEffect(() => {
    const seen = new Set();
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      const name = en.target.dataset.section;
      if (en.isIntersecting && !seen.has(name)) { seen.add(name); track("section_view", { section_name: name }); io.unobserve(en.target); }
    }), { threshold: 0.4 });
    document.querySelectorAll("[data-section]").forEach((el) => io.observe(el));
    return () => io.disconnect();
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
