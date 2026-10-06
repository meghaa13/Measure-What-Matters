"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import SiteChrome from "../../SiteChrome";
import ScrollEffects from "../../ScrollEffects";
import CroHero from "./CroHero";
import { rank, speedInsights, verdict as makeVerdict } from "./engine/insights";
import { audit, summarise } from "./engine/audit";
import { runPsi } from "./engine/psi";
import { toolEvent, TOOLS } from "../../lib/analytics";
import { useRecent } from "../../lib/recent";
import { CTA, EMAIL, contactHref } from "../../lib/site";

// Short names for the hero card.
const SHORT = {
  no_cta: "No clear next step on the page", blind_conversion: "No tracking found on the main form", broken_promise: "The promise and the next step differ",
  cta_dead_ends: "Buttons that lead nowhere useful", friction_vs_offer: "Form asks questions it may not need", blind_calls: "Phone taps aren't being counted", use_your_data: "Form steps recorded but unused",
  waiting: "Phones wait for the main content", tag_tax: "Outside scripts keep phones busy", jumping: "The page moves while loading",
};
// Which part of the audit each detailed finding belongs to.
const AREA_OF = { no_cta: "cta", cta_dead_ends: "cta", broken_promise: "next", friction_vs_offer: "form", use_your_data: "form", blind_conversion: "measure", blind_calls: "measure", waiting: "speed", tag_tax: "speed", jumping: "speed" };
const MARK = { ok: ["✓", "In place"], fix: ["!", "Fix"], test: ["?", "Test"], info: ["·", "Note"] };
const TONE = { Confirmed: "bad", "Confirmed (lab)": "bad", Likely: "warn", Estimate: "info", "AI read": "info" };
const CONF_NOTE = { Confirmed: "The fact is confirmed", "Confirmed (lab)": "Measured on a simulated slow phone", Likely: "Inferred from what is visible", Estimate: "Approximate", "AI read": "An AI's reading" };
const SPEED_FAIL = {
  quota: "Google's free speed test has reached its daily limit, so speed results aren't available right now. The content findings above are complete.",
  unreachable: "Google's speed test couldn't load this page, so there are no speed results. The content findings above are complete.",
  timeout: "The speed test took too long and was stopped. The content findings above are complete.",
  network: "The speed test couldn't be reached from your browser. The content findings above are complete.",
  refused: "Google's speed test refused this request. The content findings above are complete.", unreadable: "The speed test answered in a form this tool couldn't read.",
};

function Evidence({ e, onExpand }) {
  if (e.kind === "quote") return <div className="cx-ev"><span className="label">{e.label}</span><blockquote>{e.text}</blockquote></div>;
  if (e.kind === "note") return <p className="cx-ev-note">{e.text}</p>;
  if (e.kind === "path") return <div className="cx-ev cx-path"><span className="chip">{e.from}</span><span aria-hidden="true">→</span><span className="chip to">{e.to}</span></div>;
  if (e.kind === "list") return <div className="cx-ev"><span className="label">{e.label}</span>{e.items?.length ? <div className="cx-chips">{e.items.map((x, i) => <code key={i}>{x}</code>)}</div> : <span className="muted">{e.empty}</span>}</div>;
  if (e.kind === "fields") return <div className="cx-ev cx-fields"><span className="label">{e.label}</span><div className="cx-table">{e.rows.map(([a, b, why], i) => <div key={i} className={why ? "flag" : ""}><span><b>{a}</b>{why && <em>{why}</em>}</span><span className={`pill ${b === "Required" ? (why ? "warn" : "info") : "demo"}`}>{b}</span></div>)}</div></div>;
  if (e.kind === "table") return <div className="cx-ev"><span className="label">{e.label}</span><div className="cx-table">{e.rows.map(([a, b, t], i) => <div key={i}><span>{a}</span><span className={`pill ${t}`}>{b}</span></div>)}</div></div>;
  if (e.kind === "metrics") return <div className="cx-ev cx-metrics">{e.items.map(([a, b, t], i) => <div key={i} className={t}><span>{a}</span><b>{b}</b></div>)}</div>;
  if (e.kind === "bars") { const max = Math.max(...e.rows.map((r) => r[1]), 1); return <div className="cx-ev"><span className="label">{e.label}</span><div className="cx-bars">{e.rows.map(([n, v], i) => <div key={i} className={n === "Your own code" ? "own" : ""}><span>{n}</span><i><b style={{ width: `${Math.max(3, (v / max) * 100)}%` }} /></i><em>{v} {e.unit}</em></div>)}</div></div>; }
  if (e.kind === "image") return e.src ? <div className="cx-ev"><span className="label">{e.label}</span><button type="button" className="cx-shot" onClick={() => onExpand?.(e.src)} aria-label="Enlarge the screenshot"><img src={e.src} alt="The first screen of the page on a phone" /></button></div> : null;
  if (e.kind === "filmstrip") return <Filmstrip label={e.label} frames={e.frames} markMs={e.markMs} />;
  return null;
}

