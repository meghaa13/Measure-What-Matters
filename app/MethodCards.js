"use client";
import { useEffect, useRef, useState } from "react";
import { uiEvent } from "./lib/analytics";

const TICKER = ["page_view · /pricing", "view_item · sku_204", "scroll · 75%", "add_to_cart · sku_204", "generate_lead · form_demo", "begin_checkout", "click · cta_hero", "file_download · brochure"];
const SPARK = [61.3, 67.7, 64.5, 74.2, 71, 80.6, 77.4, 83.9, 75.8, 88.7, 85.5, 35.5, 82.3, 90.3, 87.1, 93.5, 91.9, 96.8, 95.2, 100];
const TERM = [["$ python daily_report.py", "#E8E1F8"], ["✓ pulled GA4 data for 4 properties", "#B3E6CF"], ["✓ scraped search terms", "#B3E6CF"], ["✓ refreshed Looker Studio sources", "#B3E6CF"], ["→ report sent to client inbox", "#C5B6F0"]];
const INSIGHT = "Checkout completion on mobile dipped on Tuesday while desktop held steady. Likely cause: the payment step. Suggested next step: review MS Clarity recordings for that page.";

const CARDS = [
  { n: "01 — MEASURE", t: "Tracking you can trust.", d: "GA4 tracking frameworks built from scratch, GTM event tracking across client sites, Consent Mode v2 firing order fixed, and lead outcomes sent server-side through the Measurement Protocol. Every conversion counted once, and counted right.", chips: ["GA4", "GTM", "Consent Mode v2", "Measurement Protocol"], bg: "#fff", chipBg: "#F3F0FB" },
  { n: "02 — UNDERSTAND", t: "Behavior, not just totals.", d: "Heatmaps and clickstream for the why. BigQuery SQL and Looker Studio for the what. Bayesian A/B tests in GrowthBook and Statsig to prove which change actually worked, and which only looked like it did.", chips: ["BigQuery", "Looker Studio", "MS Clarity", "Statsig", "GrowthBook"], bg: "#F8F6FD", chipBg: "#E8E1F8" },
  { n: "03 — AUTOMATE", t: "Reports that assemble themselves.", d: "Python for scraping and daily reporting, plus a Streamlit dashboard that tracks GA4 events and popup journeys. The team spends the morning reading insight instead of building spreadsheets.", chips: ["Python", "SQL", "Streamlit"], bg: "#F1EDFB", chipBg: "#fff" },
  { n: "04 — APPLY AI", t: "AI where it earns its place.", d: "Rebuilt a content pipeline into a 15-stage research system with parallel multi-model drafting and hallucination guards. Now measuring how AI search and LLM referrals turn into real leads. Trained through GI Ventures & NVIDIA AI-ML and IBM Python for AI.", chips: ["Gemini API", "LLM pipelines", "AI search tracking"], dark: true },
];

const STRIP = 30; // how much of each earlier card stays visible, in px

