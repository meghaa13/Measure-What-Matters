"use client";
import { useEffect, useRef, useState } from "react";

const AUTO_MS = 2500; // how long each step stays up when advancing on its own
import { uiEvent } from "./lib/analytics";

const STEPS = [
  { label: "Acquisition", title: "Start with where people come from.", body: "Before judging any channel, I map which sources send people to which pages. Search and social visitors arrive with different intent, so they get read differently." },
  { label: "Behavior", title: "Follow what they actually do.", body: "Path analysis on GA4 events shows the real routes through the site, including the ones that end in an exit." },
  { label: "Diagnosis", title: "Find exactly where it breaks.", body: "Splitting each step by segment shows which group falls away and where. MS Clarity heatmaps and recordings then show why." },
  { label: "Validation", title: "Prove the fix worked.", body: "Every change is measured against its baseline. On VPP, fixing the drop-off points found this way raised conversion rate by 50%. Then the same metrics are reported automatically, so the next leak is caught early." },
];

// ── Panel 1: source → landing page flows (illustrative)
const FLOWS = [
  ["M150,22.4 C260,22.4 260,22.4 370,22.4", "#B3A1EC", 19.3, .42], ["M150,45.3 C260,45.3 260,119.5 370,119.5", "#B3A1EC", 23.5, .42],
  ["M150,74.4 C260,74.4 260,214.6 370,214.6", "#B3A1EC", 31.8, .42], ["M150,105.3 C260,105.3 260,39.0 370,39.0", "#5B43B5", 11, .8],
  ["M150,128.2 C260,128.2 260,148.6 370,148.6", "#5B43B5", 31.8, .8], ["M150,146.9 C260,146.9 260,233.3 370,233.3", "#5B43B5", 2.7, .8],
  ["M150,165.3 C260,165.3 260,53.6 370,53.6", "#A18CE6", 15.1, .42], ["M150,179.8 C260,179.8 260,171.5 370,171.5", "#A18CE6", 11, .42],
  ["M150,190.2 C260,190.2 260,239.5 370,239.5", "#A18CE6", 6.8, .42], ["M150,208.6 C260,208.6 260,68.2 370,68.2", "#C5B6F0", 11, .42],
  ["M150,217.0 C260,217.0 260,179.8 370,179.8", "#C5B6F0", 2.7, .42], ["M150,223.2 C260,223.2 260,247.8 370,247.8", "#C5B6F0", 6.8, .42],
  ["M150,243.7 C260,243.7 260,82.7 370,82.7", "#D9CFF5", 15.1, .42],
];
const SOURCES = [
  ["Organic search", "38%", "#B3A1EC", 12, 79, 55.5, "Blog & content", 100],
  ["Paid search", "24%", "#5B43B5", 99, 49.9, 128, "Product pages", 63.2, true],
  ["Paid social", "18%", "#A18CE6", 157, 37.4, 179.7, "Home", 47.4],
  ["Referral", "12%", "#C5B6F0", 202.4, 25, 218.9, "Home", 31.6],
  ["Direct", "8%", "#D9CFF5", 235.4, 16.6, 247.7, "Home", 21.1],
];
const PAGES = [["Home", 12, 79, 55.5], ["Product pages", 107, 74.9, 148.5], ["Blog & content", 197.9, 54.1, 229]];

function PanelSources({ on }) {
  return (
    <>
      <div className="panel-head"><span>Sessions · source → landing page</span><span>Illustrative</span></div>
      <svg viewBox="0 0 520 266" className="chart-svg desk-only">
        {FLOWS.map(([d, c, w, o], i) => (
          <path key={i} d={d} pathLength="1" fill="none" style={{ stroke: c, strokeWidth: w, strokeOpacity: o, strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: `stroke-dashoffset 1.3s cubic-bezier(.65,0,.25,1) ${200 + i * 55}ms` }} />
        ))}
        {SOURCES.map(([name, pct, c, y, h, ty, , , strong]) => (
          <g key={name}>
            <rect x="142" y={y} width="8" height={h} rx="2" fill={c} />
            <text x="132" y={ty} style={{ textAnchor: "end", fontFamily: "var(--sans)", fontSize: 12.5, fill: strong ? "#2E2263" : "#5D5670", fontWeight: strong ? 600 : 400 }}>
              {name} <tspan style={{ fontFamily: "var(--mono)", fontSize: 10.5, fill: "#9A93AE" }}>{pct}</tspan>
            </text>
          </g>
        ))}
        {PAGES.map(([name, y, h, ty], i) => (
          <g key={name} style={{ opacity: on ? 1 : 0, transition: `opacity .5s ${1300 + i * 100}ms` }}>
            <rect x="370" y={y} width="8" height={h} rx="2" fill="#2E2263" />
            <text x="388" y={ty} style={{ fontFamily: "var(--sans)", fontSize: 12.5, fill: "#1E1A2B" }}>{name}</text>
          </g>
        ))}
      </svg>
      <div className="src-rows mob-only">
        {SOURCES.map(([name, pct, c, , , , to, w, strong], i) => (
          <div key={name} className="src-row">
            <div className="top"><span style={strong ? { color: "#2E2263", fontWeight: 600 } : undefined}>{name} <small>{pct}</small></span><span className="to">→ {to}</span></div>
            <span className="track-bar"><span style={{ width: w + "%", background: c, transform: `scaleX(${on})`, transitionDelay: `${150 + i * 90}ms` }} /></span>
          </div>
        ))}
      </div>
      <div className="read" style={{ opacity: on, transform: `translate3d(0,${(1 - on) * 8}px,0)`, transition: "opacity .5s 1.5s, transform .6s var(--ease) 1.5s" }}>
        <span className="tag">READ</span>
        <span>Paid search mostly lands on product pages, organic mostly on content. Same site, two different first impressions.</span>
      </div>
    </>
  );
}