function Filmstrip({ label, frames, markMs }) {
  // The frame where the main content has arrived: the first one at or after the LCP moment.
  const found = markMs ? frames.findIndex((f) => f.ms >= markMs) : -1;
  const at = found === -1 && markMs && frames.length ? frames.length - 1 : found; // content arrived after the last frame
  return (
    <div className="cx-ev">
      <span className="label">{label}</span>
      <div className="cx-film">
        {frames.map((f, i) => <figure key={i} className={i === at ? "mark" : ""}><img src={f.src} alt="" loading="lazy" /><figcaption>{(f.ms / 1000).toFixed(1)} s{i === at ? (found === -1 ? ` · main content came later, at ${(markMs / 1000).toFixed(1)} s` : " · main content") : ""}</figcaption></figure>)}
      </div>
    </div>
  );
}

function Card({ i, rankNo, onExpand }) {
  const ref = useRef(null);
  // Tell analytics when a finding has actually been looked at.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { toolEvent(TOOLS.cro, "action", { action: "insight_view", insight: i.key, insight_rank: rankNo }); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [i.key, rankNo]);
  return (
    <article ref={ref} id={`cx-f-${i.key}`} className="cx-card">
      <div className="cx-card-top"><span className="cx-no">IN DETAIL</span><span className={`pill ${TONE[i.confidence] || "info"}`} title={CONF_NOTE[i.confidence]}>{i.confidence}</span><span className="cx-conf">{CONF_NOTE[i.confidence]}</span></div>
      <h3>{i.title}</h3>
      <div className="cx-evs">{i.evidence.map((e, k) => <Evidence key={k} e={e} onExpand={onExpand} />)}</div>
      <p className="cx-why"><span className="label">WHY IT MATTERS</span>{i.why}</p>
      <div className={`cx-action ${i.action.type.toLowerCase()}`}>
        <span className="tag">{i.action.type === "Fix" ? "FIX" : "TEST"}</span>
        <div>
          <b>{i.action.text}</b>
          {i.action.hypothesis && <span>Hypothesis: {i.action.hypothesis}</span>}
          {i.action.guardrail && <span>Watch: {i.action.guardrail}</span>}
          {i.action.type === "Fix" && <span>A plain defect. No test needed.</span>}
        </div>
      </div>
      {i.tool && <a className="cx-tool" href={i.tool.href} data-track="cta_click" data-intent="open_tool" data-loc="cro_xray_finding" data-app={i.tool.href.split("/").pop()}><b>Check this with {i.tool.name} →</b><span>It {i.tool.why}.</span></a>}
    </article>
  );
}

