"use client";
import { useEffect, useState } from "react";
import { CTA, bookHref, bookTarget } from "./lib/site";

const NAV = [["story", "Approach"], ["method", "Method"], ["work", "Proof"], ["tools", "Tools"]];
const SPY = ["story", "method", "work", "tools", "apps", "contact"];

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: "smooth" });
};

// Fixed nav (scroll-spy, hides on scroll down) and the floating "Book" button,
// which appears once the hero is gone and hides inside the inline CTA zones.
export default function SiteChrome() {
  const [active, setActive] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [fab, setFab] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY, lock = 0, raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight, y = window.scrollY;
      if (Date.now() > lock) {
        let cur = null;
        for (const id of SPY) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < vh * 0.4) cur = id; }
        setActive(cur);
      }
      setHidden((h) => (y < 160 ? false : y > lastY + 6 ? true : y < lastY - 6 ? false : h));
      lastY = y;
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

  const go = (id) => (e) => { e.preventDefault(); window.__navLock?.(900); setActive(id); scrollToId(id); };
  const book = (e) => { if (!bookTarget) go("contact")(e); };

  return (
    <>
      <div className="progress"><div data-progress="1" /></div>
      <nav className={`nav${hidden ? " hidden" : ""}`}>
        <a href="#top" aria-label="Megha Karnwal — home" onClick={go("top")}>
          <span className="logo"><span>mk</span><span className="dot" /></span>
        </a>
        <div className="nav-links">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={go(id)} aria-current={active === id ? "true" : undefined}
              className={`nav-link${active === id ? " on" : ""}`} data-track="anchor_click" data-loc="nav">{label}</a>
          ))}
          <a href="#contact" onClick={go("contact")} className={`nav-cta${fab ? " away" : ""}`} data-track="cta_click" data-loc="nav">
            {CTA}<span aria-hidden="true">→</span>
          </a>
        </div>
      </nav>
      <a href={bookHref} target={bookTarget} rel={bookTarget ? "noopener" : undefined} onClick={book}
        className={`fab${fab ? " on" : ""}`} aria-hidden={!fab} tabIndex={fab ? 0 : -1} data-track="cta_click" data-loc="floating">
        <span className="face"><img src="/uploads/img1.png" alt="" /></span>
        {CTA}<span aria-hidden="true">→</span>
      </a>
    </>
  );
}
