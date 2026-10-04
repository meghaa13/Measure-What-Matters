"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { CTA, bookHref, bookTarget } from "./lib/site";

const NAV = [["story", "Finding the problem"], ["method", "What I build"], ["work", "Proof"], ["stack", "Stack"], ["tools", "Tools"]];
const SPY = ["story", "method", "work", "stack", "tools", "apps", "contact"];

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: "smooth" });
};

// Fixed nav, always visible (scroll-spy on the landing page), and the floating "Book" button,
// which appears once the hero is gone and hides inside the inline CTA zones.
// On app pages (home={false}) the links go back to the landing page sections and
// `current` marks which nav item the page belongs to.
export default function SiteChrome({ home = true, current = null }) {
  const [active, setActive] = useState(home ? null : current);
  const [fab, setFab] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    let lock = 0, raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight, y = window.scrollY;
      if (home && Date.now() > lock) {
        let cur = null;
        for (const id of SPY) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < vh * 0.4) cur = id; }
        setActive(cur);
      }
      const inZone = [...document.querySelectorAll("[data-cta-zone]")].some((z) => { const r = z.getBoundingClientRect(); return r.top < vh * 0.9 && r.bottom > vh * 0.1; });
      setFab(y > vh * 0.7 && !inZone);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    window.__navLock = (ms) => { lock = Date.now() + ms; };
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // On the landing page, smooth-scroll in place; elsewhere, a normal link to "/#id".
  const go = (id) => (e) => { setMenu(false); if (!home) return; e.preventDefault(); window.__navLock?.(900); setActive(id); scrollToId(id); };
  const book = (e) => { if (!bookTarget) go("contact")(e); };
  const href = (id) => (home ? `#${id}` : `/#${id}`);
  const bookLink = bookTarget ? bookHref : href("contact");

  return (
    <>
      <div className="progress"><div data-progress="1" /></div>
      <nav className="nav">
        <a href={home ? "#top" : "/"} aria-label="Megha Karnwal — home" onClick={go("top")} data-track="nav_click" data-loc="header">
          <Logo />
        </a>
        <div className="nav-links">
          {NAV.map(([id, label]) => (
            <a key={id} href={href(id)} onClick={go(id)} aria-current={active === id ? "true" : undefined}
              className={`nav-link${active === id ? " on" : ""}`} data-track="nav_click" data-loc="header">{label}</a>
          ))}
          <a href={bookLink} target={bookTarget} rel={bookTarget ? "noopener" : undefined} onClick={go("contact")} className={`nav-cta${fab ? " away" : ""}`} data-track="cta_click" data-loc="header">
            {CTA}<span aria-hidden="true">→</span>
          </a>
          <button type="button" className={`nav-burger${menu ? " open" : ""}`} aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} aria-controls="nav-menu" onClick={() => setMenu(!menu)}><span /><span /><span /></button>
        </div>
      </nav>
      {/* Phone menu: the header links are hidden on small screens */}
      <div id="nav-menu" className="nav-menu" hidden={!menu}>
        {[...NAV, ["apps", "Side projects"], ["faq", "FAQ"], ["contact", "Contact"]].map(([id, label]) => (
          <a key={id} href={href(id)} onClick={go(id)} data-track="nav_click" data-loc="header_menu">{label}</a>
        ))}
      </div>
      <a href={bookLink} target={bookTarget} rel={bookTarget ? "noopener" : undefined} onClick={book}
        className={`fab${fab ? " on" : ""}`} aria-hidden={!fab} tabIndex={fab ? 0 : -1} data-track="cta_click" data-loc="floating">
        <span className="face"><img src="/uploads/img1.webp" alt="" /></span>
        {CTA}<span aria-hidden="true">→</span>
      </a>
    </>
  );
}
