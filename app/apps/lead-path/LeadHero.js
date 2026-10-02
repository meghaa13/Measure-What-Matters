"use client";
import { useEffect, useState } from "react";
import { STAGES, leadVerdict } from "./verdict";

// Hero card: an example journey plays until the visitor types; then it mirrors their URL and real verdict.
const DEMO = { host: "acme-store.com/spring-sale", stages: ["bad", "ok", "bad", "bad"], headline: "Visitors lose their Google Ads click ID on the redirect to shop.acme-store.com." };
const ST = { ok: ["ok", "Kept"], bad: ["bad", "Lost"], warn: ["warn", "At risk"], unknown: ["info", "Can't see"] };
const bare = (s) => String(s || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

export default function LeadHero({ input, checked, state, data, onSee }) {
  const stale = state !== "loading" && state !== "idle" && bare(input) !== bare(checked);
  const shown = stale ? "idle" : state;
  const live = shown !== "idle" || input.trim();
  const [k, setK] = useState(0);
  useEffect(() => {
    if (live) return;
    let i = 0; const t = setInterval(() => { i = (i + 1) % 9; setK(i); }, 750);
    return () => clearInterval(t);
  }, [live]);

  let host, stages, headline, badge, busy = false, reveal = 4;
  if (!live) { host = DEMO.host; stages = DEMO.stages; headline = k > 4 ? DEMO.headline : ""; badge = ["EXAMPLE", "demo"]; reveal = k; }
  else if (shown === "done" && data) { const v = leadVerdict(data); host = input.trim(); stages = v.stages; headline = v.headline; badge = ["LIVE RESULT", "live"]; }
  else if (shown === "loading") { host = input; stages = ["ok", "ok", "ok", "ok"]; headline = ""; busy = true; badge = ["FOLLOWING THE VISIT", "live"]; reveal = -1; }
  else if (shown === "error") { host = input; stages = []; headline = "Couldn't check this page. Details below the search box."; badge = ["ERROR", "warn"]; }
  else { host = input; stages = ["ok", "ok", "ok", "ok"]; headline = ""; badge = ["READY TO CHECK", "live"]; reveal = -1; }

  return (
    <div className={`sx-preview${shown === "done" ? " is-result" : ""}`} aria-live="polite">
      <div className="bar"><span /><span /><span /><span className="url">{host || "your landing page"}</span><span className={`badge ${badge[1]}`}>{badge[0]}</span></div>
      <div className="body">
        <div className="sweep" style={{ opacity: busy ? 1 : 0 }} />
        <div className="mx-journey">
          {STAGES.map((label, i) => {
            const on = i < reveal || (live && shown === "done");
            const s = stages[i] || "unknown";
            return (
              <div key={label} className={`j ${on ? s : "idle"}`} style={{ transitionDelay: `${on ? i * 120 : 0}ms` }}>
                <span className="n">0{i + 1}</span><span className="t">{label}</span>
                {on ? <span className={`pill ${ST[s][0]}`}>{ST[s][1]}</span> : <span className="pill demo">…</span>}
              </div>
            );
          })}
        </div>
        <div className="score" style={{ opacity: headline ? 1 : 0.15 }}>
          <span className="label">VERDICT</span>
          <b className="verdict-text">{headline || "—"}</b>
        </div>
        {shown === "done" && data && <button type="button" className="see" onClick={onSee}>See where and how to fix it ↓</button>}
      </div>
    </div>
  );
}
