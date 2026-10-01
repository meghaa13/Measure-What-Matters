import ScrollEffects from "./ScrollEffects";
import FunnelStory from "./FunnelStory";
import WorkAccordion from "./WorkAccordion";
import AppsSection from "./AppsSection";

// Design-time props from the original mock
const CTA = "Book a 20-min call";
const SHOW_PROMPTS = true;

const Prompt = ({ children, white }) =>
  SHOW_PROMPTS ? <div data-reveal="0" className={`prompt${white ? " white" : ""}`}>“{children}”</div> : null;

const METHOD = [
  { n: "01 — MEASURE", t: "Tracking you can trust.", d: "GA4 properties, GTM event tracking and MS Clarity set up across client websites, so every conversion is counted once and counted right.", chips: ["GA4", "GTM", "MS Clarity"], bg: "#fff", chipBg: "#F3F0FB" },
  { n: "02 — UNDERSTAND", t: "Behavior, not just totals.", d: "Clickstream mapping, heatmaps and search term analysis, surfaced in Looker Studio dashboards backed by BigQuery and SQL.", chips: ["Looker Studio", "BigQuery", "SQL"], bg: "#F8F6FD", chipBg: "#E8E1F8" },
  { n: "03 — AUTOMATE", t: "Reports that assemble themselves.", d: "Python for web scraping and daily reporting, so the team spends the morning reading insight instead of building spreadsheets.", chips: ["Python", "Web scraping", "Excel"], bg: "#F1EDFB", chipBg: "#fff" },
  { n: "04 — APPLY AI", t: "Models where they earn their place.", d: "Trained through the GI Ventures & NVIDIA AI-ML program and IBM Python for AI. Built computer-vision tools for people counting and PPE compliance.", chips: ["AI-ML", "Computer vision"], dark: true },
];

const SIDE = [
  ["People Counting System", "Python tool monitoring room occupancy with image alerts."],
  ["PPE Violation Detection", "Computer vision for safety compliance."],
  ["Rainbow Room", "Cloud-based mental health screening for LGBTQIA+ users."],
];

const FACTS = [
  ["Two years, live", "Active delivery since June 2024 on client websites where the data is real and the stakes are too."],
  ["Client-facing", "Ran meetings and communication independently for VPP and QS."],
  ["Recognized", "Employee of the Quarter in Analytics at Intelegencia."],
  ["Grounded", "B.Tech in Computer Science with a Data Science minor."],
];

const CERTS = ["Google Analytics 4", "Google Tag Manager Fundamentals", "GI Ventures & NVIDIA AI-ML", "IBM Python for AI & Data Science", "NPTEL Python for Data Science", "Microsoft Tech-Saksham Full Stack", "Google Analytics 4", "Google Tag Manager Fundamentals"];

const NOTES = [
  "Dashboards stop being the product. Decisions become the product.",
  "Tracking is a trust contract with the people being tracked.",
  "Automation and AI should buy analysts time to ask better questions.",
];

