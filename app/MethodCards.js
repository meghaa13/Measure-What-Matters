"use client";
import { useEffect, useRef, useState } from "react";

const TICKER = ["page_view · /pricing", "view_item · sku_204", "scroll · 75%", "add_to_cart · sku_204", "generate_lead · form_demo", "begin_checkout", "click · cta_hero", "file_download · brochure"];
const SPARK = [61.3, 67.7, 64.5, 74.2, 71, 80.6, 77.4, 83.9, 75.8, 88.7, 85.5, 35.5, 82.3, 90.3, 87.1, 93.5, 91.9, 96.8, 95.2, 100];
const TERM = [["$ python daily_report.py", "#E8E1F8"], ["✓ pulled GA4 data for 4 properties", "#B3E6CF"], ["✓ scraped search terms", "#B3E6CF"], ["✓ refreshed Looker Studio sources", "#B3E6CF"], ["→ report sent to client inbox", "#C5B6F0"]];
const INSIGHT = "Checkout completion on mobile dipped on Tuesday while desktop held steady. Likely cause: the payment step. Suggested next step: review Clarity recordings for that page.";

const CARDS = [
  { n: "01 — MEASURE", t: "Tracking you can trust.", d: "GA4 tracking frameworks built from scratch, GTM event tracking across client sites, Consent Mode firing order fixed, and lead outcomes sent server-side through the Measurement Protocol. Every conversion counted once, and counted right.", chips: ["GA4", "GTM", "Consent Mode", "Measurement Protocol"], bg: "#fff", chipBg: "#F3F0FB" },
  { n: "02 — UNDERSTAND", t: "Behavior, not just totals.", d: "Heatmaps and clickstream for the why. BigQuery SQL and Looker Studio for the what. Bayesian A/B tests in GrowthBook and Statsig to prove which change actually worked, and which only looked like it did.", chips: ["BigQuery", "Looker Studio", "MS Clarity", "A/B testing"], bg: "#F8F6FD", chipBg: "#E8E1F8" },
  { n: "03 — AUTOMATE", t: "Reports that assemble themselves.", d: "Python for scraping and daily reporting, plus a Streamlit dashboard that tracks GA4 events and popup journeys. The team spends the morning reading insight instead of building spreadsheets.", chips: ["Python", "Streamlit", "Scheduled reporting"], bg: "#F1EDFB", chipBg: "#fff" },
  { n: "04 — APPLY AI", t: "AI where it earns its place.", d: "Rebuilt a content pipeline into a 15-stage research system with parallel multi-model drafting and hallucination guards. Now measuring how AI search and LLM referrals turn into real leads. Trained through GI Ventures & NVIDIA AI-ML and IBM Python for AI.", chips: ["LLM pipelines", "Gemini API", "AI search tracking"], dark: true },
];

export default function MethodCards() {
  const [stage, setStage] = useState(-1);
  const [run, setRun] = useState("QUEUED");
  const [typed, setTyped] = useState("");
  const [gen, setGen] = useState(false);
  const refs = useRef([]);
  const done = useRef({});

  // Stage = the last card whose top has passed 62% of the viewport.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      let s = -1;
      refs.current.forEach((c, i) => { if (c && c.getBoundingClientRect().top < vh * 0.62) s = i; });
      setStage(s);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

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
    <div className="cards">
      {CARDS.map((c, i) => (
        <article key={c.n} ref={(el) => (refs.current[i] = el)} className={`card${c.dark ? " dark" : ""}`} style={{ top: 110 + i * 28, background: c.bg }}>
          <div className="eyebrow">{c.n}</div>
          <h3>{c.t}</h3>
          <p>{c.d}</p>
          <div className="chips">
            {c.chips.map((x) => <span key={x} className="chip" style={c.chipBg ? { background: c.chipBg } : undefined}>{x}</span>)}
          </div>

          {i === 0 && (
            <div className="widget" style={{ background: "#FBFAFD" }}>
              <div className="widget-head"><span className="live-dot">LIVE · TAG DEBUG</span><span>GA4 ← GTM</span></div>
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
              <div className="widget-head"><span>AI INSIGHT</span><span>{gen ? "GENERATING…" : typed ? "READY FOR REVIEW" : "WAITING"}</span></div>
              <div className="txt">{typed}<span className="caret" style={{ opacity: gen ? 1 : 0 }} /></div>
              <div className="tags" style={{ opacity: typed && !gen ? 1 : 0 }}><span>source: GA4 + Clarity</span><span>human review ✓</span></div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
