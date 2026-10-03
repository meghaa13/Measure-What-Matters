"use client";
import { useState } from "react";
import { uiEvent } from "./lib/analytics";

// The stack, in the order the work happens: measure, automate, then AI.
const STACK = [
  { key: "analytics", n: "01", title: "Analytics", line: "Measure what actually happened.",
    tools: [["GA4", "Event design, key events, audiences"], ["GTM", "Tags, triggers, dataLayer specs"], ["Consent Mode v2", "Compliant by default"], ["Measurement Protocol", "Lead outcomes sent server-side"], ["MS Clarity", "Session replays and heatmaps"], ["Looker Studio", "Dashboards people open"], ["Statsig", "A/B tests and experiments"], ["GrowthBook", "Bayesian A/B tests"], ["R", "Statistical analysis"]] },
  { key: "automation", n: "02", title: "Automation & build", line: "Stop doing reports by hand.",
    tools: [["BigQuery", "GA4 export, joined with lead outcomes"], ["SQL", "Models and scheduled queries"], ["Python", "Scraping and daily reporting"], ["Streamlit", "Dashboards for events and journeys"], ["Make", "No-code workflows between tools"], ["Apps Script", "Google Sheets automations"], ["Next.js", "This site and its free tools"]] },
  { key: "ai", n: "03", title: "AI", line: "Only where the data can carry it.",
    tools: [["Gemini API", "Drafting and research pipelines"], ["LLM pipelines", "Multi-stage, with hallucination guards"], ["AI search tracking", "How AI referrals turn into leads"]] },
];

export default function Stack() {
  const [hot, setHot] = useState(null);
  return (
    <div className="stack-grid">
      <div className="stack-rail" aria-hidden="true"><span /></div>
      {STACK.map((g, gi) => (
        <article key={g.key} data-reveal={120 + gi * 120} className="stack-col">
          <div className="stack-head"><span className="n">{g.n}</span><h3>{g.title}</h3></div>
          <p className="stack-line">{g.line}</p>
          <div className="stack-tools">
            {g.tools.map(([name, what]) => {
              const on = hot === name;
              return (
                <button key={name} type="button" className={`stack-tool${on ? " on" : ""}`} aria-expanded={on}
                  onClick={() => { setHot(on ? null : name); uiEvent("stack_tool", name, on ? "closed" : "opened", { click_surface: "stack", stack_group: g.key }); }}>
                  <b>{name}</b><span>{what}</span>
                </button>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
