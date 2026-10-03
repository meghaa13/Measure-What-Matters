"use client";
import { useState } from "react";
import Link from "next/link";

// Add a tool by appending to this list; arrows and dots appear once there are two or more.
const TOOLS = [
  {
    key: "tag_health_scan",
    kind: "TOOL 01 · ANALYTICS",
    name: "Tag Health Scan",
    desc: "Paste a website. It reads the site's Google tag and GTM setup, checks it against what's live, and tells you what's tracked, what's broken and what's risky.",
    sample: [
      ["GA4 · Google Ads · GTM", "Found", "ok"],
      ["page_view marked as a key event", "Likely", "warn"],
      ["Lead counted on thank-you page load", "Confirmed", "bad"],
      ["Consent Mode defaults", "Verify", "info"],
    ],
    sum: "tracking_health → 62 / 100",
    href: "/apps/tag-scanner",
    note: "Free · results in seconds.",
  },
  {
    key: "lead_path_xray",
    kind: "TOOL 02 · ATTRIBUTION",
    name: "Lead Path X-Ray",
    desc: "Follows one visit from an ad, email, social or partner link through every redirect, tag and form, and shows exactly where its source gets lost before the CRM.",
    sample: [
      ["gclid through 2 redirects", "Lost", "bad"],
      ["UTMs on the landing page", "Kept", "ok"],
      ["Contact form: hidden fields", "Missing", "warn"],
      ["Calendly embed", "Invisible to GA4", "bad"],
    ],
    sum: "verdict → source lost at the redirect",
    href: "/apps/lead-path",
    note: "Free · bulk mode for whole campaigns.",
  },
  {
    key: "ai_crawler_gate",
    kind: "TOOL 03 · AI SEARCH",
    name: "AI Visibility Check",
    desc: "Can ChatGPT, Perplexity, Claude and Google AI Overviews find and quote your site, and how often do they actually cite you? Plain verdict, live citation sample, copy-paste fix.",
    sample: [
      ["ChatGPT search", "Blocked", "bad"],
      ["Perplexity", "Can find you", "ok"],
      ["Google AI Overviews", "Can't quote you", "warn"],
      ["Cited in buyer questions", "2 of 5", "info"],
    ],
    sum: "3 of 6 AI assistants can find and quote you",
    href: "/apps/ai-crawler-gate",
    note: "Free · copy the fixed robots.txt.",
  },
];

export default function MicroTools() {
  const [t, setT] = useState(0);
  const N = TOOLS.length;
  const go = (i) => setT(Math.max(0, Math.min(N - 1, i)));
  return (
    <>
      <div className="tools-head">
        <h2 data-reveal="60" className="h2">Micro tools for <em>everyday</em> data work.</h2>
        {N > 1 && (
          <div data-reveal="120" className="tools-nav">
            <span className="count">0{t + 1} / 0{N}</span>
            <button className="arrow prev" aria-label="Previous tool" disabled={t === 0} onClick={() => go(t - 1)}>←</button>
            <button className="arrow next" aria-label="Next tool" disabled={t === N - 1} onClick={() => go(t + 1)}>→</button>
          </div>
        )}
      </div>
      <div data-reveal="160" className="tools-viewport">
        <div className="tools-track" style={{ transform: `translate3d(${-t * 100}%,0,0)` }}>
          {TOOLS.map((tool, i) => {
            const a = i === t;
            const slide = (x, d) => ({ opacity: a ? 1 : 0, transform: `translate3d(${a ? 0 : x}px,0,0)`, transitionDelay: `${d}s` });
            return (
              <div key={tool.key} className="tool-slide" aria-hidden={!a}>
                <div className="tool">
                  <div className="about" style={slide(40, .15)}>
                    <span className="eyebrow" style={{ fontSize: 11 }}>{tool.kind}</span>
                    <h3>{tool.name}</h3>
                    <p>{tool.desc}</p>
                  </div>
                  <div className="sample" style={slide(60, .28)}>
                    <span className="label">SAMPLE OUTPUT</span>
                    <div className="sample-rows">
                      {tool.sample.map(([k, v, c]) => <div key={k} className="sample-row"><span>{k}</span><span className={`pill ${c}`}>{v}</span></div>)}
                    </div>
                    <span className="sum">{tool.sum}</span>
                  </div>
                  <div className="try" style={slide(80, .4)}>
                    <div><span className="label">TRY IT</span><p>{tool.note}</p></div>
                    <Link href={tool.href} data-track="cta_click" data-intent="open_tool" data-loc="micro_tools" data-app={tool.key}>Open the tool <span aria-hidden="true">→</span></Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {N > 1 && (
        <div className="tool-dots">
          {TOOLS.map((tool, i) => <button key={tool.key} aria-label={`Tool ${i + 1}`} className={i === t ? "on" : undefined} onClick={() => go(i)} />)}
        </div>
      )}
    </>
  );
}
