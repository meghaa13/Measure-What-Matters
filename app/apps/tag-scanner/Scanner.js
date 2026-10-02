"use client";
import { useState } from "react";
import Link from "next/link";
import { track } from "../../lib/analytics";
import { CTA, EMAIL, contactHref } from "../../lib/site";

const CONF_PILL = { Confirmed: "bad", Likely: "warn", Verify: "info" };
const SEV_LABEL = { high: "High", medium: "Medium", low: "Low" };
const FREE_COUNT = 3;
const STEPS = ["Finding tag IDs", "Fetching configuration from Google", "Reading it as data", "Running the rules"];

// Inline `code` in finding text (text only, no HTML injection).
const md = (s) => String(s).split("`").map((p, i) => (i % 2 ? <code key={i}>{p}</code> : p));

function Finding({ f, locked }) {
  return (
    <div className={`ths-finding sev-${f.sev}${locked ? " locked" : ""}`}>
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

export default function Scanner() {
  const [input, setInput] = useState("");
  const [state, setState] = useState("idle"); // idle | scanning | done | error | needIds
  const [step, setStep] = useState(0);
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [sending, setSending] = useState(false);

  const scan = async (e, value = input) => {
    e?.preventDefault();
    if (!value.trim()) return;
    setState("scanning"); setStep(0); setData(null); setMsg(""); setUnlocked(false);
    track("tag_scan_start", { input_type: /^(GTM|G|AW|UA)-/i.test(value.trim()) ? "tag_id" : "url" });
    const ticker = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 1600);
    try {
      const res = await fetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: value }) });
      const json = await res.json();
      if (!res.ok) { setState("error"); setMsg(json.error || "The scan failed. Try again."); return; }
      if (json.needIds) { setState("needIds"); setMsg(json.reason); setData(json); track("tag_scan_need_ids"); return; }
      setData(json); setState("done");
      track("tag_scan_complete", { tracking_health: json.score, findings: json.findings.length, id_source: json.snapshot.source.startsWith("archive") ? "archive" : json.snapshot.source.startsWith("Live") ? "live" : "pasted" });
    } catch {
      setState("error"); setMsg("Couldn't reach the scanner. Check your connection and try again.");
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

  return (
    <div className="ths">
      <div className="ths-wrap">
        <header className="ths-header">
          <Link href="/#tools" className="ths-back">← Megha Karnwal · Micro tools</Link>
          <div className="eyebrow">TOOL 01 · ANALYTICS</div>
          <h1>Tag Health <em>Scan</em></h1>
          <p className="lede">Reads a website&apos;s Google tag and GTM configuration, checks it against the live site, and reports what&apos;s tracked, what&apos;s broken and what&apos;s risky. Every finding carries a confidence label.</p>
          <form className="ths-form" onSubmit={scan}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="example.com  or  GTM-XXXXXXX" aria-label="Website or tag ID" autoComplete="off" spellCheck="false" />
            <button type="submit" disabled={state === "scanning"}>{state === "scanning" ? "Scanning…" : "Scan"}</button>
          </form>
          <p className="ths-small">This is the outside view: what any visitor&apos;s browser can see. It reads public tag configuration only and never logs into anything.</p>
        </header>

        {state === "scanning" && (
          <div className="ths-progress" aria-live="polite">
            {STEPS.map((t, i) => <div key={t} className={i < step ? "done" : i === step ? "on" : ""}><span />{t}</div>)}
          </div>
        )}

        {(state === "error" || state === "needIds") && (
          <div className="ths-note" role="alert">
            <p>{msg}</p>
            {state === "needIds" && <p>If you know the site&apos;s tag ID, paste it above (for example <code>GTM-XXXXXXX</code> or <code>G-XXXXXXXXXX</code>). You can find it in GTM or GA4, or in the page source.</p>}
          </div>
        )}

        {state === "done" && data && (
          <div className="ths-report">
            {/* Snapshot + score */}
            <section className="ths-top">
              <div className={`ths-score ${scoreTone}`}>
                <span className="label">TRACKING HEALTH</span>
                <b>{data.score}<small>/100</small></b>
                <span className="note">{data.scoreNote}</span>
              </div>
              <div className="ths-snap">
                <span className="label">SNAPSHOT · {data.host}</span>
                <dl>
                  <dt>Source</dt><dd>{s.source}</dd>
                  <dt>Google tags</dt><dd>{[...s.gtm, ...s.ga4, ...s.ads].join(", ") || "None"}{s.ua.length ? ` · legacy ${s.ua.join(", ")}` : ""}</dd>
                  <dt>Other tools</dt><dd>{s.otherTools.join(", ") || "None detected"}</dd>
                  <dt>Consent banner</dt><dd>{s.consent}</dd>
                  <dt>Consent Mode</dt><dd>{s.consentMode}</dd>
                  <dt>Server-side tagging</dt><dd>{s.serverSide}</dd>
                </dl>
              </div>
            </section>

            <section className="ths-summary">
              <span className="label">SUMMARY</span>
              <p>{data.summary}</p>
            </section>

            <section>
              <div className="ths-h2row">
                <h2>{findings.length ? `Top ${Math.min(FREE_COUNT, findings.length)} findings` : "No issues found"}</h2>
                <span className="ths-legend"><span className="pill bad">Confirmed</span> read directly from the config <span className="pill warn">Likely</span> strong signal <span className="pill info">Verify</span> needs a look inside</span>
              </div>
              <div className="ths-findings">
                {findings.slice(0, FREE_COUNT).map((f, i) => <Finding key={i} f={f} />)}
              </div>
            </section>

            {findings.length > FREE_COUNT && (
              <section className="ths-rest">
                <h2>{unlocked ? "Full report" : `${findings.length - FREE_COUNT} more finding${findings.length - FREE_COUNT > 1 ? "s" : ""}`}</h2>
                {!unlocked && (
                  <form className="ths-gate" onSubmit={unlock}>
                    <div>
                      <b>Get the full report</b>
                      <span>Every finding with evidence and the fix. I&apos;ll also send a short note on what to tackle first.</span>
                    </div>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" aria-label="Email" />
                    <button type="submit" disabled={sending}>{sending ? "Sending…" : "Show full report"}</button>
                  </form>
                )}
                <div className={`ths-findings${unlocked ? "" : " blurred"}`} aria-hidden={!unlocked}>
                  {findings.slice(FREE_COUNT).map((f, i) => <Finding key={i} f={f} locked={!unlocked} />)}
                </div>
              </section>
            )}

            <section className="ths-cta">
              <div>
                <h2>Want these confirmed from the inside?</h2>
                <p>This scan is the outside view. The paid audit, with access to your GA4 and GTM, confirms every Likely and Verify item and comes with a fix plan in priority order.</p>
              </div>
              <div className="actions">
                <a href={contactHref} className="ths-btn" data-track="cta_click" data-loc="tag_scan">{CTA}</a>
                <span>or email <a href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Tag audit for ${data.host}`)}`} data-track="email_click" data-loc="tag_scan">{EMAIL}</a></span>
              </div>
            </section>

            <p className="ths-small">Coverage checks (forms, phone and email links, booking widgets, selectors that match nothing on the live pages) are coming in the next version. Findings describe how tags are configured, not what your reports contain.</p>
          </div>
        )}

        <footer className="ths-footer">
          <span>© 2026 Megha Karnwal · Tag Health Scan</span>
          <span>Reads public configuration only. Not legal advice.</span>
        </footer>
      </div>
    </div>
  );
}
