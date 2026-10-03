import ScrollEffects from "./ScrollEffects";
import SiteChrome from "./SiteChrome";
import FunnelStory from "./FunnelStory";
import MethodCards from "./MethodCards";
import MicroTools from "./MicroTools";
import AppsSection from "./AppsSection";
import Faq from "./Faq";
import { HeroEyebrow, HeroSub } from "./HeroCopy";
import { BookLink, Prompt } from "./Bits";
import Stack from "./Stack";
import { CTA, EMAIL, LINKEDIN, RESUME, bookTarget, contactHref } from "./lib/site";

const CASES = [
  { dark: true, top: "#2E2263", kind: "IN-HOUSE · MEASUREMENT + EXPERIMENTS", name: "Intelegencia", tools: "GA4 · BigQuery · Statsig",
    did: ["Built the GA4 tracking framework from scratch", "Joined form submits to approved and rejected lead outcomes in BigQuery", "Enhanced conversions and Statsig homepage experiments"],
    kpis: ["Lead approval rate", "Enhanced conversions", "AI-search leads"], out: "Employee of the Quarter, Analytics" },
  { top: "#E8E1F8", kind: "IMPLEMENTATION · UX", name: "AvePoint", tools: "GA4 · MS Clarity",
    did: ["GA4 and MS Clarity set up from scratch", "UX analysis of on-site behavior"],
    kpis: ["Engagement rate", "Scroll depth", "Rage clicks"], out: "Daily data-driven recommendations" },
  { top: "#DCD3F6", kindColor: "#4A3699", toolsColor: "#4A4363", kind: "DASHBOARDS · CLIENT LEAD", name: "QS", tools: "Looker Studio",
    did: ["Dashboards for engagement and CTR trends", "Ran client meetings independently"],
    kpis: ["CTR", "Engagement rate", "Returning users"], out: "Self-serve reporting for the client" },
  { top: "#EEE9FA", kind: "WEB ANALYTICS", name: "Cordia Energy", tools: "GA4 · GTM · MS Clarity",
    did: ["GA4, GTM and MS Clarity implementation", "Event tracking across key site actions"],
    kpis: ["Form submissions", "Traffic by source", "Event coverage"], out: "Daily performance reporting" },
];

const BUILDS = [
  ["LLM PIPELINE", "BlogAI research pipeline", "15 stages, parallel multi-model drafting, hallucination guards and a Streamlit UI."],
  ["COMPUTER VISION", "People Counting System", "Live room occupancy with image alerts."],
  ["COMPUTER VISION", "PPE Violation Detection", "Automated safety-compliance checks."],
  ["CLOUD", "Rainbow Room", "Mental health screening for LGBTQIA+ users."],
];

const FACTS = [
  ["Consent first", "Consent Mode configured and debugged so tags fire only when they are allowed to."],
  ["PII stays out", "Lead outcomes are joined by a request ID, and ad-platform matching uses hashed data. Never raw names or emails in analytics."],
  ["Clean at the source", "Staging traffic separated from production. Inflated sessions and \"(not set)\" dimensions fixed where they start, not patched in the report."],
  ["Live, not practice", "Production work on real lead flows, including financial services. Client meetings run independently for VPP and QS."],
  ["Trained for it", "B.Tech in Computer Science with a Data Science minor, plus the certifications below."],
];

const CERTS = ["Google Analytics 4", "Google Tag Manager Fundamentals", "GI Ventures & NVIDIA AI-ML", "IBM Python for AI & Data Science", "NPTEL Python for Data Science", "Microsoft Tech-Saksham Full Stack", "Google Analytics 4", "Google Tag Manager Fundamentals"];

const NOTES = [
  "AI is only as smart as the tracking plan underneath it.",
  "Dashboards stop being the product. Decisions become the product.",
  "AI search is the newest referral channel, and most teams aren't measuring it yet.",
  "Tracking is a trust contract with the people being tracked.",
];

const NEXT = ["Book 20 minutes and tell me the question.", "We look at what's tracked, what's trusted and what's still manual.", "You leave with the first three fixes, in priority order."];

