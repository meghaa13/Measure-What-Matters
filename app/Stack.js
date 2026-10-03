"use client";
import { useState } from "react";
import { uiEvent } from "./lib/analytics";

// The stack, in the order the work happens: measure, automate, then AI.
const STACK = [
  { key: "analytics", n: "01", title: "Analytics", line: "Measure what actually happened.",
    tools: [["GA4", "Event design, key events, audiences"], ["GTM", "Tags, triggers, dataLayer specs"], ["Consent Mode v2", "Compliant by default"], ["MS Clarity", "Session replays and heatmaps"], ["Looker Studio", "Dashboards people open"], ["Statsig", "A/B tests and experiments"]] },
  { key: "automation", n: "02", title: "Automation", line: "Stop doing reports by hand.",
    tools: [["BigQuery", "GA4 export, joins with CRM"], ["SQL", "Models and scheduled queries"], ["Python", "Pipelines, QA scripts, APIs"], ["APIs & webhooks", "Forms, CRMs, alerts"]] },
  { key: "ai", n: "03", title: "AI", line: "Only where the data can carry it.",
    tools: [["Claude API", "Summaries, audits, classification"], ["LLM pipelines", "Structured output, checked against data"], ["AI visibility", "How assistants read and cite a site"]] },
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
