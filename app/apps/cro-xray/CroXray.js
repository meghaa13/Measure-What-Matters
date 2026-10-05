"use client";
import { useEffect, useRef, useState } from "react";
import ScrollEffects from "../../ScrollEffects";
import SiteChrome from "../../SiteChrome";
import { toolEvent, TOOLS } from "../../lib/analytics";
import { CTA, EMAIL, CRO_AI, contactHref } from "../../lib/site";
import { useRecent } from "../../lib/recent";
import { runPsi, psiFindings } from "./engine/psi";
import { AREAS, areaStatus, buildPlan } from "./engine/hypotheses";

const SEV = { high: ["bad", "High"], medium: ["warn", "Medium"], low: ["info", "Low"], info: ["info", "Info"], pass: ["ok", "OK"] };
const EDGE = { high: "fail", medium: "warn" };
const MAX_PAGES = 3;
const CANT_SEE = ["Where visitors actually drop off between steps", "Heatmaps and session recordings", "Which traffic sources and segments convert", "Multi-step and logged-in flows", "Which test to run first, for how long, and whether the traffic supports it"];
const DEMO = [["Positioning", "info", "For review"], ["Calls to action", "warn", "2 to look at"], ["Trust", "ok", "Nothing flagged"], ["Forms", "bad", "3 to look at"], ["Speed", "warn", "1 to look at"], ["Accessibility", "ok", "Nothing flagged"]];
const TILE = { ok: "ok", warn: "warn", bad: "bad", unknown: "info" };

const norm = (v) => { let u = String(v || "").trim(); if (!u) return ""; if (!/^https?:\/\//i.test(u)) u = "https://" + u; try { const x = new URL(u); return x.hostname.includes(".") ? x.toString() : ""; } catch { return ""; } };
const short = (url) => { try { const u = new URL(url); return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname); } catch { return url; } };
// Results are kept in this browser for the day, so re-checking a page costs nothing.
const day = () => new Date().toISOString().slice(0, 10);
const key = (kind, url) => `cro:${day()}:${kind}:${url}`;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or off */ } },
};

function Check({ f }) {
  return (
    <div className={`mx-check ${EDGE[f.sev] || ""}`}>
      <span className={`pill ${SEV[f.sev][0]}`}>{SEV[f.sev][1]}</span>
      <div>
        <b>{f.title}</b> <span className="conf pill info">{f.method} · {f.id}</span>
        {f.detail && <p>{f.detail}</p>}
        {f.fix && <p className="fix"><b>Fix:</b> {f.fix}</p>}
      </div>
    </div>
  );
}

// Hero card: an example until the visitor types, then their own result by area.
function CroHero({ input, state, status, host, onSee }) {
  const live = state !== "idle" || input.trim();
  const [k, setK] = useState(0);
  useEffect(() => {
    if (live) return;
    let i = 0; const t = setInterval(() => { i = (i + 1) % 10; setK(i); }, 700);
    return () => clearInterval(t);
  }, [live]);
  const done = state === "done" && status;
  const rows = done ? status.filter((s) => s.cls !== "unknown" || s.area === "Positioning").slice(0, 6).map((s) => [s.area, TILE[s.cls], s.text, true]) : DEMO.map(([a, c, t], i) => [a, c, t, !live && k > i]);
  const badge = !live ? ["EXAMPLE", "demo"] : done ? ["LIVE RESULT", "live"] : state === "loading" ? ["READING", "live"] : state === "error" ? ["ERROR", "warn"] : ["READY TO CHECK", "live"];
  const line = done ? "See the test ideas below." : !live && k > 6 ? "4 ideas worth testing, 3 fixes that need no test." : "";
  return (
    <div className={`sx-preview${done ? " is-result" : ""}`} aria-live="polite">
      <div className="bar"><span /><span /><span /><span className="url">What would a visitor see on {host || "your page"}?</span><span className={`badge ${badge[1]}`}>{badge[0]}</span></div>
      <div className="body">
        <div className="sweep" style={{ opacity: state === "loading" ? 1 : 0 }} />
        <div className="rows">
          {rows.map(([a, c, t, on], i) => (
            <div key={a} style={{ opacity: on ? 1 : 0.25, transform: `translate3d(${on ? 0 : -8}px,0,0)`, transitionDelay: `${on && live ? i * 90 : 0}ms` }}>
              <span>{a}</span>{on ? <span className={`pill ${c}`}>{t}</span> : <span className="pill demo">…</span>}
            </div>
          ))}
        </div>
        <div className="score" style={{ opacity: line ? 1 : 0.15 }}><span className="label">OUTSIDE-IN READ</span><b className="verdict-text">{line || "—"}</b></div>
        {done && <button type="button" className="see" onClick={onSee}>See the findings ↓</button>}
      </div>
    </div>
  );
}