export default function MethodCards({ children }) {
  const [stage, setStage] = useState(-1);
  const [run, setRun] = useState("QUEUED");
  const [typed, setTyped] = useState("");
  const [gen, setGen] = useState(false);
  const refs = useRef([]);
  const done = useRef({});
  const track = useRef(null);
  const row = useRef(null);
  // Wide screens: the band pins. Each step card comes in from the right and settles over
  // the previous one, a little further along, so a strip of every earlier card stays
  // visible on the left (the sideways version of the original top-to-bottom stacking).
  // Small screens or "reduce motion": no pinning; cards stack while scrolling down, as before.
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    // Only screen width decides. Short laptop screens are handled by shrinking the cards
    // to fit (below), and the motion here follows the scroll, so it is not switched off
    // by the "reduce motion" setting.
    const mq = window.matchMedia("(min-width: 900px)");
    const measure = () => setPinned(mq.matches);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Fit the pile of cards to the height of the screen: on a short laptop screen the
  // whole right-hand side is scaled down so nothing is cut off.
  const fit = useRef(1);
  useEffect(() => {
    const right = row.current.parentElement;
    const measure = () => {
      right.style.zoom = "1";
      const t = track.current.style;
      if (!pinned) { fit.current = 1; t.removeProperty("--sh"); t.removeProperty("--st"); t.removeProperty("--pt"); return; }
      // The band is only as tall as it needs to be (640px at most) and sits in the middle
      // of the screen. Its top padding grows when it sits under the site header.
      const vh = window.innerHeight, H = Math.min(vh - 24, 640), top = (vh - H) / 2, pt = Math.max(32, 94 - top), pb = 30;
      t.setProperty("--sh", H + "px"); t.setProperty("--st", top + "px"); t.setProperty("--pt", pt + "px");
      const k = Math.min(1, Math.max(0.55, (H - pt - pb) / right.offsetHeight));
      fit.current = k;
      right.style.zoom = String(k);
      window.dispatchEvent(new Event("scroll"));
    };
    measure();
    const t = setTimeout(measure, 700); // again once fonts have settled
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); right.style.zoom = ""; };
  }, [pinned]);

  useEffect(() => {
    let raf = 0;
    const cl = (x) => Math.min(1, Math.max(0, x));
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const r = track.current.getBoundingClientRect();
      const cards = refs.current.filter(Boolean), n = cards.length;
      track.current.style.setProperty("--me", cl((vh - r.top) / (vh * 0.85)).toFixed(4));
      let s = -1;
      if (pinned) {
        const p = cl(-r.top / Math.max(1, r.height - vh));
        track.current.style.setProperty("--mp", p.toFixed(4));
        // a waiting card sits just past the right edge of the purple band
        const stageRight = track.current.firstElementChild.getBoundingClientRect().right;
        const off = (stageRight - row.current.getBoundingClientRect().left) / fit.current + 40;
        cards.forEach((c, i) => {
          const t = i === 0 ? 1 : ease(cl(p * (n - 1) - (i - 1))); // 0 = waiting, 1 = settled
          c.style.transform = `translate3d(${((1 - t) * off + i * STRIP).toFixed(1)}px, 0, 0)`;
          c.style.zIndex = String(i + 1);
          if (t > 0.55) s = i;
        });
        if (r.top > vh * 0.45) s = -1;
      } else {
        cards.forEach((c) => { c.style.transform = ""; c.style.zIndex = ""; });
        cards.forEach((c, i) => { if (c.getBoundingClientRect().top < vh * 0.62) s = i; });
      }
      setStage(s);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [pinned]);

  // Arrow buttons: move one step. Pinned: scroll the page to that step. Otherwise: slide the row.
  const go = (to, method) => {
    const n = CARDS.length, i = Math.min(n - 1, Math.max(0, to));
    uiEvent("method_step", CARDS[i].n, "selected", { click_surface: "method", step_number: i + 1, method });
    const r = track.current.getBoundingClientRect();
    if (pinned) window.scrollTo({ top: r.top + window.scrollY + (i / (n - 1)) * (r.height - window.innerHeight) + 2, behavior: "smooth" });
    else refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    const timers = [];
    if (stage >= 2 && !done.current.run) {
      done.current.run = true;
      setRun("RUNNING…");
      timers.push(setTimeout(() => setRun("DONE · 2.4s"), 2100));
    }
    if (stage >= 3 && !done.current.ai) {
      done.current.ai = true;
      setGen(true);
      timers.push(setTimeout(() => {
        let k = 0;
        const iv = setInterval(() => { k += 2; setTyped(INSIGHT.slice(0, k)); if (k >= INSIGHT.length) { clearInterval(iv); setGen(false); } }, 24);
        timers.push(iv);
      }, 900));
    }
    return () => timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  }, [stage]);

  const s1 = stage >= 1 ? 1 : 0, s2 = stage >= 2 ? 1 : 0;

  return (
    <div ref={track} className={`m2-track${pinned ? " pinned" : ""}`} style={{ height: pinned ? `calc(100vh + ${(CARDS.length - 1) * 60}vh)` : "auto" }}>
      <div className="m2-stage">
        <div className="m2-inner">
          <div className="m2-intro">{children}</div>
          <div className="m2-right">
          <div ref={row} className="m2-deck" style={{ "--strip": `${STRIP}px` }}>
          {CARDS.map((c, i) => (
        <article key={c.n} ref={(el) => (refs.current[i] = el)} className={`card${c.dark ? " dark" : ""}`} style={{ background: c.bg, "--top": `${96 + i * 22}px` }}>
          <div className="eyebrow">{c.n}</div>
          <h3>{c.t}</h3>
          <p>{c.d}</p>
          <div className="chips">
            {c.chips.map((x) => <span key={x} className="chip" style={c.chipBg ? { background: c.chipBg } : undefined}>{x}</span>)}
          </div>

          {i === 0 && (
            <div className="widget" style={{ background: "#FBFAFD" }}>
              <div className="widget-head"><span className="live-dot">EXAMPLE · TAG DEBUG</span><span>GA4 ← GTM</span></div>
              <div className="ticker"><div>
                {[...TICKER, ...TICKER].map((t, k) => <div key={k} className="row"><span>▸ {t}</span><span>✓ fired</span></div>)}
              </div></div>
            </div>
          )}

          {i === 1 && (
            <div className="widget" style={{ background: "#fff" }}>
              <div className="widget-head"><span>DAILY CHECKOUT COMPLETION</span><span style={{ color: "#B42335", opacity: s1, transition: "opacity .4s 1.3s" }}>ANOMALY FLAGGED</span></div>
              <div className="spark">
                {SPARK.map((h, k) => <span key={k} className={k === 11 ? "bad" : undefined} style={{ height: h + "%", transform: `scaleY(${s1})`, transitionDelay: `${k * 40}ms` }} />)}
              </div>
            </div>
          )}

          {i === 2 && (
            <div className="term">
              <div className="widget-head"><span>CRON · EVERY DAY 07:00</span><span>{run}</span></div>
              {TERM.map(([t, col], k) => (
                <div key={k} className="ln" style={{ color: col, opacity: s2, transform: `translate3d(${(1 - s2) * -6}px,0,0)`, transitionDelay: `${k * 420}ms` }}>{t}</div>
              ))}
            </div>
          )}

          {i === 3 && (
            <div className="ai-box">
              <div className="sweep" style={{ opacity: gen ? 1 : 0 }} />
              <div className="widget-head"><span>AI INSIGHT · EXAMPLE</span><span>{gen ? "GENERATING…" : typed ? "READY FOR REVIEW" : "WAITING"}</span></div>
              <div className="txt">{typed}<span className="caret" style={{ opacity: gen ? 1 : 0 }} /></div>
              <div className="tags" style={{ opacity: typed && !gen ? 1 : 0 }}><span>source: GA4 + MS Clarity</span><span>human review ✓</span></div>
            </div>
          )}
        </article>
          ))}
          </div>
          <div className="m2-nav">
            <button type="button" className="arrow prev" aria-label="Previous step" disabled={stage <= 0} onClick={() => go(stage - 1, "prev")}>←</button>
            <button type="button" className="arrow next" aria-label="Next step" disabled={stage >= CARDS.length - 1} onClick={() => go(Math.max(0, stage) + 1, "next")}>→</button>
            <span className="m2-line" aria-hidden="true"><span /></span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
