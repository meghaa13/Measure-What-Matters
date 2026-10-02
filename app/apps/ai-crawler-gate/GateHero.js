"use client";
import { useEffect, useState } from "react";
import { verdicts } from "./verdict";

// Hero card: plays an example until the visitor types, then mirrors their site and real verdicts.
const DEMO = { host: "acme-store.com", list: [["ChatGPT search", "blocked"], ["Claude", "visible"], ["Perplexity", "visible"], ["Google AI Overviews", "no_quote"], ["Microsoft Copilot", "visible"], ["Siri & Apple", "visible"]], headline: "3 of 6 AI assistants can find and quote you." };
const ST = { visible: ["ok", "Can find you"], blocked: ["bad", "Blocked"], no_quote: ["warn", "Can't quote you"], verify: ["info", "Check Cloudflare"] };
const bare = (s) => String(s || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

export default function GateHero({ input, checked, state, data, onSee }) {
  const stale = state !== "loading" && state !== "idle" && bare(input) !== bare(checked);
  const shown = stale ? "idle" : state;
  const live = shown !== "idle" || input.trim();
  const [k, setK] = useState(0); // demo reveal step
  useEffect(() => {
    if (live) return;
    let i = 0; const t = setInterval(() => { i = (i + 1) % 10; setK(i); }, 700);
    return () => clearInterval(t);
  }, [live]);

  let host, rows, headline, badge, busy = false;
  if (!live) { host = DEMO.host; rows = DEMO.list.map((r, i) => [...r, k > i]); headline = k > 6 ? DEMO.headline : ""; badge = ["EXAMPLE", "demo"]; }
  else if (shown === "done" && data) { const v = verdicts(data); host = data.host; rows = v.list.map((a) => [a.name, a.status, true]); headline = v.headline; badge = ["LIVE RESULT", "live"]; }
  else if (shown === "loading") { host = input; rows = DEMO.list.map(([n]) => [n, "visible", false]); headline = ""; busy = true; badge = ["CHECKING", "live"]; }
  else if (shown === "error") { host = input; rows = []; headline = "Couldn't check this site. Details below the search box."; badge = ["ERROR", "warn"]; }
  else { host = input; rows = DEMO.list.map(([n]) => [n, "visible", false]); headline = ""; badge = ["READY TO CHECK", "live"]; }

  return (
    <div className={`sx-preview${shown === "done" ? " is-result" : ""}`} aria-live="polite">
      <div className="bar"><span /><span /><span /><span className="url">Can AI find and cite {host || "your site"}?</span><span className={`badge ${badge[1]}`}>{badge[0]}</span></div>
      <div className="body">
        <div className="sweep" style={{ opacity: busy ? 1 : 0 }} />
        <div className="rows">
          {rows.map(([n, s, on], i) => (
            <div key={n} style={{ opacity: on ? 1 : 0.25, transform: `translate3d(${on ? 0 : -8}px,0,0)`, transitionDelay: `${on && live ? i * 90 : 0}ms` }}>
              <span>{n}</span>{on ? <span className={`pill ${ST[s][0]}`}>{ST[s][1]}</span> : <span className="pill demo">…</span>}
            </div>
          ))}
        </div>
        <div className="score" style={{ opacity: headline ? 1 : 0.15 }}>
          <span className="label">VERDICT{shown === "done" && data ? ` · ${data.host}` : ""}</span>
          <b className="verdict-text">{headline || "—"}</b>
        </div>
        {shown === "done" && data && <button type="button" className="see" onClick={onSee}>See what this means ↓</button>}
      </div>
    </div>
  );
}