export default function CroXray() {
  const [input, setInput] = useState("");
  const [extras, setExtras] = useState([]);
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [msg, setMsg] = useState("");
  const [pages, setPages] = useState([]);
  const [ai, setAi] = useState(null);
  const [aiState, setAiState] = useState("idle"); // idle | waiting | running | done | off | error
  const [aiMsg, setAiMsg] = useState("");
  const [tab, setTab] = useState(0);
  const [passed, setPassed] = useState(false);
  const runId = useRef(0);
  const recent = useRecent("cro-xray", ["basecamp.com", "calendly.com/pricing", "intelegencia.com"]);

  // Drop cached results from earlier days.
  useEffect(() => {
    try { Object.keys(localStorage).filter((k) => k.startsWith("cro:") && !k.startsWith(`cro:${day()}:`)).forEach((k) => localStorage.removeItem(k)); } catch { /* storage off */ }
  }, []);

  const run = async (e, value = input, source = "typed") => {
    e?.preventDefault();
    const list = [value, ...(source === "typed" ? extras : [])].map(norm).filter((u, i, a) => u && a.indexOf(u) === i).slice(0, MAX_PAGES);
    if (!list.length) { setState("error"); setMsg("Enter a page address, like example.com/pricing."); return; }
    const id = ++runId.current;
    setInput(value); setState("loading"); setMsg(""); setAi(null); setAiState("idle"); setAiMsg(""); setTab(0); setPassed(false);
    setPages(list.map((u) => ({ input: u, rule: null, mobile: null, desktop: null, shot: null, psi: "running", psiMsg: "" })));
    toolEvent(TOOLS.cro, "start", { input_source: source, page_count: list.length });
    const patch = (i, p) => { if (runId.current === id) setPages((ps) => ps.map((x, k) => (k === i ? { ...x, ...p } : x))); };

    // What the page says: one short server call per page.
    const rules = list.map(async (u, i) => {
      const c = store.get(key("page", u));
      if (c) { patch(i, { rule: c }); return c; }
      const res = await fetch("/api/cro", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: u }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(json.error || "The check failed."), { status: res.status });
      store.set(key("page", u), json); patch(i, { rule: json });
      return json;
    });
    // Speed, mobile and accessibility: PageSpeed, called from this browser. Desktop for the first page only.
    const speeds = list.map(async (u, i) => {
      try {
        const c = store.get(key("speed", u));
        if (c) { patch(i, { ...c, psi: "done" }); return null; }
        const [mobile, desktop] = await Promise.all([runPsi(u, "mobile"), i === 0 ? runPsi(u, "desktop").catch(() => null) : null]);
        const shot = mobile.screenshot;
        const slim = { mobile: { ...mobile, screenshot: null }, desktop: desktop && { ...desktop, screenshot: null } };
        store.set(key("speed", u), slim); patch(i, { ...slim, shot, psi: "done" });
        return shot;
      } catch (err) { patch(i, { psi: "error", psiMsg: err.message }); return null; }
    });

    let data;
    try { data = await Promise.all(rules); }
    catch (err) {
      if (runId.current !== id) return;
      setState("error"); setMsg(err.message || "Couldn't reach the checker. Try again.");
      toolEvent(TOOLS.cro, "error", { error_type: err.status === 429 ? "rate_limited" : err.status ? "request_failed" : "network" });
      return;
    }
    if (runId.current !== id) return;
    setState("done"); recent.add(value);
    toolEvent(TOOLS.cro, "complete", { input_source: source, page_count: list.length, pages_blocked: data.filter((d) => d.blocked).length, pages_js_built: data.filter((d) => d.limited).length });

    // The AI read of the messaging: one call per scan, after the screenshot is in.
    if (!CRO_AI) { setAiState("off"); return; }
    const aiKey = key("ai", list.join("|")), cached = store.get(aiKey);
    if (cached) { setAi(cached); setAiState("done"); return; }
    setAiState("waiting");
    const shot = await speeds[0];
    if (runId.current !== id) return;
    if (data.every((d) => d.blocked) && !shot) { setAiState("idle"); return; }
    setAiState("running");
    const body = { screenshot: shot, pages: data.map((d) => (d.blocked ? { url: d.url } : { url: d.url, title: d.positioning.title, headline: d.positioning.headline, sub: d.positioning.sub, ctas: d.ctas.map((c) => c.text), order: d.order, textSample: d.textSample })) };
    const res = await fetch("/api/cro-ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (runId.current !== id) return;
    if (res?.status === 503) setAiState("off");
    else if (!res?.ok) { setAiState("error"); setAiMsg(json.error || "The AI read didn't complete. The rest of the report is unaffected."); }
    else { setAi(json); setAiState("done"); store.set(aiKey, json); toolEvent(TOOLS.cro, "action", { action: "ai_read_complete" }); }
  };

  const merged = pages.map((p) => ({
    ...p, url: p.rule?.url || p.input,
    findings: [
      ...(p.rule?.findings || []),
      ...(p.mobile ? psiFindings(p.mobile) : []),
      ...(p.desktop ? psiFindings(p.desktop).filter((f) => f.area === "Speed" && f.sev !== "pass").map((f) => ({ ...f, id: `${f.id}d` })) : []),
    ],
  }));
  const done = state === "done" && merged.length > 0;
  const plan = done ? buildPlan(merged) : null;
  const status = done ? areaStatus(merged) : null;
  const waitingSpeed = merged.some((p) => p.psi === "running");
  const cur = merged[Math.min(tab, merged.length - 1)];
  const host = done ? merged[0].rule?.host : "";
  const toResult = () => document.getElementById("cx-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const headline = !plan ? "" : plan.tests.length || plan.fixes.length
    ? [plan.tests.length && `${plan.tests.length} idea${plan.tests.length === 1 ? "" : "s"} worth testing`, plan.fixes.length && `${plan.fixes.length} fix${plan.fixes.length === 1 ? "" : "es"} that need${plan.fixes.length === 1 ? "s" : ""} no test`].filter(Boolean).join(", ") + "."
    : "Nothing flagged from the outside.";

  return (
    <div className="ths">
      <ScrollEffects />
      <SiteChrome home={false} current="tools" />

      <section className="sx-hero" data-section="tool_hero">
        <div data-par="0.08" className="sx-halo par" />
        <div data-par="-0.05" className="sx-ring par" />
        <div className="sx-wrap sx-hero-grid">
          <div className="sx-hero-copy">
            <div data-reveal="0" className="eyebrow"><span className="dot" />TOOL 03 · CONVERSION · FREE</div>
            <h1><span data-reveal="80">What does a visitor</span><span data-reveal="180">see <em>before</em> they decide?</span></h1>
            <p data-reveal="300" className="lede">Paste a page. It reads the headline, calls to action, forms, trust signals, speed and accessibility the way a first-time visitor meets them, then turns what it finds into test ideas. It is an outside-in read, not a full audit.</p>
            <form data-reveal="400" className="sx-form" onSubmit={run}>
              <span className="ico" aria-hidden="true">⌕</span>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="example.com" aria-label="Page address" autoComplete="off" spellCheck="false" />
              <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Reading…" : "Read my page"}</button>
            </form>
            <div data-reveal="440" className="cx-more">
              {extras.map((v, i) => (
                <div key={i} className="row">
                  <input value={v} onChange={(e) => setExtras(extras.map((x, k) => (k === i ? e.target.value : x)))} placeholder={i === 0 ? "example.com/services" : "example.com/contact"} aria-label={`Extra page ${i + 1}`} autoComplete="off" spellCheck="false" />
                  <button type="button" aria-label={`Remove extra page ${i + 1}`} onClick={() => setExtras(extras.filter((_, k) => k !== i))}>×</button>
                </div>
              ))}
              {extras.length < MAX_PAGES - 1 && <button type="button" className="mx-switch" onClick={() => setExtras([...extras, ""])}>+ Add a service, pricing or contact page (up to {MAX_PAGES} pages)</button>}
            </div>
            <div data-reveal="480" className="sx-examples"><span>Try:</span>{recent.examples.map((x) => <button key={x} type="button" onClick={() => run(null, x, recent.recent.includes(x) ? "recent" : "example")} disabled={state === "loading"}>{x}</button>)}</div>
            <div data-reveal="560" className="sx-trust"><span>Every finding names its evidence</span><span>Test ideas, not instructions</span><span>Forms are read, never submitted</span></div>
          </div>
          <div data-reveal="200" className="sx-hero-art"><CroHero input={input} state={state} status={status} host={host} onSee={toResult} /></div>
        </div>
      </section>

      {state === "error" && <section className="sx-wrap mx-section"><div className="ths-note" role="alert"><p>{msg}</p></div></section>}
      {state === "loading" && <section className="sx-wrap mx-section"><div className="ths-note" aria-live="polite"><p>Reading {pages.length === 1 ? "the page" : `${pages.length} pages`}… {pages.filter((p) => p.rule).length} of {pages.length} read.</p></div></section>}

      {done && plan && (
        <section id="cx-result" className="sx-wrap mx-section mx-result">
          {/* 1. Summary */}
          <div className="sx-band mx-verdict" data-section="report_verdict">
            <span className="label">OUTSIDE-IN READ · {merged.map((p) => short(p.url)).join(" · ")}</span>
            <h2>{headline}</h2>
            <p className="cost">Based only on what is visible on {merged.length === 1 ? "this page" : `these ${merged.length} pages`}. These are hypotheses to test, not instructions: this read can&apos;t see your analytics.</p>
            <div className="mx-stages">
              {status.map((s, i) => <div key={s.area} className={`st ${s.cls}`} style={{ animationDelay: `${i * 60}ms` }}><b>{s.area}</b><span className="v">{(s.area === "Speed" || s.area === "Mobile" || s.area === "Accessibility") && waitingSpeed && s.cls === "unknown" ? "Testing…" : s.text}</span></div>)}
            </div>
            {waitingSpeed && <p className="mx-note" aria-live="polite">PageSpeed is still testing speed, mobile and accessibility. That takes 10 to 30 seconds per page; the results appear here as they arrive.</p>}
            {merged.filter((p) => p.rule?.blocked).map((p) => <p key={p.url} className="mx-note"><b>Content checks blocked on {short(p.url)}.</b> {p.rule.reason} Headline, calls to action and form checks couldn&apos;t run there; speed and accessibility still can.</p>)}
            {merged.filter((p) => p.rule?.limited).map((p) => <p key={p.url} className="mx-note"><b>{short(p.url)} builds its content with JavaScript,</b> so only {p.rule.textChars} characters of text were readable. Content checks are limited there and nothing is reported as missing.</p>)}
            {merged.filter((p) => p.psi === "error").map((p) => <p key={p.url} className="mx-note"><b>No speed results for {short(p.url)}.</b> {p.psiMsg}</p>)}
          </div>

          {/* 2. Positioning: quoted, for review */}
          <div className="sx-band" data-section="report_positioning">
            <div className="ths-h2row"><h2>What the first screen says</h2><span className="pill info">For your review</span></div>
            <p className="ths-sub">The headline and subhead exactly as written, with plain signals. A rule can&apos;t judge whether they say who it&apos;s for and why choose you, so no verdict is given here.</p>
            <div className="cx-pos">
              {merged.filter((p) => p.rule && !p.rule.blocked).map((p) => {
                const o = p.rule.positioning;
                return (
                  <div key={p.url} className="cx-quote">
                    <span className="label">{short(p.url).toUpperCase()}</span>
                    <b>{o.headline ? `“${o.headline}”` : "No headline found in the page HTML"}</b>
                    {o.sub && <p>“{o.sub}”</p>}
                    {o.headline && <div className="sig"><span>{o.words} words</span><span>“you” ×{o.you} · “we” ×{o.we}</span><span>{o.hasNumber ? "Includes a number" : "No number or specific outcome"}</span><span>{o.jargon.length ? `Jargon: ${o.jargon.join(", ")}` : "No stock jargon"}</span></div>}
                  </div>
                );
              })}
              {merged[0].shot && <figure className="cx-shot"><img src={merged[0].shot} alt={`Phone screenshot of ${short(merged[0].url)} from PageSpeed`} /><figcaption>First screen on a phone, from PageSpeed</figcaption></figure>}
            </div>
          </div>

          {/* 3. AI read */}
          {aiState !== "off" && aiState !== "idle" && (
            <div className="sx-band tint" data-section="report_ai_read">
              <div className="ths-h2row"><h2>Five-second test</h2><span className="pill warn">AI opinion</span></div>
              {aiState === "waiting" && <p className="ths-sub" aria-live="polite">Waiting for the phone screenshot from PageSpeed, then the AI reads the first screen.</p>}
              {aiState === "running" && <p className="ths-sub" aria-live="polite">Reading the first screen…</p>}
              {aiState === "error" && <p className="ths-sub">{aiMsg}</p>}
              {aiState === "done" && ai && (
                <>
                  <p className="ths-sub">{ai.summary}</p>
                  <div className="mx-read">
                    {[["What is it?", ai.what], ["Who is it for?", ai.who], ["Why choose it?", ai.why]].map(([q, a]) => (
                      <div key={q} className={/^not stated/i.test(a?.answer || "") ? "miss" : ""}><span className="label">{q.toUpperCase()}</span><b>{a?.answer}</b>{a?.quote && <span className="muted">Read from: “{a.quote}”</span>}</div>
                    ))}
                    {ai.firstScreen && <div className={ai.firstScreen.ctaVisible === "no" ? "miss" : ""}><span className="label">ON THE FIRST PHONE SCREEN</span><b>{ai.firstScreen.ctaVisible === "yes" ? `Call to action visible: “${ai.firstScreen.ctaText}”` : ai.firstScreen.ctaVisible === "no" ? "No call to action visible" : "Call to action unclear"}</b><span className="muted">First noticed: {ai.firstScreen.firstNoticed}. Proof: {ai.firstScreen.proofVisible}.</span></div>}
                  </div>
                  {ai.unanswered?.length > 0 && <><span className="label cx-gap">QUESTIONS A BUYER MAY STILL HAVE</span><ul className="cx-list">{ai.unanswered.map((q) => <li key={q}>{q}</li>)}</ul></>}
                  {ai.messageMatch && <p className="ths-sub"><b>Across the pages:</b> {ai.messageMatch}</p>}
                  {ai.headlines?.length > 0 && <><span className="label cx-gap">HEADLINES TO TEST AGAINST THE CURRENT ONE</span><ul className="cx-list">{ai.headlines.map((h) => <li key={h}>“{h}”</li>)}</ul></>}
                  <p className="ths-small">An AI model&apos;s opinion ({ai.model}), from the page text{ai.firstScreen ? " and the phone screenshot" : ""}. It can be wrong and may differ between runs; quotes that weren&apos;t on the page are removed.</p>
                </>
              )}
            </div>
          )}

          {/* 4. Test ideas and plain fixes */}
          <div className="sx-band" data-section="report_test_ideas">
            <div className="ths-h2row"><h2>Ideas worth testing</h2></div>
            <p className="ths-sub">Changes where the outcome is uncertain. Each one comes from a finding below.</p>
            {plan.tests.length ? (
              <ol className="cx-plan">
                {plan.tests.map((t) => <li key={t.id}><p>{t.text}</p><span className="muted"><b>Guardrail:</b> {t.guardrail} · from {t.id} · {SEV[t.sev][1].toLowerCase()} priority</span></li>)}
              </ol>
            ) : <p className="ths-sub"><b>None from the rule checks.</b> That means nothing obvious was found from outside, not that the page can&apos;t be improved.</p>}
            {plan.fixes.length > 0 && (
              <>
                <div className="ths-h2row cx-gap"><h2>Fix without testing</h2></div>
                <p className="ths-sub">Plain defects. No experiment needed.</p>
                <div className="mx-checks">{plan.fixes.map((f) => <Check key={f.id} f={{ ...f, method: f.pages.join(", "), detail: null }} />)}</div>
              </>
            )}
          </div>

          {/* 5. Every finding, by page and area */}
          <div className="sx-band tint" data-section="report_findings">
            <div className="ths-h2row"><h2>Every finding</h2><button type="button" className="g-more mx-toggle" aria-expanded={passed} onClick={() => setPassed(!passed)}>{passed ? "Hide what passed ↑" : "Show what passed ↓"}</button></div>
            <p className="ths-sub"><b>Rule</b> = read straight from the page. <b>Heuristic</b> = a pattern match that can miss custom designs. <b>PageSpeed</b> = Google&apos;s test in a real browser.</p>
            {merged.length > 1 && <div className="mx-tabs" role="tablist">{merged.map((p, i) => <button key={p.url} role="tab" aria-selected={i === tab} className={i === tab ? "on" : ""} onClick={() => setTab(i)}>{short(p.url)}</button>)}</div>}
            {AREAS.map((area) => {
              const fs = cur.findings.filter((f) => f.area === area && (passed || (f.sev !== "pass" && f.sev !== "info")));
              if (!fs.length) return null;
              return <div key={area} className="mx-botgroup"><div className="g-head"><span className="label">{area.toUpperCase()}</span></div><div className="mx-checks cx-tight">{fs.map((f, i) => <Check key={f.id + i} f={f} />)}</div></div>;
            })}
            {!cur.findings.some((f) => passed || (f.sev !== "pass" && f.sev !== "info")) && <p className="ths-sub">Nothing flagged on this page{cur.psi === "running" ? " so far" : ""}.</p>}
            {cur.rule && !cur.rule.blocked && (
              <p className="ths-small">Sections found on {short(cur.url)}: {cur.rule.sections.map((s) => `${s.label} ${s.found ? "✓" : "–"}`).join(" · ")}. Matched from heading wording, so a section with an unusual title shows as not found.{cur.rule.order.length > 0 && ` Heading order: ${cur.rule.order.join(" → ")}.`}</p>
            )}
          </div>

          {/* 6. What this can't see */}
          <div className="sx-band">
            <div className="mx-myth"><span className="label">WHAT THIS READ CANNOT SEE</span><p>{CANT_SEE.join(" · ")}. Those need your own data, and they decide which of these ideas matter most.</p></div>
          </div>

          <section className="sx-next" data-cta-zone="1">
            <div data-par="0.06" className="ring" />
            <div><span className="label">NEXT STEP</span><h2>Want the data-backed version?</h2><p>A full CRO audit adds your analytics, heatmaps and recordings: where people really drop off, which of these ideas to test first, and whether your traffic can support the test.</p></div>
            <div className="actions"><a href={contactHref} className="ths-btn" data-track="cta_click" data-loc="cro_xray">{CTA}</a><span>or email <a href={`mailto:${EMAIL}`} data-track="cta_click" data-intent="email" data-loc="cro_xray">{EMAIL}</a></span></div>
          </section>
        </section>
      )}

      <footer className="sx-foot"><div className="sx-wrap"><span>© 2026 Megha Karnwal · CRO X-Ray</span><span>Reads public pages only. Speed and accessibility come from Google PageSpeed Insights.{CRO_AI ? " The five-second test uses Google Gemini." : ""}</span><a href="/">meghakarnwal.com ↗</a></div></footer>
    </div>
  );
}