export default function Home() {
  return (
    <div className="root">
      <ScrollEffects />
      <SiteChrome />

      {/* HERO */}
      <header id="top" className="wrap hero" data-section="hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <HeroEyebrow />
          <h1>
            <span data-reveal="80">Everyone wants AI.</span>
            <span data-reveal="180">Few have data</span>
            <span data-reveal="280" className="accent">it can trust.</span>
          </h1>
          <HeroSub />
          <div data-reveal="520" className="hero-ctas">
            <BookLink loc="hero" className="btn btn-primary">{CTA}</BookLink>
            <a href="#story" className="btn btn-ghost" data-track="nav_click" data-loc="hero">See how I work ↓</a>
          </div>
          <div data-reveal="600" className="reassure">Free · 20 minutes · No slides, just your data.</div>
        </div>
        <div className="hero-art">
          <div data-par="0.08" className="halo par" />
          <div data-par="-0.05" className="halo-ring par" />
          <div data-reveal="200" className="portrait">
            <img data-par="-0.14" className="par" src="/uploads/img1.webp" alt="Megha Karnwal, analyst working across analytics, automation and AI" />
            <div className="shade" />
            <div className="cap">MEGHA KARNWAL — ANALYTICS · AUTOMATION · AI</div>
          </div>
        </div>
      </header>

      {/* STORY */}
      <section id="story" className="wrap story" data-section="story">
        <Prompt>We have the traffic. Why isn&apos;t it turning into results?</Prompt>
        <FunnelStory />
      </section>

      {/* METHOD */}
      <section id="method" className="wrap grid2 method" data-section="method">
        <div style={{ position: "relative" }}>
          <div className="sticky">
            <Prompt>Okay. So where does AI come in?</Prompt>
            <h2 data-reveal="80" className="h2">Analytics, then automation, then <em>AI</em>, in that order.</h2>
            <p data-reveal="160" className="lead" style={{ maxWidth: 440, margin: "20px 0 0" }}>AI multiplies whatever you feed it, including bad tracking. So I build from the bottom up: measure honestly, automate the repetitive work, then add AI where it saves real hours or finds real signal.</p>
          </div>
        </div>
        <MethodCards />
      </section>

      {/* WORK */}
      <section id="work" className="work" data-section="work">
        <div className="wrap">
          <Prompt white>Where has this been done for real?</Prompt>
          <div className="work-head">
            <h2 data-reveal="60" className="h2">On live sites, every day.</h2>
            <div data-reveal="120" className="stats">
              <div><b>4</b><span>CLIENT SITES</span></div>
              <div><b>2 yrs</b><span>SINCE JUNE 2024</span></div>
              <div><b>Intelegencia</b><span>IN-HOUSE AT</span></div>
            </div>
          </div>
          <article data-reveal="160" className="vpp">
            <div className="lead-cell">
              <span className="case-kind">CRO ANALYSIS · CLIENT LEAD</span>
              <h3 className="case-name">VPP</h3>
              <span className="case-tools">MS Clarity · GA4</span>
              <div className="result"><b>+50%</b><span>conversion rate after fixing funnel drop-offs</span></div>
            </div>
            <div>
              <span className="label">WHAT I DID</span>
              <ul className="ticks"><li>Mapped clickstream behavior with MS Clarity heatmaps</li><li>Identified the purchase-funnel drop-off points</li><li>Ran client meetings and communication</li></ul>
            </div>
            <div>
              <span className="label">KPIS OWNED</span>
              <div className="kpis">{["Conversion rate", "Funnel drop-off", "Checkout completion", "Click paths"].map((k) => <span key={k}>{k}</span>)}</div>
            </div>
          </article>
          <div className="cases">
            {CASES.map((c) => (
              <article key={c.name} data-reveal="180" className={`case${c.dark ? " dark" : ""}`}>
                <div className="case-top" style={{ background: c.top }}>
                  <span className="case-kind" style={c.kindColor ? { color: c.kindColor } : undefined}>{c.kind}</span>
                  <h3 className="case-name">{c.name}</h3>
                  <span className="case-tools" style={c.toolsColor ? { color: c.toolsColor } : undefined}>{c.tools}</span>
                </div>
                <ul className="ticks">{c.did.map((d) => <li key={d}>{d}</li>)}</ul>
                <div className="case-foot"><span className="out">{c.out}</span><div className="kpis">{c.kpis.map((k) => <span key={k}>{k}</span>)}</div></div>
              </article>
            ))}
          </div>
          <div data-reveal="80" className="builds">
            <div className="intro"><span className="label">AUTOMATION + AI BUILDS</span><b>Where analytics meets AI.</b></div>
            {BUILDS.map(([k, t, d]) => <div key={t}><span className="k">{k}</span><span className="t">{t}</span><span className="d">{d}</span></div>)}
          </div>
        </div>
      </section>


      {/* STACK */}
      <section id="stack" className="wrap techstack" data-section="stack">
        <Prompt>What do you actually work with?</Prompt>
        <h2 data-reveal="80" className="h2">One stack, in the order the work <em>happens</em>.</h2>
        <p data-reveal="140" className="stack-sub">Tap a tool to see what I use it for.</p>
        <Stack />
      </section>

      {/* MICRO TOOLS */}
      <section id="tools" className="tools" data-section="micro_tools">
        <div className="wrap">
          <Prompt>Anything I can use right now?</Prompt>
          <MicroTools />
        </div>
      </section>

      {/* TRUST */}
      <section className="wrap grid2 trust" data-section="trust">
        <div>
          <Prompt>Can we trust you with our data?</Prompt>
          <h2 data-reveal="80" className="h2">Sensitive data, handled like it&apos;s <em>sensitive</em>.</h2>
          <div className="facts">
            {FACTS.map(([b, s], i) => <div key={b} data-reveal={120 + i * 60} className="fact"><b>{b}</b><span>{s}</span></div>)}
          </div>
        </div>
        <div data-view="1" className="reveal-circle">
          <div className="clip"><img loading="lazy" data-par="-0.08" className="par" src="/uploads/img3.webp" alt="Megha Karnwal" /></div>
          <div className="orbit"><span /></div>
        </div>
      </section>

      {/* CERT MARQUEE */}
      <div data-view="1" className="marquee">
        <div>
          {CERTS.map((c, i) => (
            <span key={i} style={{ display: "contents" }}><span>{c}</span>{i < CERTS.length - 1 && <span className="star">✦</span>}</span>
          ))}
        </div>
      </div>


      {/* SIDE HUSTLE */}
      <section id="apps" className="apps" data-section="side_hustle">
        <div className="apps-wrap">
          <Prompt>What do you build for fun?</Prompt>
          <div className="work-head">
            <h2 data-reveal="60" className="h2">Side <em>hustle</em>.</h2>
            <p data-reveal="120" style={{ fontSize: 16, lineHeight: 1.55, color: "var(--muted)", maxWidth: 380, margin: 0 }}>Weekend builds I make for fun, then end up using every day.</p>
          </div>
          <AppsSection />
        </div>
      </section>

      {/* POV */}
      <section className="pov" data-section="point_of_view">
        <div data-view="1" className="pov-img">
          <img loading="lazy" data-par="-0.12" src="/uploads/img5.webp" alt="Megha at a café with a coffee" />
          <div className="wash" />
        </div>
        <div className="wrap pov-body">
          <div style={{ maxWidth: 760 }}>
            <Prompt white>Where do you think this is all heading?</Prompt>
            <div data-reveal="0" className="eyebrow">WORKING NOTES</div>
            <h2 data-reveal="80" className="h2" style={{ marginTop: 18 }}>Where analytics is heading next.</h2>
            <div className="notes">
              {NOTES.map((n, i) => <div key={n} data-reveal={160 + i * 60} className="note-card">{n}</div>)}
            </div>
            <BookLink loc="pov" className="text-link">Want this thinking on your data? Book 20 minutes →</BookLink>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact" data-cta-zone="1" data-section="contact">
        <div className="contact-box">
          <div data-par="0.1" className="ring par" />
          <Prompt white>So, what&apos;s next?</Prompt>
          <h2 data-reveal="80">Bring one question your data can&apos;t answer <em className="accent">yet</em>.</h2>
          <div className="closing">
            <div>
              <ol className="next-steps">
                {NEXT.map((t, i) => <li key={i} data-reveal={140 + i * 60}><span className="eyebrow" style={{ letterSpacing: 0 }}>0{i + 1}</span><span className="t">{t}</span></li>)}
              </ol>
              <div data-reveal="320" className="contact-ctas">
                <a href={contactHref} target={bookTarget} rel={bookTarget ? "noopener" : undefined} className="btn btn-primary" data-track="cta_click" data-loc="contact">{CTA}</a>
            <span className="meta">Free · 20 minutes · No slides, just your data.</span>
          </div>
          <div data-reveal="380" className="contact-alt">
            Prefer email? <a href={`mailto:${EMAIL}?subject=Analytics%2C%20automation%20%26%20AI`} data-track="cta_click" data-intent="email" data-loc="contact">{EMAIL}</a>
                {" · "}<a href={RESUME} download="Megha-Karnwal-Resume.pdf" data-track="cta_click" data-intent="resume_download" data-loc="contact">Résumé (PDF)</a>
              </div>
            </div>
            {/* FAQ lives here now: last questions answered right beside the ask */}
            <div id="faq" data-section="faq">
              <div data-reveal="120" className="eyebrow">BEFORE YOU BOOK</div>
              <Faq />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
