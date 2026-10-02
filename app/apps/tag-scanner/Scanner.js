"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ScrollEffects from "../../ScrollEffects";
import SiteChrome from "../../SiteChrome";
import { track, toolEvent, TOOLS } from "../../lib/analytics";
import { CTA, EMAIL, contactHref } from "../../lib/site";
import { Coverage, Inventory } from "./Report";
import HeroPreview from "./HeroPreview";
import HowItWorks from "./HowItWorks";
import CountUp from "./CountUp";
import { useRecent } from "../../lib/recent";

const CONF_PILL = { Confirmed: "bad", Likely: "warn", Verify: "info" };
const SEV_LABEL = { high: "High", medium: "Medium", low: "Low" };
const FREE_COUNT = 3;
const STEPS = [
  ["Finding tag IDs", "reading the homepage, then archive.org if blocked"],
  ["Fetching configuration", "straight from googletagmanager.com"],
  ["Reading it as data", "parsed, never executed"],
  ["Mapping tags, events and triggers", "translating GTM into plain English"],
  ["Checking what's missing", "forms, calls, bookings, video"],
  ["Running the rules", "with a confidence label on each finding"],
];
const EXAMPLES = ["intelegencia.com", "hotjar.com", "futurismtechnologies.com"];
const NAV = [["r-snapshot", "Snapshot"], ["r-tracked", "What's tracked"], ["r-coverage", "Tracked vs not"], ["r-issues", "Issues"], ["r-next", "Next step"]];

// Inline `code` in finding text (text only, no HTML injection).
const md = (s) => String(s).split("`").map((p, i) => (i % 2 ? <code key={i}>{p}</code> : p));

function Finding({ f, locked, i = 0 }) {
  return (
    <div className={`ths-finding sev-${f.sev}${locked ? " locked" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>
      <div className="head">
        <span className={`pill ${CONF_PILL[f.conf]}`}>{f.conf}</span>
        <span className="sev">{SEV_LABEL[f.sev]} · {f.rule}</span>
      </div>
      <h3>{md(f.title)}</h3>
      <p>{md(f.detail)}</p>
      {f.evidence?.length > 0 && <div className="ev">{f.evidence.slice(0, 6).map((e) => <code key={e}>{e}</code>)}</div>}
      <p className="fix"><b>Fix:</b> {f.fix}</p>
    </div>
  );
}

// Sticky in-report navigation with scroll-spy.
function ReportNav({ items }) {
  const [active, setActive] = useState(items[0]?.[0]);
  const lock = useRef(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (Date.now() < lock.current) return; // a click just set it; let the smooth scroll finish
        let cur = items[0][0];
        for (const [id] of items) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) cur = id; }
        // The last section can't reach the top of the screen, so the page bottom counts as reaching it.
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) cur = items[items.length - 1][0];
        setActive(cur);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [items]);
  const go = (id) => (e) => { e.preventDefault(); setActive(id); toolEvent(TOOLS.scan, "action", { action: "report_nav", section: id.replace(/^r-/, "") }); lock.current = Date.now() + 1000; const el = document.getElementById(id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" }); };
  return (
    <nav className="sx-rnav" aria-label="Report sections">
      {items.map(([id, label], i) => (
        <a key={id} href={`#${id}`} onClick={go(id)} className={active === id ? "on" : ""}><span>0{i + 1}</span>{label}</a>
      ))}
    </nav>
  );
}

