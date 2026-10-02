"use client";
import { useEffect, useRef, useState } from "react";

// Scrollytelling: the section pins while four steps play as you scroll.
// On narrow screens or with reduced motion it falls back to a stacked list.
const STEPS = [
  { t: "Find the tags", d: "Reads the live homepage for Google tag and GTM IDs. If the site blocks automated visits, it falls back to the latest archived copy, labelled as such." },
  { t: "Read the configuration", d: "Fetches each container straight from Google and reads it as data. The code is parsed, never run." },
  { t: "Map what's tracked", d: "Every tag, event, conversion and trigger, translated into plain English: what fires, when, and what it sends." },
  { t: "Find what's missing or broken", d: "Checks the page for forms, calls, bookings and video, then runs the rules library. Every finding carries a confidence label." },
];
const PIN_TOP = 90;

function Visual({ i, on }) {
  if (i === 0) return (
    <div className="v v-html">
      <div className="label">VIEW-SOURCE · acme-store.com</div>
      <pre>{`<head>
  <script async src="https://www.`}<mark className={on ? "hit" : ""}>googletagmanager.com/gtm.js?id=GTM-K7XQ2P</mark>{`">
  </script>
  <script>gtag('config', '`}<mark className={on ? "hit d2" : ""}>G-4RT9LMQ2ZX</mark>{`');</script>
</head>`}</pre>
      <div className="found">
        <span className="pill ok" style={{ transitionDelay: ".6s", opacity: on ? 1 : 0 }}>GTM-K7XQ2P</span>
        <span className="pill ok" style={{ transitionDelay: ".8s", opacity: on ? 1 : 0 }}>G-4RT9LMQ2ZX</span>
        <span className="pill info" style={{ transitionDelay: "1s", opacity: on ? 1 : 0 }}>live homepage</span>
      </div>
    </div>
  );
  if (i === 1) return (
    <div className="v v-parse">
      <div className="raw"><span className="label">gtm.js · 182 KB</span>
        <code>{`{"function":"__gaawe","vtp_eventName":"generate_lead","consent":["list","analytics_storage"]…`}</code>
      </div>
      <div className="arrow">↓ parsed as data, never executed</div>
      <div className="cards">
        {[["GA4 event", "generate_lead"], ["Ads conversion", "AW-58…"], ["Consent", "analytics_storage"]].map(([a, b], k) => (
          <div key={a} style={{ opacity: on ? 1 : 0, transform: `translate3d(0,${on ? 0 : 10}px,0)`, transitionDelay: `${0.3 + k * 0.15}s` }}><span>{a}</span><code>{b}</code></div>
        ))}
      </div>
    </div>
  );
  if (i === 2) return (
    <div className="v v-map">
      {[["GA4 event", "generate_lead", "Custom event \"form_success\""], ["GA4 event", "cta_click_*", "Custom events matching cta_click_.*"], ["Ads conversion", "AW-58… · lead", "form_success AND Page path contains /demo"], ["Clarity", "project k2…", "All pages"]].map(([type, what, when], k) => (
        <div key={what} className="tagrow" style={{ opacity: on ? 1 : 0, transform: `translate3d(${on ? 0 : -14}px,0,0)`, transitionDelay: `${k * 0.14}s` }}>
          <b>{type}</b><code>{what}</code><span>fires on {when}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="v v-check">
      {[["Form submissions", "ok", "Tracked"], ["Phone links", "bad", "Not tracked"], ["Booking widget", "bad", "Not tracked"]].map(([a, c, s], k) => (
        <div key={a} className="cov" style={{ opacity: on ? 1 : 0, transitionDelay: `${k * 0.12}s` }}><span>{a}</span><span className={`pill ${c}`}>{s}</span></div>
      ))}
      <div className="issue" style={{ opacity: on ? 1 : 0, transform: `translate3d(0,${on ? 0 : 10}px,0)`, transitionDelay: ".45s" }}>
        <span className="pill bad">Confirmed</span><b>Lead counted on thank-you page load</b>
      </div>
      <div className="issue" style={{ opacity: on ? 1 : 0, transform: `translate3d(0,${on ? 0 : 10}px,0)`, transitionDelay: ".6s" }}>
        <span className="pill warn">Likely</span><b>page_view marked as a key event</b>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const track = useRef(null);
  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onResize = () => setPinned(!reduce && window.innerWidth >= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const tr = track.current;
    let raf = 0, smooth = 0;
    const tick = () => {
      const r = tr.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -(r.top - PIN_TOP) / Math.max(1, r.height - window.innerHeight + PIN_TOP)));
      smooth += (p - smooth) * 0.14;
      tr.style.setProperty("--hp", smooth.toFixed(4));
      setStep(Math.min(3, Math.floor(p * 4)));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [pinned]);

  const jump = (i) => {
    const tr = track.current;
    if (!pinned) return;
    const top = tr.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (tr.offsetHeight - window.innerHeight) * ((i + 0.5) / 4), behavior: "smooth" });
  };

  return (
    <section className="sx-how" id="how" data-section="how_it_works">
      <div className="sx-wrap">
        <div className="sx-head" data-reveal="0">
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>From a URL to a full tracking map, <em>in seconds</em>.</h2>
        </div>
      </div>
      <div ref={track} className="sx-how-track" style={{ height: pinned ? "320vh" : "auto" }}>
        <div className="sx-how-stage" style={{ position: pinned ? "sticky" : "static", top: PIN_TOP }}>
          <div className="sx-wrap sx-how-grid">
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s.t} className={!pinned || i === step ? "on" : ""} onClick={() => jump(i)}>
                  <span className="n">0{i + 1}</span>
                  <div>
                    <b>{s.t}</b>
                    <p>{s.d}</p>
                  </div>
                  {pinned && <span className="bar" style={{ transform: `scaleX(clamp(0, calc(var(--hp,0) * 4 - ${i}), 1))` }} />}
                </li>
              ))}
            </ol>
            <div className="visual">
              <div data-par="0.05" className="glow par" />
              {pinned
                ? STEPS.map((s, i) => (
                    <div key={s.t} className="vslot" style={{ opacity: i === step ? 1 : 0, transform: `translate3d(0,${i === step ? 0 : i < step ? -16 : 16}px,0) scale(${i === step ? 1 : 0.98})`, pointerEvents: i === step ? "auto" : "none" }}>
                      <Visual i={i} on={i === step} />
                    </div>
                  ))
                : <Visual i={3} on />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
