"use client";
import { useState } from "react";
import { track } from "./lib/analytics";

const FAQ = [
  { q: "What actually happens on the 20-minute call?", a: "You tell me the question your data can't answer. I ask how it's tracked today. You leave with the first three fixes in priority order, whether or not we work together." },
  { q: "Do I need clean data before we start?", a: "No. Most of my work starts with tracking that is patchy, double-counting or missing. Fixing that foundation is step one, before any automation or AI." },
  { q: "How do you handle access to our data?", a: "Least-privilege access on your own accounts, no personal data copied out of your systems, and NDAs are welcome. Consent and PII handling are part of the build, not an afterthought." },
  { q: "Do you work with teams outside India?", a: "Yes. My client work is for international teams. I keep a few overlapping hours for calls and work async in between, with written updates." },
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div data-reveal="160" className="faq-list">
      {FAQ.map((x, i) => {
        const on = open === i;
        return (
          <div key={x.q} className={`faq-item${on ? " open" : ""}`}>
            <button className="faq-q" aria-expanded={on} onClick={() => { setOpen(on ? -1 : i); track("faq_interaction", { click_surface: "faq", faq_question: x.q, faq_position: i + 1, faq_state: on ? "closed" : "opened" }); }}>
              <span>{x.q}</span><span className="plus">+</span>
            </button>
            <div className="faq-a"><div><p>{x.a}</p></div></div>
          </div>
        );
      })}
    </div>
  );
}