export default function Home() {
  return (
    <div className="root">
      <ScrollEffects />

      <div className="progress"><div data-progress="1" /></div>
      <nav className="nav">
        <a href="#top" aria-label="Megha Karnwal — home">
          <span className="logo"><span>mk</span><span className="dot" /></span>
        </a>
        <div className="nav-links">
          <a href="#method" data-track="navigation_click" data-ev-link-text="Method">Method</a>
          <a href="#work" data-track="navigation_click" data-ev-link-text="Work">Work</a>
          <a href="#apps" data-track="navigation_click" data-ev-link-text="Apps">Apps</a>
          <a href="#contact" className="nav-cta" data-track="cta_click" data-ev-cta-location="nav" data-ev-cta-text={CTA}>{CTA}</a>
        </div>
      </nav>

      {/* HERO */}
      <header id="top" className="wrap hero" data-section="hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <div data-reveal="0" className="hero-kicker">Web &amp; Data Analyst · Analytics, Automation, AI</div>
          <h1>
            <span data-reveal="80">Everyone wants AI</span>
            <span data-reveal="180">Few have data</span>
            <span data-reveal="280" className="accent">it can trust.</span>
          </h1>
          <p data-reveal="420">I&apos;m Megha. For two years I&apos;ve set up tracking, read user behavior and automated reporting on live client websites handling sensitive data, so marketing teams know which spend is working.</p>
          <div data-reveal="520" className="hero-ctas">
            <a href="#contact" className="btn btn-primary" data-track="cta_click" data-ev-cta-location="hero" data-ev-cta-text={CTA}>{CTA}</a>
            <a href="#story" className="btn btn-ghost" data-track="cta_click" data-ev-cta-location="hero" data-ev-cta-text="See how I work">See how I work ↓</a>
          </div>
        </div>
        <div className="hero-art">
          <div data-par="0.08" className="halo par" />
          <div data-par="-0.05" className="halo-ring par" />
          <div data-reveal="200" className="portrait">
            <img data-par="-0.14" className="par" src="/uploads/img1.png" alt="Megha Karnwal" />
            <div className="shade" />
            <div className="cap">MEGHA KARNWAL — MEERUT, INDIA</div>
          </div>
        </div>
        <div data-reveal="700" className="toolbelt">
          {["GA4", "GTM", "Looker Studio", "BigQuery", "MS Clarity", "Python", "SQL"].map((t) => <span key={t}>{t}</span>)}
        </div>
      </header>

      {/* STORY */}
      <section id="story" className="wrap story" data-section="story">
        <Prompt>We&apos;re spending on ads. Why isn&apos;t it converting?</Prompt>
        <FunnelStory />
      </section>

      {/* METHOD */}
      <section id="method" className="wrap grid2 method" data-section="method">
        <div style={{ position: "relative" }}>
          <div className="sticky">
            <Prompt>Okay. How do you actually work?</Prompt>
            <h2 data-reveal="80" className="h2">Analytics, then automation, then <em>AI</em>, in that order.</h2>
            <p data-reveal="160" className="lead" style={{ maxWidth: 440, margin: "20px 0 0" }}>Good AI needs clean data, and clean data needs honest tracking. I build from the bottom up.</p>
            <div data-view="1" data-reveal="220" className="duo">
              <img data-par="-0.1" src="/uploads/img2.png" alt="" />
            </div>
          </div>
        </div>
        <div className="cards">
          {METHOD.map((c, i) => (
            <article key={c.n} className={`card${c.dark ? " dark" : ""}`} style={{ top: 110 + i * 28, background: c.bg }}>
              <div className="eyebrow">{c.n}</div>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
              <div className="chips">
                {c.chips.map((x) => <span key={x} className="chip" style={c.chipBg ? { background: c.chipBg } : undefined}>{x}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* WORK */}
      <section id="work" className="work" data-section="work">
        <div className="wrap">
          <Prompt white>Where has this been done for real?</Prompt>
          <div className="work-head">
            <h2 data-reveal="60" className="h2">Live client work.</h2>
            <p data-reveal="120" style={{ fontSize: 16, lineHeight: 1.55, color: "var(--muted)", maxWidth: 360, margin: 0 }}>Delivered at Intelegencia, June 2024 to today, on production websites.</p>
          </div>
          <div className="work-grid">
            <article data-reveal="160" className="feature">
              <div data-par="0.06" className="ring par" />
              <div className="feature-top"><span>FEATURED CASE · CRO</span><span>VPP</span></div>
              <div className="feature-stat">
                <span className="big">+50%</span>
                <span style={{ fontSize: 17, color: "var(--tint-2)" }}>conversion rate</span>
              </div>
              <p>Mapped clickstream behavior on the client website with MS Clarity heatmaps and identified the drop-off points in the purchase funnel.</p>
              <div className="steps4">
                {["Clickstream", "Heatmaps", "Drop-offs", "Fix"].map((s, i) => (
                  <div key={s} className={i === 3 ? "last" : undefined}><div className="n">0{i + 1}</div>{s}</div>
                ))}
              </div>
            </article>
            <WorkAccordion />
          </div>
          <div data-reveal="120" className="side">
            <div className="mono" style={{ fontSize: 12, letterSpacing: ".06em", color: "var(--muted)", paddingTop: 6 }}>BUILT ON THE SIDE</div>
            {SIDE.map(([t, d]) => (
              <div key={t} className="side-card"><div className="t">{t}</div><div className="d">{d}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* APPS */}
      <section id="apps" className="apps" data-section="apps">
        <div className="apps-wrap">
          <Prompt>Do you build things too?</Prompt>
          <div className="work-head">
            <h2 data-reveal="60" className="h2">Apps I&apos;ve <em>built</em>.</h2>
            <p data-reveal="120" style={{ fontSize: 16, lineHeight: 1.55, color: "var(--muted)", maxWidth: 380, margin: 0 }}>Small AI tools that automate the repetitive parts of the job, built and used in my own workflow.</p>
          </div>
          <AppsSection />
        </div>
      </section>

      {/* TRUST */}
      <section className="wrap grid2 trust" data-section="trust">
        <div>
          <Prompt>Can we trust you with our data?</Prompt>
          <h2 data-reveal="80" className="h2">Sensitive data, handled like it&apos;s <em>sensitive</em>.</h2>
          <div className="facts">
            {FACTS.map(([b, s], i) => (
              <div key={b} data-reveal={120 + i * 60} className="fact"><b>{b}</b><span>{s}</span></div>
            ))}
          </div>
        </div>
        <div data-view="1" className="reveal-circle">
          <div className="clip">
            <img data-par="-0.08" className="par" src="/uploads/img3.png" alt="Megha Karnwal" />
          </div>
          <div className="orbit"><span /></div>
        </div>
      </section>

      {/* CERT MARQUEE */}
      <div data-view="1" className="marquee">
        <div>
          {CERTS.map((c, i) => (
            <span key={i} style={{ display: "contents" }}>
              <span>{c}</span>{i < CERTS.length - 1 && <span className="star">✦</span>}
            </span>
          ))}
        </div>
      </div>

      {/* POV */}
      <section className="pov" data-section="point_of_view">
        <div data-view="1" className="pov-img">
          <img data-par="-0.12" src="/uploads/img4.png" alt="Megha at a café" />
          <div className="wash" />
        </div>
        <div className="wrap pov-body">
          <div style={{ maxWidth: 560 }}>
            <div data-reveal="0" className="eyebrow">WORKING NOTES</div>
            <h2 data-reveal="80" className="h2" style={{ marginTop: 18 }}>Where I think analytics is heading.</h2>
            <div className="notes">
              {NOTES.map((n, i) => <div key={n} data-reveal={160 + i * 80} className="note-card">{n}</div>)}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact" data-section="contact">
        <div className="contact-box">
          <div data-par="0.1" className="ring par" />
          <Prompt white>So, what&apos;s next?</Prompt>
          <h2 data-reveal="80">Paying for clicks? Let&apos;s make each one <em className="accent">count</em>.</h2>
          <div className="next-steps">
            {["Send your website and the goal you're paying to reach.", "We talk for 20 minutes about what's tracked today.", "You get a clear plan for tracking, reporting and the first fix."].map((t, i) => (
              <div key={i} data-reveal={140 + i * 60}><div className="eyebrow" style={{ letterSpacing: 0 }}>0{i + 1}</div><div className="t">{t}</div></div>
            ))}
          </div>
          <div data-reveal="320" className="contact-ctas">
            <a href="mailto:meghakarnwal13@gmail.com?subject=Let's%20talk%20analytics" className="btn btn-primary" data-track="contact_click" data-ev-contact-method="email" data-ev-link-location="contact_cta" data-ev-cta-text={CTA}>{CTA}</a>
            <a href="https://linkedin.com/in/megha-karnwal-453889251" target="_blank" rel="noopener" className="btn btn-white" data-track="contact_click" data-ev-contact-method="linkedin" data-ev-link-location="contact_cta">LinkedIn</a>
            <a href="/uploads/MeghaKarnwal-%20web%20analytics%20resume.pdf" download="Megha-Karnwal-Resume.pdf" className="btn btn-ghost" data-track="resume_download" data-ev-link-location="contact_cta">Download résumé</a>
          </div>
          <div data-reveal="380" style={{ marginTop: 22, fontSize: 15, color: "var(--muted)" }}>
            or write directly to <a href="mailto:meghakarnwal13@gmail.com" data-track="contact_click" data-ev-contact-method="email" data-ev-link-location="contact_text">meghakarnwal13@gmail.com</a>
          </div>
        </div>
        <footer className="footer"><span>© 2026 Megha Karnwal</span><span>Analytics · Automation · AI</span></footer>
      </section>
    </div>
  );
}