export default function Scanner() {
  const [input, setInput] = useState("");
  const [state, setState] = useState("idle"); // idle | scanning | done | error | needIds
  const [step, setStep] = useState(0);
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastInput, setLastInput] = useState("");
  const resultRef = useRef(null);
  const recent = useRecent("tag-scanner", EXAMPLES);

  const scan = async (e, value = input, source = "typed") => {
    e?.preventDefault();
    if (!value.trim()) return;
    setInput(value); setLastInput(value.trim());
    setState("scanning"); setStep(0); setData(null); setMsg(""); setUnlocked(false);
    toolEvent(TOOLS.scan, "start", { input_type: /^(GTM|G|AW|UA)-/i.test(value.trim()) ? "tag_id" : "url", input_source: source });
    const ticker = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 900);
    try {
      const res = await fetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: value }) });
      const json = await res.json();
      if (!res.ok) { setState("error"); setMsg(json.error || "The scan failed. Try again."); toolEvent(TOOLS.scan, "error", { error_type: res.status === 429 ? "rate_limited" : "request_failed" }); return; }
      if (json.needIds) { setState("needIds"); setMsg(json.reason); setData(json); toolEvent(TOOLS.scan, "error", { error_type: json.retry ? "archive_timeout" : "no_tags_found" }); return; }
      setData(json); setState("done"); recent.add(value);
      toolEvent(TOOLS.scan, "complete", { input_source: source, tags_found: json.inventory?.gtm?.reduce((n, m) => n + m.tags.length, 0) || 0, not_tracked: (json.coverage || []).filter((r) => r.status === "not_tracked").length, tracking_health: json.score, findings: json.findings.length, id_source: json.snapshot.source.startsWith("archive") ? "archive" : json.snapshot.source.startsWith("Live") ? "live" : "pasted" });
    } catch {
      setState("error"); setMsg("Couldn't reach the scanner. Check your connection and try again."); toolEvent(TOOLS.scan, "error", { error_type: "network" });
    } finally { clearInterval(ticker); }
  };

  // Lead capture: Netlify Forms (form definition lives in public/__forms.html).
  const unlock = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    setSending(true);
    try {
      await fetch("/__forms.html", {
        method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ "form-name": "tag-scan-report", email: email.trim(), site: data.host, score: String(data.score), findings: data.findings.map((f) => f.rule).join(",") }).toString(),
      });
    } catch { /* still unlock; the report is the visitor's either way */ }
    setSending(false); setUnlocked(true);
    track("generate_lead", { lead_source: "tag_scan", tracking_health: data.score }); // never the email itself
  };

  const s = data?.snapshot;
  const findings = data?.findings || [];
  const scoreTone = data ? (data.score >= 80 ? "good" : data.score >= 55 ? "mid" : "low") : "";
  const navItems = data?.coverage?.length ? NAV : NAV.filter(([id]) => id !== "r-coverage");

  return (
    <div className="ths">
      <ScrollEffects />

      {/* Same navbar and floating Book button as the landing page */}
      <SiteChrome home={false} current="tools" />

      {/* Hero */}
      <section className="sx-hero" data-section="tool_hero">
        <div data-par="0.08" className="sx-halo par" />
        <div data-par="-0.05" className="sx-ring par" />
        <div data-par="0.12" className="sx-ring small par" />
        <div className="sx-wrap sx-hero-grid">
          <div className="sx-hero-copy">
            <div data-reveal="0" className="eyebrow"><span className="dot" />TOOL 01 · ANALYTICS · FREE</div>
            <h1>
              <span data-reveal="80">See what any site</span>
              <span data-reveal="180">is <em>really</em> tracking.</span>
            </h1>
            <p data-reveal="300" className="lede">Every tag, event, conversion and trigger in its Google tag and GTM setup. Then what isn&apos;t tracked, and what&apos;s broken or risky, each with a confidence label.</p>
            <form data-reveal="400" className="sx-form" onSubmit={scan}>
              <span className="ico" aria-hidden="true">⌕</span>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="example.com  or  GTM-XXXXXXX" aria-label="Website or tag ID" autoComplete="off" spellCheck="false" />
              <button type="submit" disabled={state === "scanning"}>{state === "scanning" ? "Scanning…" : "Scan site"}</button>
            </form>
            <div data-reveal="480" className="sx-examples">
              <span>Try:</span>
              {recent.examples.map((x) => <button key={x} type="button" onClick={() => scan(null, x, recent.recent.includes(x) ? "recent" : "example")} disabled={state === "scanning"}>{x}</button>)}
            </div>
            <div data-reveal="560" className="sx-trust">
              <span>Reads public configuration only</span><span>Never logs into anything</span><span>Results in seconds</span>
            </div>
          </div>
          <div data-reveal="200" className="sx-hero-art">
            <HeroPreview input={input} scanned={lastInput} state={state} data={data} onSeeReport={() => document.getElementById("r-snapshot")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
          </div>
        </div>
      </section>

      {/* Result area */}
      <div ref={resultRef} className="sx-result-anchor" />

      {state === "scanning" && (
        <section className="sx-wrap sx-scanning" aria-live="polite">
          <div className="sx-term">
            <div className="sx-term-head"><span className="live">SCANNING · {lastInput}</span><span>{Math.min(step + 1, STEPS.length)} / {STEPS.length}</span></div>
            <div className="sx-term-sweep" />
            {STEPS.map(([t, d], i) => (
              <div key={t} className={`ln ${i < step ? "done" : i === step ? "on" : ""}`}>
                <span className="mk">{i < step ? "✓" : i === step ? "›" : "·"}</span>
                <span className="t">{t}</span><span className="d">{d}</span>
              </div>
            ))}
            <div className="sx-term-bar"><i style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }} /></div>
          </div>
        </section>
      )}

      {(state === "error" || state === "needIds") && (
        <section className="sx-wrap">
          <div className="ths-note" role="alert">
            <p>{msg}</p>
            {state === "needIds" && <p>{data?.retry ? "Try again in a moment, or paste" : "If you know the site's tag ID, paste"} the site&apos;s tag ID above (for example <code>GTM-XXXXXXX</code> or <code>G-XXXXXXXXXX</code>). You can find it in GTM or GA4, or in the page source.</p>}
            {state === "needIds" && data?.retry && <button type="button" className="ths-btn sx-retry" onClick={() => scan(null, lastInput)}>Try again</button>}
          </div>
        </section>
      )}

      {state === "done" && data && (
        <section className="sx-wrap sx-report-wrap">
          <aside className="sx-aside">
            <div className="sx-aside-host"><span className="label">REPORT FOR</span><b>{data.host}</b></div>
            <ReportNav items={navItems} />
            <div className={`sx-aside-score ${scoreTone}`}><span className="label">TRACKING HEALTH</span><b><CountUp to={data.score} /><small>/100</small></b></div>
          </aside>

          <div className="ths-report">
            <section id="r-snapshot" className="sx-band" data-section="report_snapshot">
              <div className="ths-h2row"><h2>Snapshot</h2><span className="ths-sub">{s.source}</span></div>
              <div className="sx-snapgrid">
                {[["Google tags", [...s.gtm, ...s.ga4, ...s.ads].join(", ") || "None"], ["Legacy tags", s.ua.join(", ") || "None"], ["Other tools", s.otherTools.join(", ") || "None detected"],
                  ["Consent banner", s.consent], ["Consent Mode", s.consentMode], ["Server-side tagging", s.serverSide]].map(([k, v], i) => (
                  <div key={k} style={{ animationDelay: `${i * 70}ms` }}><span className="label">{k.toUpperCase()}</span><b>{v}</b></div>
                ))}
              </div>
            </section>

            <div id="r-tracked" className="sx-band tint" data-section="report_tracked"><Inventory inventory={data.inventory} /></div>
            {data.coverage?.length > 0 && <div id="r-coverage" className="sx-band" data-section="report_coverage"><Coverage rows={data.coverage} /></div>}

            <section id="r-issues" className="sx-band tint" data-section="report_issues">
              <section className="ths-top">
                <div className={`ths-score ${scoreTone}`}>
                  <span className="label">TRACKING HEALTH</span>
                  <b><CountUp to={data.score} /><small>/100</small></b>
                  <span className="note">{data.scoreNote}</span>
                </div>
                <div className="ths-summary"><span className="label">SUMMARY</span><p>{data.summary}</p></div>
              </section>

              <div className="ths-h2row" style={{ marginTop: 28 }}>
                <h2>{findings.length ? `Top ${Math.min(FREE_COUNT, findings.length)} issues` : "No issues found"}</h2>
                <span className="ths-legend"><span className="pill bad">Confirmed</span> read from the config <span className="pill warn">Likely</span> strong signal <span className="pill info">Verify</span> needs a look inside</span>
              </div>
              <div className="ths-findings">{findings.slice(0, FREE_COUNT).map((f, i) => <Finding key={i} f={f} i={i} />)}</div>

              {findings.length > FREE_COUNT && (
                <div className="ths-rest">
                  <h2>{unlocked ? "Full report" : `${findings.length - FREE_COUNT} more issue${findings.length - FREE_COUNT > 1 ? "s" : ""}`}</h2>
                  {!unlocked && (
                    <form className="ths-gate" onSubmit={unlock}>
                      <div><b>Get the full report</b><span>Every issue with evidence and the fix. I&apos;ll also send a short note on what to tackle first.</span></div>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" aria-label="Email" />
                      <button type="submit" disabled={sending}>{sending ? "Sending…" : "Show full report"}</button>
                    </form>
                  )}
                  <div className={`ths-findings${unlocked ? "" : " blurred"}`} aria-hidden={!unlocked}>
                    {findings.slice(FREE_COUNT).map((f, i) => <Finding key={i} f={f} locked={!unlocked} i={i} />)}
                  </div>
                </div>
              )}
            </section>

            <section id="r-next" className="sx-next" data-cta-zone="1" data-section="report_next_step">
              <div data-par="0.06" className="ring" />
              <div>
                <span className="label">NEXT STEP</span>
                <h2>Want these confirmed from the inside?</h2>
                <p>This scan is the outside view. The paid audit, with access to your GA4 and GTM, confirms every Likely and Verify item and comes with a fix plan in priority order.</p>
              </div>
              <div className="actions">
                <a href={contactHref} className="ths-btn" data-track="cta_click" data-loc="tag_scan">{CTA}</a>
                <span>or email <a href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Tag audit for ${data.host}`)}`} data-track="email_click" data-loc="tag_scan">{EMAIL}</a></span>
              </div>
            </section>

            <p className="ths-small">&ldquo;Tracked vs not&rdquo; checks the homepage only. Findings describe how tags are configured, not what your reports contain.</p>
          </div>
        </section>
      )}

      {state !== "done" && state !== "scanning" && <HowItWorks />}

      <footer className="sx-foot">
        <div className="sx-wrap">
          <span>© 2026 Megha Karnwal · Tag Health Scan</span>
          <span>Reads only publicly available tag configuration; no login or private data accessed. Not legal advice.</span>
          <Link href="/">meghakarnwal.com ↗</Link>
        </div>
      </footer>
    </div>
  );
}
