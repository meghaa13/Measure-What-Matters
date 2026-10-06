"use client";
import { useEffect, useState } from "react";

// Hero card: plays an example until the visitor types, then mirrors their page and real findings.
const DEMO = {
  host: "acme-store.com/pricing",
  rows: [["\"Free trial\" leads to a sales form", "Ask", "warn"], ["No tracking found on the quote form", "Likely", "bad"], ["Main content appears after 4.1 s", "Measured", "bad"]],
  verdict: "The form works, but you can't measure it, and phones wait 4 s to see it.",
};
const TONE = { Confirmed: "bad", "Confirmed (lab)": "bad", Likely: "warn", Estimate: "info", "AI read": "info" };
const bare = (s) => String(s || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

export default function CroHero({ input, checked, state, top, verdict, host, speed, onSee }) {
  const stale = state !== "loading" && state !== "idle" && bare(input) !== bare(checked);
  const shown = stale ? "idle" : state;
  const live = shown !== "idle" || input.trim();
  const [k, setK] = useState(0);
  useEffect(() => {
    if (live) return;
    let i = 0; const t = setInterval(() => { i = (i + 1) % 8; setK(i); }, 800);
    return () => clearInterval(t);
  }, [live]);

  let title, rows, line, badge, busy = false;
  if (!live) { title = DEMO.host; rows = DEMO.rows.map((r, i) => [...r, k > i]); line = k > 4 ? DEMO.verdict : ""; badge = ["EXAMPLE", "demo"]; }
  else if (shown === "done") {
    title = host;
    rows = top.length ? top.map((i) => [i.short, i.confidence.replace(" (lab)", ""), TONE[i.confidence] || "info", true]) : [["No major problems found from the outside", "Clear", "ok", true]];
    if (speed === "loading") rows.push(["Speed test on a phone", "Running…", "demo", true]);
    line = verdict; badge = ["LIVE RESULT", "live"];
  }
  else if (shown === "loading") { title = input; rows = DEMO.rows.map(([n]) => [n, "", "demo", false]); line = ""; busy = true; badge = ["READING", "live"]; }
  else if (shown === "error") { title = input; rows = []; line = "Couldn't read this page. Details below the search box."; badge = ["ERROR", "warn"]; }
  else { title = input; rows = DEMO.rows.map(([n]) => [n, "", "demo", false]); line = ""; badge = ["READY TO CHECK", "live"]; }

  return (
    <div className={`sx-preview${shown === "done" ? " is-result" : ""}`} aria-live="polite">
      <div className="bar"><span /><span /><span /><span className="url">What is {title || "your page"} hiding?</span><span className={`badge ${badge[1]}`}>{badge[0]}</span></div>
      <div className="body">
        <div className="sweep" style={{ opacity: busy ? 1 : 0 }} />
        <div className="rows cx-rows">
          {rows.map(([n, s, tone, on], i) => (
            <div key={n + i} style={{ opacity: on ? 1 : 0.25, transform: `translate3d(${on ? 0 : -8}px,0,0)`, transitionDelay: `${on && live ? i * 90 : 0}ms` }}>
              <span>{n}</span>{on && s ? <span className={`pill ${tone}`}>{s}</span> : <span className="pill demo">…</span>}
            </div>
          ))}
        </div>
        <div className="score" style={{ opacity: line ? 1 : 0.15 }}>
          <span className="label">VERDICT{shown === "done" && host ? ` · ${host}` : ""}</span>
          <b className="verdict-text">{line || "—"}</b>
        </div>
        {shown === "done" && <button type="button" className="see" onClick={onSee}>See the evidence ↓</button>}
      </div>
    </div>
  );
}