export default function CroXray() {
  const [input, setInput] = useState("");
  const [second, setSecond] = useState("");
  const [more, setMore] = useState(false);
  const [checked, setChecked] = useState("");
  const [state, setState] = useState("idle");
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [speed, setSpeed] = useState({ state: "idle", data: null, reason: null });
  const [desk, setDesk] = useState(null);
  const [zoom, setZoom] = useState(null);
  const run = useRef(0);
  const recent = useRecent("cro-xray", ["hotjar.com", "calendly.com/pricing", "notion.com/product"]);

  const check = async (e, value = input, source = "typed") => {
    e?.preventDefault(); if (!value.trim()) return;
    const id = ++run.current;
    setInput(value); setChecked(value.trim()); setState("loading"); setData(null); setMsg(""); setDesk(null); setSpeed({ state: "idle", data: null, reason: null });
    toolEvent(TOOLS.cro, "start", { input_source: source, second_page: !!second.trim() });
    try {
      const res = await fetch("/api/cro-xray", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: value, second: second.trim() || undefined }) });
      const json = await res.json();
      if (id !== run.current) return;
      if (!res.ok) { setState("error"); setMsg(json.error || "The check failed."); toolEvent(TOOLS.cro, "error", { error_type: res.status === 429 ? "rate_limited" : "request_failed" }); return; }
      setData(json); setState("done"); recent.add(value);
      toolEvent(TOOLS.cro, "complete", { input_source: source, stage: "content", insights: json.insights.length, top_insight: rank(json.insights)[0]?.key || "none", cta_found: !!json.cta, form_found: !!json.form, page_blocked: !!json.blocked });
      // Speed side: Google loads the page on a test phone. This takes 10 to 30 seconds.
      setSpeed({ state: "loading", data: null, reason: null });
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 75_000);
      // Phone and desktop are two separate runs; the desktop one is a bonus and may fail quietly.
      runPsi(json.url, { signal: ctrl.signal, strategy: "desktop" }).then((k) => { if (id === run.current && k.ok) setDesk(k.data); }).catch(() => {});
      const r = await runPsi(json.url, { signal: ctrl.signal }); clearTimeout(timer);
      if (id !== run.current) return;
      if (r.ok) { setSpeed({ state: "done", data: r.data, reason: null }); toolEvent(TOOLS.cro, "complete", { stage: "speed", insights: speedInsights(json, r.data).length, has_field_data: !!r.data.field, speed_cached: !!r.cached }); }
      else { setSpeed({ state: "unavailable", data: null, reason: r.reason }); toolEvent(TOOLS.cro, "error", { error_type: `speed_${r.reason}` }); }
    } catch { if (id === run.current) { setState("error"); setMsg("Couldn't reach the checker. Try again."); toolEvent(TOOLS.cro, "error", { error_type: "network" }); } }
  };

  const all = useMemo(() => (data ? rank([...(data.insights || []), ...speedInsights(data, speed.data)]).map((i) => ({ ...i, short: SHORT[i.key] || i.title })) : []), [data, speed.data]);
  const top = all.slice(0, 3);
  const line0 = data ? makeVerdict(top, data, speed.state) : "";
  const toResult = () => document.getElementById("cx-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const expand = (src) => { setZoom(src); toolEvent(TOOLS.cro, "action", { action: "screenshot_expand" }); };
  const s = speed.data;
  const sum = useMemo(() => (data && !data.blocked ? summarise(audit(data, s, desk), all.map((i) => ({ ...i, area: AREA_OF[i.key] || "cta" })), data) : null), [data, s, desk, all]);
  const leads = !data?.cta ? null : data.destSame ? "a form on this page" : data.destUrl ? data.destUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") : null;
  const lcpShown = s ? s.field?.lcpMs || s.lcpMs : null;
  const line = sum ? `${sum.pass} of ${sum.total} conversion basics are in place. ${sum.fixes.length ? `${sum.fixes.length} to fix` : "Nothing broken"}${sum.tests.length ? `, ${sum.tests.length} worth testing` : ""}.` : line0;
  const lcpDesk = desk ? desk.field?.lcpMs || desk.lcpMs : null;
  // Links from the summary and the roadmap open the section they point to.
  const openArea = (key) => { const el = document.getElementById(`cx-a-${key}`); if (el) el.open = true; };
  const jump = (it) => { openArea(it.area); toolEvent(TOOLS.cro, "action", { action: "plan_jump", area: it.area, action_type: it.type }); };

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
            <h1><span data-reveal="80">What your page</span><span data-reveal="180"><em>quietly</em> costs you.</span></h1>
            <p data-reveal="300" className="lede">Up to three conversion problems you can&apos;t see from your own desk: a promise the next step doesn&apos;t keep, a form nobody is measuring, a phone that waits too long for the button. Each one comes with the evidence.</p>
            <form data-reveal="400" className="sx-form" onSubmit={check}>
              <span className="ico" aria-hidden="true">⌕</span>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="example.com/landing-page" aria-label="Page address" autoComplete="off" spellCheck="false" />
              <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Reading…" : "X-ray this page"}</button>
            </form>
            {more
              ? <div className="cx-second"><label htmlFor="cx-second">Also check this page as the next step (optional)</label><input id="cx-second" value={second} onChange={(e) => setSecond(e.target.value)} placeholder="example.com/contact" autoComplete="off" spellCheck="false" /></div>
              : <button type="button" className="mx-linkbtn cx-more" onClick={() => { setMore(true); toolEvent(TOOLS.cro, "action", { action: "add_second_page" }); }}>The tool follows your main button by itself. Want to point it at a pricing or contact page instead?</button>}
            <div data-reveal="480" className="sx-examples"><span>Try:</span>{recent.examples.map((x) => <button key={x} type="button" onClick={() => check(null, x, recent.recent.includes(x) ? "recent" : "example")} disabled={state === "loading"}>{x}</button>)}</div>
            <div data-reveal="560" className="sx-trust"><span>Reads public pages only</span><span>Never submits a form</span><span>At most 3 findings, never padded</span></div>
          </div>
          <div data-reveal="200" className="sx-hero-art"><CroHero input={input} checked={checked} state={state} top={top} verdict={line} host={data?.host} speed={speed.state} onSee={toResult} /></div>
        </div>
      </section>

      {state === "error" && <section className="sx-wrap mx-section"><div className="ths-note" role="alert"><p>{msg}</p></div></section>}

      {state === "done" && data && (
        <section id="cx-result" className="sx-wrap mx-section mx-result">
          {/* 1. Summary: score, the facts, and the roadmap */}
          <div className="sx-band cx-sum" data-section="report_verdict">
            <div className="cx-sum-main">
              <span className="label">CONVERSION AUDIT · {data.host}</span>
              <h2>{line}</h2>
              {data.note && <p className="cost">{data.note}</p>}
              {speed.state === "loading" && <p className="cx-progress"><span className="spin" aria-hidden="true" />Google is loading your page on a test phone and a desktop. This takes 10 to 30 seconds; the speed section fills in when it finishes.</p>}
              {speed.state === "unavailable" && <p className="cx-progress off">{SPEED_FAIL[speed.reason] || SPEED_FAIL.refused}</p>}
              {!data.blocked && (
                <div className="cx-tiles">
                  <div><span>Main button</span><b>{data.cta ? data.cta.label : "Not found"}</b>{leads && <em>Leads to {leads}</em>}</div>
                  <div><span>Form</span><b>{data.form?.fields ? `${data.form.fields} fields` : data.form ? "Found" : "None found"}</b>{data.form?.fields > 0 && <em>{data.form.required || 0} required</em>}</div>
                  {lcpShown && <div><span>Main content, phone</span><b>{(lcpShown / 1000).toFixed(1)} s</b><em>{s.field?.lcpMs ? "Real visitors" : "Simulated slow phone"}. Target 2.5 s</em></div>}
                  {lcpDesk && <div><span>Main content, desktop</span><b>{(lcpDesk / 1000).toFixed(1)} s</b><em>{desk.field?.lcpMs ? "Real visitors" : "Google's desktop test"}. Target 2.5 s</em></div>}
                </div>
              )}
            </div>
            {(s?.screenshot || desk?.screenshot) && (
              <div className="cx-shots">
                {s?.screenshot && <figure><button type="button" className="cx-shot" onClick={() => expand(s.screenshot)} aria-label="Enlarge the phone screenshot"><img src={s.screenshot} alt="The first screen of the page on a phone" /></button><figcaption>Phone</figcaption></figure>}
                {desk?.screenshot && <figure><button type="button" className="cx-shot wide" onClick={() => expand(desk.screenshot)} aria-label="Enlarge the desktop screenshot"><img src={desk.screenshot} alt="The first screen of the page on a desktop" /></button><figcaption>Desktop</figcaption></figure>}
              </div>
            )}
          </div>

          {/* 2. The audit, area by area */}
          {sum ? (
            <div className="sx-band cx-audit" data-section="report_audit">
              <div className="ths-h2row"><h2>What we found</h2></div>
              <p className="ths-sub">The areas a conversion review covers. Open any one for the evidence and what to do about it.</p>
              {sum.areas.map((a) => (
            <details key={a.key} id={`cx-a-${a.key}`} className="cx-area" data-section={`report_${a.key}`} onToggle={(e) => { if (e.currentTarget.open) toolEvent(TOOLS.cro, "action", { action: "open_area", area: a.key }); }}>
              <summary className="cx-area-head">
                <div className="cx-area-title"><h3>{a.name}</h3><p>{a.cards[0]?.title || a.rows.find((r) => r.status === "fix" || r.status === "test")?.saw || "Nothing to change here."}</p></div>
                <span className="cx-area-count">{(() => {
                  const f = a.rows.filter((r) => r.status === "fix").length + a.cards.filter((c) => c.action.type === "Fix").length;
                  const t = a.rows.filter((r) => r.status === "test").length + a.cards.filter((c) => c.action.type !== "Fix").length;
                  return f || t ? <>{f > 0 && <span className="pill bad">{f} to fix</span>}{t > 0 && <span className="pill warn">{t} to test</span>}</> : a.total > 0 ? <span className="pill ok">All in place</span> : <span className="pill demo">Notes only</span>;
                })()}{a.total > 0 && <em>{a.pass} of {a.total} in place</em>}</span>
              </summary>
              <p className="ths-sub">{a.asks}</p>
              <div className="cx-rows">
                {a.rows.map((r, n) => (
                  <div key={n} className={`cx-row ${r.status}`}>
                    <span className="st" title={MARK[r.status][1]} aria-label={MARK[r.status][1]}>{MARK[r.status][0]}</span>
                    <div>
                      <b>{r.label}</b><span>{r.saw}</span>
                      {r.action && <p className="do"><span className={`tag ${r.status}`}>{r.status === "fix" ? "FIX" : "TEST"}</span><span>{r.action}{r.hypothesis && <em>Why it should work: {r.hypothesis}</em>}</span></p>}
                    </div>
                  </div>
                ))}
                {a.key === "speed" && speed.state === "loading" && <div className="cx-row info"><span className="st">·</span><div><b>Speed test</b><span>Still running.</span></div></div>}
              </div>
              {a.cards.map((i, n) => <Card key={i.key} i={i} rankNo={n + 1} onExpand={expand} />)}
            </details>
              ))}
            </div>
          ) : (
            <div className="cx-cards" data-section="report_insights">{top.map((i, n) => <Card key={i.key} i={i} rankNo={n + 1} onExpand={expand} />)}</div>
          )}

          {/* 3. Roadmap */}
          {sum && (sum.fixes.length > 0 || sum.tests.length > 0) && (
            <div className="sx-band cx-road" data-section="report_roadmap">
              <div className="ths-h2row"><h2>Your roadmap</h2></div>
              <p className="ths-sub">Quick fixes are defects: repair them, no test needed. Hypotheses are judgement calls: each names the kind of test, the effort, and the goal it should move. Strongest first.</p>
              <div className="cx-road-cols">
                {[["fix", "Quick fixes", sum.fixes], ["test", "Hypotheses to test", sum.tests]].filter(([, , list]) => list.length).map(([type, head, list]) => (
                  <div key={type}>
                    <span className="label">{head} · {list.length}</span>
                    <ol>{list.slice(0, 5).map((it, n) => <li key={n}><a href={`#cx-a-${it.area}`} onClick={() => jump(it)}><span><b>{it.text}</b>{it.because && <em>Because: {it.because}</em>}<span className="cx-meta">{it.type === "test" ? <><i>{it.bucket}</i><i>{it.kind}</i><i>{it.effort} effort</i><i>{it.goal}</i></> : <i>{it.areaName}</i>}</span></span></a></li>)}</ol>
                    {list.length > 5 && <details className="cx-more-road" onToggle={(e) => { if (e.currentTarget.open) toolEvent(TOOLS.cro, "action", { action: "roadmap_show_all", action_type: type }); }}><summary>Show the other {list.length - 5}</summary><ol start={6} style={{ counterReset: "road 5" }}>{list.slice(5).map((it, n) => <li key={n}><a href={`#cx-a-${it.area}`} onClick={() => jump(it)}><span><b>{it.text}</b>{it.because && <em>Because: {it.because}</em>}<span className="cx-meta">{it.type === "test" ? <><i>{it.bucket}</i><i>{it.kind}</i><i>{it.effort} effort</i><i>{it.goal}</i></> : <i>{it.areaName}</i>}</span></span></a></li>)}</ol></details>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Go deeper with the other tools */}
          {!data.blocked && (
            <div className="sx-band cx-deeper" data-section="report_other_tools">
              <div className="ths-h2row"><h2>Check the rest of {data.host}</h2></div>
              <p className="ths-sub">This report looks at one page and the step after it. Two other free tools look at what sits underneath.</p>
              <div className="cx-toolgrid">
                <a href="/apps/tag-scanner" data-track="cta_click" data-intent="open_tool" data-loc="cro_xray_report" data-app="tag_health_scan"><span className="label">TOOL 01</span><b>Tag Health Scan</b><span>Every tag, event and conversion this site sends, and what is missing or risky.{data.tracking?.signals?.length ? ` It found ${data.tracking.signals.length} form event${data.tracking.signals.length === 1 ? "" : "s"} here.` : ""}</span><em>Scan {data.host} →</em></a>
                <a href="/apps/lead-path" data-track="cta_click" data-intent="open_tool" data-loc="cro_xray_report" data-app="lead_path_xray"><span className="label">TOOL 02</span><b>Lead Path X-Ray</b><span>Follows a visit from an ad or email into {data.form ? "this form" : "your forms"}, and shows whether its source survives to your CRM.</span><em>Follow a visit →</em></a>
              </div>
            </div>
          )}

          {/* 6. What this can't see */}
          <section className="sx-next" data-cta-zone="1" data-section="report_next_step">
            <div data-par="0.06" className="ring" />
            <div><span className="label">WHAT THIS CAN&apos;T SEE</span><h2>Want the version backed by your own data?</h2><p>This report covers the heuristic and UX part of a conversion programme. The rest needs your own data: where the visit-to-conversion funnel leaks, what heatmaps and session recordings show, what customers say, how competitors compare, and how much traffic and time each test needs to reach a result.</p></div>
            <div className="actions"><a href={contactHref} className="ths-btn" data-track="cta_click" data-loc="cro_xray">{CTA}</a><span>or email <a href={`mailto:${EMAIL}`} data-track="cta_click" data-intent="email" data-loc="cro_xray">{EMAIL}</a></span></div>
          </section>
        </section>
      )}

      {zoom && <div className="cx-zoom" role="dialog" aria-modal="true" aria-label="Screenshot" onClick={() => setZoom(null)}><img src={zoom} alt="The first screen of the page on a phone, enlarged" /><button type="button" onClick={() => setZoom(null)}>Close</button></div>}

      <footer className="sx-foot"><div className="sx-wrap"><span>© 2026 Megha Karnwal · CRO X-Ray</span><span>Reads public pages only. Speed results come from Google PageSpeed Insights. Not a substitute for your own data.</span><a href="/">meghakarnwal.com ↗</a></div></footer>
    </div>
  );
}