// ── Panel 2: top paths
const PATHS = [
  [34, 100, ["landing", "view_item", "exit"]],
  [22, 64.7, ["landing", "blog", "exit"]],
  [19, 55.9, ["landing", "view_item", "add_to_cart", "begin_checkout", "exit"]],
  [11, 32.4, ["landing", "view_item", "add_to_cart", "begin_checkout", "purchase"]],
];

function PanelPaths({ on }) {
  let t = 150;
  return (
    <>
      <div className="panel-head"><span>Top paths · share of sessions</span><span>Illustrative</span></div>
      <div className="paths">
        {PATHS.map(([pct, w, nodes], r) => {
          const start = t; t += 160;
          return (
            <div key={r} className="path-row">
              <div className="pct"><b>{pct}%</b><i><span style={{ width: w + "%", transform: `scaleX(${on})`, transitionDelay: `${start}ms` }} /></i></div>
              <div className="steps">
                {nodes.map((n, i) => {
                  const d = start + 50 + i * 90;
                  const last = i === nodes.length - 1;
                  return (
                    <span key={i} style={{ display: "contents" }}>
                      {i > 0 && <span className="link" style={{ transform: `scaleX(${on})`, transitionDelay: `${d - 40}ms` }} />}
                      <span className={`node${last && n === "exit" ? " exit" : last && n === "purchase" ? " win" : ""}`}
                        style={{ opacity: on, transform: `translate3d(${(1 - on) * -8}px,0,0)`, transitionDelay: `${d}ms` }}>{n}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="read" style={{ opacity: on, transition: "opacity .5s 1.1s" }}>
        <span className="tag">READ</span>
        <span>One in five sessions reaches checkout and still leaves. That&apos;s the path worth opening up.</span>
      </div>
    </>
  );
}

// ── Panel 3: step completion, desktop vs mobile
const STEP_BARS = [["Item → cart", 42, 38], ["Cart → checkout", 61, 58], ["Checkout → payment", 72, 31, true], ["Payment → purchase", 88, 84]];

function PanelSteps({ on }) {
  return (
    <>
      <div className="panel-head"><span>Step completion · desktop vs mobile</span><span>Illustrative</span></div>
      <div className="legend"><span><i style={{ background: "#D9CFF5" }} />Desktop</span><span><i style={{ background: "#8E74DD" }} />Mobile</span></div>
      <div className="bars4">
        {STEP_BARS.map(([label, d, m, hl], i) => (
          <div key={label} className={`bar-col${hl ? " hl" : ""}`}>
            <div className="bar-pair" style={{ background: hl && on ? "#EEE9FA" : "transparent" }}>
              {[[d, "#D9CFF5"], [m, hl ? "#2E2263" : "#8E74DD"]].map(([v, c], j) => (
                <div key={j} className="bar-one">
                  <small style={{ opacity: on, transitionDelay: `${700 + (i * 2 + j) * 60}ms` }}>{v}%</small>
                  <i style={{ height: v + "%", background: c, transform: `scaleY(${on})`, transitionDelay: `${200 + (i * 2 + j) * 60}ms` }} />
                </div>
              ))}
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="read dark" style={{ opacity: on, transform: `translate3d(0,${(1 - on) * 8}px,0)`, transition: "opacity .5s 1.2s, transform .6s var(--ease) 1.2s" }}>
        <span className="tag">FOUND</span>
        <span>Mobile falls away at payment while desktop doesn&apos;t. Heatmaps and recordings then show what people are struggling with.</span>
      </div>
    </>
  );
}

// ── Panel 4: conversion rate before / after
const LINE = [[56, 144], [96, 151.6], [136, 136.4], [176, 145.9], [216, 148.8], [256, 138.3], [296, 94.6], [336, 69.9], [376, 58.5], [416, 64.2], [456, 47.1], [496, 52.8]];

function PanelResult({ on, count }) {
  const sm = { fontFamily: "var(--mono)", fontSize: 10, fill: "#9A93AE" };
  return (
    <>
      <div className="panel-head"><span>Conversion rate · weekly</span><span>Illustrative</span></div>
      <svg viewBox="0 0 520 250" className="chart-svg">
        {[[172.5, "1.5%"], [125, "2.0%"], [77.5, "2.5%"], [30, "3.0%"]].map(([y, l]) => (
          <g key={l}><line x1="56" x2="500" y1={y} y2={y} stroke="#EEE9FA" /><text x="44" y={y + 4} style={{ ...sm, textAnchor: "end" }}>{l}</text></g>
        ))}
        <rect x="276" y="20" width="224" height="200" fill="#F3F0FB" style={{ opacity: on, transition: "opacity .6s .9s" }} />
        <line x1="276" x2="276" y1="14" y2="220" stroke="#8E74DD" strokeWidth="1.5" strokeDasharray="4 4" style={{ opacity: on, transition: "opacity .4s .8s" }} />
        <text x="284" y="32" style={{ ...sm, fill: "#5B43B5", opacity: on, transition: "opacity .4s .9s" }}>FIX SHIPPED</text>
        <line x1="56" x2="276" y1="144" y2="144" stroke="#9A93AE" strokeDasharray="2 3" style={{ opacity: on, transition: "opacity .4s 1.6s" }} />
        <line x1="276" x2="500" y1="58.5" y2="58.5" stroke="#2E2263" strokeDasharray="2 3" style={{ opacity: on, transition: "opacity .4s 1.8s" }} />
        <path d={"M" + LINE.map((p) => p.join(",")).join(" L")} pathLength="1" fill="none" stroke="#5B43B5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
          style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: "stroke-dashoffset 1.6s cubic-bezier(.65,0,.25,1) .25s" }} />
        {LINE.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke="#5B43B5" strokeWidth="2" style={{ opacity: on, transition: `opacity .3s ${300 + i * 110}ms` }} />)}
        <text x="56" y="244" style={sm}>WEEK 1</text><text x="500" y="244" style={{ ...sm, textAnchor: "end" }}>WEEK 12</text>
      </svg>
      <div className="result-strip">
        <div className="big"><b>+{count}%</b><span>CONVERSION RATE</span></div>
        <div className="txt"><b>Real result on VPP</b><span>After fixing the purchase-funnel drop-offs. Weekly values in the chart are illustrative.</span></div>
      </div>
    </>
  );
}

const PANELS = [PanelSources, PanelPaths, PanelSteps, PanelResult];

export default function FunnelStory() {
  const [tab, setTab] = useState(0);
  const [seen, setSeen] = useState(false);
  const [count, setCount] = useState(0);
  const root = useRef(null);
  const raf = useRef();

  // Charts draw once the section has been seen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  // +50% counter on the Validation tab.
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (tab !== 3 || !seen) { setCount(0); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0 - 250) / 800); // quick enough to finish before the step moves on
      setCount(Math.round(50 * (p <= 0 ? 0 : 1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [tab, seen]);

  // Auto-advance: while the section is on screen, move to the next step every few
  // seconds so all four charts get seen. It waits while the pointer or keyboard focus
  // is on the section, and stops for good the first time the visitor picks a step.
  const [auto, setAuto] = useState(true);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.45 });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);
  const playing = auto && inView && !hold;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setTab((n) => (n + 1) % 4), AUTO_MS);
    return () => clearTimeout(t);
  }, [playing, tab]);

  const go = (i, method) => {
    const n = (i + 4) % 4;
    setAuto(false);
    setTab(n);
    uiEvent("story_step", STEPS[n].label, "selected", { click_surface: "story", step_number: n + 1, method });
  };

  return (
    <div ref={root} onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)} onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
      <div data-reveal="60" role="tablist" className="tabs" style={{ "--auto-ms": `${AUTO_MS}ms` }}>
        {STEPS.map((s, i) => (
          <button key={s.label} role="tab" aria-selected={i === tab} className={`tab${i === tab ? " on" : ""}${i === tab && playing ? " timing" : ""}`} onClick={() => go(i, "tab")}>
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
            <button className="arrow prev" aria-label="Previous" onClick={() => go(tab - 1, "prev")}>←</button>
            <button className="arrow next" aria-label="Next" onClick={() => go(tab + 1, "next")}>→</button>
          </div>
        </div>
        <div data-reveal="200" className="panel-box">
          {PANELS.map((Panel, i) => {
            const v = i === tab, on = v && seen ? 1 : 0;
            return (
              <div key={i} className="panel" aria-hidden={!v}
                style={{ opacity: v ? 1 : 0, visibility: v ? "visible" : "hidden", transform: `translate3d(0,${v ? 0 : 10}px,0)`, transitionDelay: `0s, 0s, ${v ? "0s" : ".5s"}` }}>
                <Panel on={on} count={count} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
