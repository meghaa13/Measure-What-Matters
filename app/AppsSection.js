"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track, uiEvent } from "./lib/analytics";

const DOWNLOAD = "/downloads/Comment-Co-Pilot.zip";

const STEPS = [
  ["A Draft comment button appears", "It sits under every post in your feed."],
  ["It reads the whole post", "Comment Co-Pilot reads the post, any media, and the existing comments."],
  ["Three distinct drafts", "Three distinct, neutral drafts come back — never three rewordings of one line."],
  ["You stay in control", "Pick one. It fills LinkedIn's comment box — you still review and click Post yourself."],
];

const DRAFTS = [
  { label: "Affirm & extend", text: "We saw the same shift — paid social's assisted conversions finally showed up instead of getting buried under last-click search." },
  { label: "Ask a question", text: "Did budget actually move after the switch, or did the model change stay mostly a reporting exercise?" },
  { label: "Add a practical tip", text: "Worth comparing assisted conversions before and after the switch. That is usually where the shift shows up first." },
];

const INSTALL = [
  ["Unzip the download", "Extract Comment-Co-Pilot.zip to a folder you will keep."],
  ["Get a free Gemini API key", "Go to aistudio.google.com/apikey, sign in with a Google account and click Create API key. No credit card needed."],
  ["Load the extension", "Open chrome://extensions, turn on Developer mode (top right), click Load unpacked and select the unzipped folder."],
  ["Add your key", "Click the extension icon in the toolbar → Open settings → paste the key → Save."],
  ["Capture your voice", "Visit your own LinkedIn profile page once. It captures your headline, about and experience in the background."],
  ["Use it", "Open your feed and click ✎ Draft comment next to Like/Comment/Share. Pick a draft, insert it, review, then click Post."],
];

const APPS = [["01", "Comment Co-Pilot"], ["02", "The Clean Tracking Plan"]];

const CTP_STEPS = ["Pick your business, market and stack", "Every field gets one of four classes", "Consent mapped to every tag", "Copy the code that matches"];
const CTP_CLASSES = [["Safe", 26, "#1F7A55"], ["Gated", 9, "#8A5A00"], ["Hash only", 3, "#5B43B5"], ["Never", 6, "#B42335"]];
const CTP_FIELDS = [
  ["form_id", "#E3F4EC", "#1F7A55"], ["lead_source", "#E3F4EC", "#1F7A55"], ["request_id", "#FBF0D9", "#8A5A00"],
  ["sha256_email_address", "#ECE6FB", "#5B43B5"], ["email", "#FBE6E9", "#B42335"],
];

const APP_KEYS = ["comment_co_pilot", "clean_tracking_plan"];

const PIN_TOP = 84;

