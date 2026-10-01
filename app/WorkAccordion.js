"use client";
import { useState } from "react";
import { track } from "./lib/analytics";

const WORK = [
  { kind: "IMPLEMENTATION", name: "AvePoint", body: "GA4 and MS Clarity setup, UX analysis, and daily data-driven recommendations.", tags: ["GA4", "MS Clarity", "UX analysis"] },
  { kind: "DASHBOARDS · CLIENT LEAD", name: "QS", body: "Looker Studio dashboards visualizing engagement and CTR trends. Client meetings and communication handled independently.", tags: ["Looker Studio", "CTR", "Engagement"] },
  { kind: "WEB ANALYTICS", name: "Cordia Energy", body: "GA4, GTM and MS Clarity setup, with ongoing daily performance reporting.", tags: ["GA4", "GTM", "MS Clarity"] },
];

export default function WorkAccordion() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div data-reveal="240" className="accordion">
      {WORK.map((w, i) => {
        const open = openIdx === i;
        return (
          <div key={w.name} className={`acc-item${open ? " open" : ""}`}>
            <button className="acc-btn" aria-expanded={open} onClick={() => { setOpenIdx(open ? -1 : i); track("case_study_toggle", { case_name: w.name, action: open ? "close" : "open" }); }}>
              <span><span className="kind">{w.kind}</span><span className="name">{w.name}</span></span>
              <span className="plus">+</span>
            </button>
            <div className="acc-panel">
              <div>
                <div className="acc-inner">
                  <p>{w.body}</p>
                  <div className="chips" style={{ marginTop: 16 }}>
                    {w.tags.map((t) => <span key={t} className="chip">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
