"use client";
import { useEffect, useRef, useState } from "react";
import { track } from "./lib/analytics";

const STEPS = [
  { label: "Traffic arrives", title: "Your ads bring people in.", body: "Clicks are easy to buy. The expensive part is not knowing what happens after them." },
  { label: "People leave", title: "Somewhere, they quietly leave.", body: "Every funnel leaks. Most teams can see the total, but not the step where it happens." },
  { label: "Find the step", title: "I find that step.", body: "GA4 events, GTM tags and Clarity heatmaps let me trace the clickstream to the exact point where people stall." },
  { label: "Fix & measure", title: "Then we fix it, and measure again.", body: "On the VPP website, mapping the purchase funnel this way led to a 50% higher conversion rate." },
];
const BASE = [100, 74, 52, 22, 12];
const FIXED = [100, 74, 52, 34, 18];
const NAMES = ["Ad click", "Landing page", "Product view", "Checkout", "Conversion"];
const COLS = ["#C5B6F0", "#B3A1EC", "#A18CE6", "#8E74DD", "#5B43B5"];

export default function FunnelStory() {
  const [tab, setTabState] = useState(0);
  const [count, setCount] = useState(0);
  const raf = useRef();

  const setTab = (i, method) => {
    const n = (i + 4) % 4;
    setTabState(n);
    if (method) track("funnel_step_view", { step_number: n + 1, step_name: STEPS[n].label, method });
    cancelAnimationFrame(raf.current);
    if (n === 3) {
      setCount(0);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0 - 500) / 1200);
        const e = p <= 0 ? 0 : 1 - Math.pow(1 - p, 3);
        setCount(Math.round(50 * e));
        if (p < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <>
      <div data-reveal="60" role="tablist" className="tabs">
        {STEPS.map((s, i) => (
          <button key={s.label} role="tab" aria-selected={i === tab} className={`tab${i === tab ? " on" : ""}`} onClick={() => setTab(i, "tab")}>
            <span className="num">0{i + 1}</span>{s.label}
          </button>
        ))}
      </div>
      <div className="grid2 story-grid">
        <div data-reveal="120">
          <div className="copy-stack">
            {STEPS.map((s, i) => (
              <div key={s.label} className="copy" aria-hidden={i !== tab}
                style={{ opacity: i === tab ? 1 : 0, transform: `translate3d(0,${i === tab ? 0 : i < tab ? -14 : 14}px,0)`, pointerEvents: i === tab ? "auto" : "none" }}>
                <h2>{s.title}</h2>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
          <div className="arrows">
            <button className="arrow prev" aria-label="Previous" onClick={() => setTab(tab - 1, "prev")}>←</button>
            <button className="arrow next" aria-label="Next" onClick={() => setTab(tab + 1, "next")}>→</button>
          </div>
        </div>
        <div data-reveal="200" className="funnel">
          <div className="funnel-head"><span>Purchase funnel</span><span>Illustrative</span></div>
          {NAMES.map((label, i) => {
            const w = tab === 0 ? (i === 0 ? 100 : 0) : tab === 3 ? FIXED[i] : BASE[i];
            const isMark = tab === 2 && i === 3;
            return (
              <div key={label} className="bar-row">
                <span style={{ color: isMark ? "#5B43B5" : "#5D5670" }}>{label}</span>
                <div className="track">
                  <div className="ghost" style={{ width: BASE[i] + "%", opacity: tab === 3 && i >= 3 ? 1 : 0 }} />
                  <div className="fill" style={{
                    width: w + "%", background: COLS[i], opacity: tab === 2 && i !== 3 ? 0.35 : 1,
                    transitionDelay: `${tab === 3 ? Math.max(0, i - 3) * 150 : i * 120}ms, 0s, 0s`,
                  }} />
                  <div className="mark" style={{ left: `calc(${BASE[i]}% + 12px)`, opacity: isMark ? 1 : 0, transform: `translate3d(${tab === 2 ? 0 : 16}px,-50%,0)` }}>
                    Drop-off found here
                  </div>
                </div>
              </div>
            );
          })}
          <div className="result" style={{ opacity: tab === 3 ? 1 : 0.0001 }}>
            <span className="big">+{count}%</span>
            <span className="note">conversion rate on VPP after fixing the funnel drop-off found in Clarity heatmaps. Dashed outline shows the funnel before.</span>
          </div>
        </div>
      </div>
    </>
  );
}