export default function AppsSection() {
  const [st, setSt] = useState(0);
  const [typed, setTyped] = useState("");
  const [pinned, setPinned] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [app, setApp] = useState(0);
  const [ctpK, setCtpK] = useState(0);
  const trackRef = useRef(null);
  const stRef = useRef(0);
  const visibleRef = useRef(false);
  const timers = useRef({});
  const reduceRef = useRef(false);

  const go = useCallback((i) => {
    const n = (i + 4) % 4;
    stRef.current = n;
    clearInterval(timers.current.type);
    setSt(n);
    setTyped("");
    if (n === 3) {
      const txt = DRAFTS[0].text;
      let k = 0;
      timers.current.type = setInterval(() => {
        k += 2;
        setTyped(txt.slice(0, k));
        if (k >= txt.length) clearInterval(timers.current.type);
      }, 22);
    }
  }, []);

  // Pin (scroll-driven) on wide screens; autoplay on narrow ones.
  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onResize = () => setPinned(false);  // v4: autoplay everywhere, no scroll-pinning
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const tr = trackRef.current;
    const t = timers.current;
    if (pinned) {
      let raf, smooth = null;
      const tick = () => {
        const vh = window.innerHeight;
        const r = tr.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -(r.top - PIN_TOP) / Math.max(1, r.height - vh + PIN_TOP)));
        smooth = smooth == null ? p : smooth + (p - smooth) * 0.12;
        tr.style.setProperty("--cp", smooth.toFixed(4));
        const s = Math.min(3, Math.floor(p * 4));
        if (s !== stRef.current) go(s);
        raf = requestAnimationFrame(tick);
      };
      tick();
      return () => cancelAnimationFrame(raf);
    }
    const schedule = () => {
      clearTimeout(t.auto);
      if (!visibleRef.current || reduceRef.current) return;
      t.auto = setTimeout(() => { go(stRef.current + 1); schedule(); }, 4200);
    };
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      if (e.isIntersecting) schedule(); else clearTimeout(t.auto);
    }, { rootMargin: "-15% 0px -15% 0px" });
    io.observe(tr);
    t.schedule = schedule;
    return () => { io.disconnect(); clearTimeout(t.auto); };
  }, [pinned, go]);

  useEffect(() => () => { clearInterval(timers.current.type); clearTimeout(timers.current.auto); }, []);

  // Clean Tracking Plan preview: count the class totals up once step 2 is reached.
  const counting = app === 1 && st >= 1;
  useEffect(() => {
    if (!counting) { setCtpK(0); return; }
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0 - 150) / 900);
      setCtpK(p <= 0 ? 0 : 1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [counting]);

  const selectApp = (i, method) => {
    if (i !== app) track("nav_click", { click_surface: "side_hustle_tabs", click_text: APP_KEYS[i], click_url: null, method });
    setApp(i);
  };
  const pane = (on) => ({
    opacity: on ? 1 : 0,
    transform: on ? "none" : "translate3d(0,14px,0) scale(0.985)",
    pointerEvents: on ? "auto" : "none",
    visibility: on ? "visible" : "hidden",
    transitionDelay: `0s, 0s, ${on ? "0s" : ".6s"}`,
  });

  const jump = (i) => {
    const tr = trackRef.current;
    if (!pinned || !tr) { go(i); timers.current.schedule?.(); return; }
    const top = tr.getBoundingClientRect().top + window.scrollY;
    const span = tr.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * ((i + 0.5) / 4), behavior: "smooth" });
  };

  const hint = st === 3 ? "THAT’S THE WHOLE FLOW" : pinned ? "KEEP SCROLLING" : "TAP A STEP";
  const picked = st === 3;

  return (
    <>
      <div data-reveal="140" role="tablist" aria-label="Apps" className="app-tabs">
        {APPS.map(([num, name], i) => (
          <button key={name} role="tab" aria-selected={app === i} className={`tab${app === i ? " on" : ""}`} onClick={() => selectApp(i, "tab")}>
            <span className="num">{num}</span>{name}
          </button>
        ))}
      </div>
      <div ref={trackRef} className="co-track" style={{ height: pinned ? "300vh" : "auto" }}>
        <div className="co-stage" style={{ position: pinned ? "sticky" : "static", top: PIN_TOP }}>
        <div className="co-pane" aria-hidden={app !== 0} style={pane(app === 0)}>
          {/* left: copy + steps */}
          <div data-reveal="160">
            <div className="co-tags">
              <span className="co-badge">APP 01</span>
              <span className="co-kind">CHROME EXTENSION · LINKEDIN</span>
            </div>
            <h3 className="co-title">Comment Co-Pilot</h3>
            <p className="co-desc">Reads the post you&apos;re looking at — text, image, video or carousel — and drafts three neutral, on-brand comment options. You always click Post yourself.</p>
            <div role="tablist" className="co-steps">
              {STEPS.map(([title, caption], i) => {
                const a = i === st;
                return (
                  <button key={title} role="tab" aria-selected={a} className={`co-step${a ? " on" : ""}`} onClick={() => { jump(i); uiEvent("app_step", title, "selected", { click_surface: "side_hustle", app_name: "comment_co_pilot", step_number: i + 1 }); }}>
                    <span className="n">0{i + 1}</span>
                    <span className="body">
                      <span className="t">{title}</span>
                      <span className="cap"><span>{caption}</span></span>
                    </span>
                    <span className="bar" style={{ opacity: pinned && i <= st ? 1 : 0, transform: `scaleX(clamp(0, calc(var(--cp,0) * 4 - ${i}), 1))` }} />
                  </button>
                );
              })}
            </div>
            <div className="co-hint"><span />{hint}</div>
          </div>

          {/* right: animated LinkedIn mock */}
          <div data-reveal="240" style={{ position: "relative" }}>
            <div data-par="0.06" className="co-backdrop par" />
            <div className="co-browser">
              <div className="co-chrome">
                <span /><span /><span />
                <span className="url">linkedin.com/feed</span>
              </div>
              <div className="co-feed">
                <div className="co-post">
                  <div className="co-scan" style={{ opacity: st === 1 ? 1 : 0, animation: st === 1 ? "coSweep 1.6s ease-in-out infinite" : "none" }} />
                  <div className="co-author">
                    <div className="avatar">AR</div>
                    <div><div className="name">Alex Rivera</div><div className="meta">Head of Growth · 2h</div></div>
                  </div>
                  <p className="co-text">We moved from last-click to data-driven attribution in GA4 three months ago. Pipeline credited to organic content jumped 22% overnight — not because organic got better, just because last-click had been starving it of credit the whole time.</p>
                  <div className="co-actions">
                    <span>Like</span><span>Comment</span><span>Share</span>
                    <span className="co-draft-btn" style={{
                      background: st === 1 ? "#5B43B5" : st >= 2 ? "#F3F0FB" : "#fff",
                      color: st === 1 ? "#fff" : "#5B43B5",
                      transform: `scale(${st === 0 ? 1.06 : 1})`,
                      boxShadow: st === 0 ? "0 0 0 6px rgba(142,116,221,0.18)" : "0 0 0 0 rgba(142,116,221,0)",
                    }}>
                      <span className="dot" style={{ opacity: st === 1 ? 1 : 0.5, animation: st === 1 ? "coPulse .9s ease-in-out infinite" : "none" }} />
                      {st === 1 ? "Drafting…" : st >= 2 ? "Drafted" : "Draft comment"}
                    </span>
                  </div>
                  <div className="co-expand" style={{ gridTemplateRows: st === 1 ? "1fr" : "0fr" }}>
                    <div>
                      <div className="co-reads">
                        {["Post text", "Media", "Comments"].map((l, i) => (
                          <span key={l} style={{
                            background: st === 1 ? "#E8E1F8" : "#F8F6FD", color: st === 1 ? "#5B43B5" : "#9A93AE",
                            transitionDelay: `${300 + i * 500}ms`,
                          }}>{st === 1 ? "✓ " : ""}{l}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="co-expand slow" style={{ gridTemplateRows: st >= 2 ? "1fr" : "0fr" }}>
                    <div>
                      <div className="co-panel">
                        <div className="head">3 DRAFTS, IN YOUR VOICE</div>
                        <div className="list">
                          {DRAFTS.map((d, i) => {
                            const sel = picked && i === 0;
                            return (
                              <div key={d.label} className="co-draft" style={{
                                opacity: st >= 2 ? 1 : 0, transform: `translate3d(0,${st >= 2 ? 0 : 12}px,0)`,
                                transitionDelay: `${st === 2 ? 250 + i * 160 : 0}ms, ${st === 2 ? 250 + i * 160 : 0}ms, 0s, 0s`,
                                borderColor: sel ? "#8E74DD" : "#E4DEF2", background: sel ? "#F3F0FB" : "#fff",
                              }}>
                                <div className="top">
                                  <span className="lbl">{d.label}</span>
                                  <span className="sel" style={{ opacity: sel ? 1 : 0 }}>✓ selected</span>
                                </div>
                                <div className="txt">{d.text}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="co-box" style={{ borderColor: picked ? "#8E74DD" : "#E4DEF2" }}>
                    <span style={{ color: picked ? "#1E1A2B" : "#9A93AE" }}>
                      {picked ? typed : "Add a comment…"}
                      <span className="caret" style={{ opacity: picked && typed.length < DRAFTS[0].text.length ? 1 : 0 }} />
                    </span>
                    <span className="post" style={{ borderColor: picked ? "#5B43B5" : "#E4DEF2", color: picked ? "#5B43B5" : "#9A93AE" }}>Post</span>
                  </div>
                  <div className="co-note" style={{ opacity: picked ? 1 : 0 }}>You review, you click Post.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* APP 02 · The Clean Tracking Plan */}
        <div id="clean-tracking-plan" className="co-pane" aria-hidden={app !== 1} style={pane(app === 1)}>
          <div style={{ minWidth: 0 }}>
            <div className="co-tags">
              <span className="co-badge">APP 02</span>
              <span className="co-kind">LIVE · PRIVACY-FIRST ANALYTICS</span>
            </div>
            <h3 className="co-title">The Clean <em className="accent">Tracking Plan</em></h3>
            <p className="co-desc">Most tracking plans list what to collect. This one decides how each field is treated before it&apos;s collected, so personal data never reaches analytics by accident.</p>
            <div role="tablist" className="co-steps">
              {CTP_STEPS.map((title, i) => {
                const a = i === st;
                return (
                  <button key={title} role="tab" aria-selected={a} className={`co-step tp-step${a ? " on" : ""}`} onClick={() => { jump(i); uiEvent("app_step", title, "selected", { click_surface: "side_hustle", app_name: "clean_tracking_plan", step_number: i + 1 }); }}>
                    <span className="n">0{i + 1}</span>
                    <span className="t">{title}</span>
                    <span className="bar" style={{ opacity: pinned && i <= st ? 1 : 0, transform: `scaleX(clamp(0, calc(var(--cp,0) * 4 - ${i}), 1))` }} />
                  </button>
                );
              })}
            </div>
            <div className="co-hint"><span />{hint}</div>
          </div>

          <div style={{ position: "relative", minWidth: 0 }}>
            <div data-par="0.06" className="co-backdrop par" />
            <div className="tp-card">
              <div className="tp-card-top">
                <div className="chips">
                  <span className="tp-type on" style={{ boxShadow: st === 0 ? "0 0 0 6px rgba(142,116,221,0.22)" : "0 0 0 0 rgba(142,116,221,0)" }}>B2B lead-gen</span>
                  <span className="tp-type">E-commerce</span>
                </div>
                <span className="tp-meta">US · GOOGLE ADS · CRM</span>
              </div>
              <div className="tp-classes">
                {CTP_CLASSES.map(([label, n, color], i) => (
                  <div key={label} className="tp-class" style={{
                    borderLeftColor: color, opacity: st >= 1 ? 1 : 0.15, transform: `translate3d(0,${st >= 1 ? 0 : 8}px,0)`,
                    transitionDelay: `${st === 1 ? i * 90 : 0}ms`,
                  }}>
                    <div className="num" style={{ color }}>{st >= 1 ? Math.round(n * ctpK) : 0}</div>
                    <div className="lbl">{label}</div>
                  </div>
                ))}
              </div>
              <div className="tp-event" style={{ opacity: st >= 2 ? 1 : 0.15, borderColor: st === 2 ? "#8E74DD" : "#E4DEF2" }}>
                <div className="head">
                  <span className="name">generate_lead</span>
                  <span className="consent" style={{
                    background: st >= 2 ? "#5B43B5" : "#F3F0FB", color: st >= 2 ? "#fff" : "#5D5670", transform: `scale(${st === 2 ? 1.06 : 1})`,
                  }}>analytics_storage</span>
                </div>
                <div className="fields">
                  {CTP_FIELDS.map(([k, bg, color], i) => (
                    <span key={k} style={{
                      background: bg, color, opacity: st >= 2 ? 1 : 0, transform: `translate3d(0,${st >= 2 ? 0 : 6}px,0)`,
                      transitionDelay: `${st === 2 ? 200 + i * 90 : 0}ms`,
                      textDecoration: k === "email" && st >= 2 ? "line-through" : "none",
                    }}>{k}</span>
                  ))}
                </div>
              </div>
              <div className="tp-leak" style={{
                opacity: st >= 2 ? 1 : 0.15, transform: `translate3d(0,${st >= 2 ? 0 : 8}px,0)`, transitionDelay: `${st === 2 ? 700 : 0}ms`,
              }}>
                <span className="tag">LEAK</span>
                <span>Email in <code>page_location</code> after a GET form. Fix: POST forms plus GA4 data redaction.</span>
              </div>
              <div className="tp-code" style={{ opacity: st >= 3 ? 1 : 0.15, transform: `translate3d(0,${st >= 3 ? 0 : 8}px,0)` }}>
                <div className="copy">
                  <span style={{ opacity: st === 3 ? 0 : 1, transitionDelay: st === 3 ? "900ms" : "0ms" }}>COPY</span>
                  <span className="done" style={{ opacity: st === 3 ? 1 : 0, transitionDelay: st === 3 ? "900ms" : "0ms" }}>COPIED ✓</span>
                </div>
                <pre><span className="fn">gtag</span>(&apos;consent&apos;, &apos;default&apos;, {"{"}{"\n"}  analytics_storage: <span className="s">&apos;denied&apos;</span>,{"\n"}  ad_user_data: <span className="s">&apos;denied&apos;</span>{"\n"}{"}"});</pre>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* per-app action bar */}
      {app === 0 ? (
        <div key="co" className="app-bar-in" style={{ maxWidth: 720 }}>
          <div className="co-install">
            <div className="row">
              <a href={DOWNLOAD} download="Comment-Co-Pilot.zip" onClick={() => { setInstallOpen(true); track("secondary_cta_click", { click_surface: "side_hustle", click_text: "Download", click_url: DOWNLOAD, cta_intent: "download", app_name: "comment_co_pilot" }); }} className="co-dl">
                <span className="ico">↓</span>Download .zip
              </a>
              <button className="co-how" aria-expanded={installOpen} onClick={() => { setInstallOpen((o) => !o); uiEvent("install_guide", "comment_co_pilot", installOpen ? "closed" : "opened", { click_surface: "side_hustle" }); }}>
                How to install<span style={{ transform: `rotate(${installOpen ? 45 : 0}deg)` }}>+</span>
              </button>
              <span className="meta">Chrome extension · about 2 minutes to set up</span>
            </div>
            <div className="co-expand slow" style={{ gridTemplateRows: installOpen ? "1fr" : "0fr" }}>
              <div>
                <ol className="co-install-list">
                  {INSTALL.map(([title, body], i) => (
                    <li key={title} style={{
                      opacity: installOpen ? 1 : 0, transform: `translate3d(${installOpen ? 0 : -12}px,0,0)`,
                      transitionDelay: `${installOpen ? 150 + i * 90 : 0}ms`,
                    }}>
                      <span className="n">{i + 1}</span>
                      <span className="b"><span className="t">{title}</span><span className="d">{body}</span></span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div key="ctp" className="app-bar-in tp-bar">
          <Link href="/apps/clean-tracking-plan" className="co-dl tp-open" data-track="cta_click" data-intent="open_tool" data-loc="side_hustle" data-app="clean_tracking_plan">Open the builder <span aria-hidden="true">→</span></Link>
          <span className="meta">Free · runs in your browser · nothing you type is sent</span>
        </div>
      )}

    </>
  );
}
