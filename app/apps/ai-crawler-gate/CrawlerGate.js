"use client";
import { useState } from "react";
import ScrollEffects from "../../ScrollEffects";
import SiteChrome from "../../SiteChrome";
import { toolEvent, formSubmit, TOOLS } from "../../lib/analytics";
import { CTA, EMAIL, contactHref } from "../../lib/site";
import GateHero from "./GateHero";
import { verdicts } from "./verdict";
import { useRecent } from "../../lib/recent";

const PILL = { pass: ["ok", "Pass"], fail: ["bad", "Fail"], warn: ["warn", "Check"], info: ["info", "Info"] };
const CONF = { Confirmed: "bad", Likely: "warn", Verify: "info", Info: "info" };
const ST = { visible: ["ok", "Can find you"], blocked: ["bad", "Blocked"], no_quote: ["warn", "Can't quote you"], verify: ["info", "Check Cloudflare"] };
const ORDER = ["search", "user", "training"];
const postForm = (name, fields) => fetch("/__forms.html", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ "form-name": name, ...fields }).toString() }).catch(() => {});
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

function Check({ c }) {
  return (
    <div className={`mx-check ${c.status}`}>
      <span className={`pill ${PILL[c.status][0]}`}>{PILL[c.status][1]}</span>
      <div>
        <b>{c.title}</b> <span className={`conf pill ${CONF[c.conf]}`}>{c.conf} · {c.id}</span>
        {c.detail && <p>{c.detail}</p>}
        {c.fix && <p className="fix"><b>Fix:</b> {c.fix}</p>}
      </div>
    </div>
  );
}

// "How often does AI cite you?": buyer questions asked to Claude with live web search.
// One question runs free with no email; an email unlocks all five. Both are free.
function Citations({ site }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | running | partial | done | error | off
  const [qs, setQs] = useState([]);
  const [brand, setBrand] = useState("");
  const [answers, setAnswers] = useState({});
  const [msg, setMsg] = useState("");

  const ask = async (q, b) => {
    const r = await fetch("/api/ai-citations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ step: "ask", url: site, question: q, brand: b }) }).then((x) => x.json()).catch(() => ({ error: true }));
    setAnswers((a) => ({ ...a, [q]: r }));
  };
  const getQuestions = async () => {
    if (qs.length) return { questions: qs, brand };
    const res = await fetch("/api/ai-citations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ step: "questions", url: site }) });
    const json = await res.json().catch(() => ({}));
    if (res.status === 503) { setState("off"); return null; }
    if (!res.ok) { setState("error"); setMsg(json.error || "Couldn't start the check."); return null; }
    setQs(json.questions); setBrand(json.brand);
    return json;
  };
  const tryOne = async () => {
    setState("running"); setMsg("");
    const j = await getQuestions(); if (!j) return;
    await ask(j.questions[0], j.brand);
    setState("partial"); toolEvent(TOOLS.ai, "action", { action: "citation_free_question" });
  };
  const runAll = async (e) => {
    e.preventDefault();
    if (!validEmail(email)) { formSubmit("ai_citations", "report_citations", { status: "failed", failure_reason: "invalid_email" }); return; }
    postForm("ai-citations", { email: email.trim(), site });
    formSubmit("ai_citations", "report_citations", { email });
    setState("running");
    const j = await getQuestions(); if (!j) return;
    await Promise.all(j.questions.filter((q) => !answers[q]).map((q) => ask(q, j.brand)));
    setState("done"); toolEvent(TOOLS.ai, "action", { action: "citation_sample_complete" });
  };

  const asked = qs.filter((q) => answers[q]);
  const got = asked.map((q) => answers[q]).filter((a) => !a.error && !a.refused);
  const n = asked.length || 1;
  const cited = got.filter((a) => a.cited).length, mentioned = got.filter((a) => a.mentioned).length;
  const rivals = Object.entries(got.flatMap((a) => a.competitors || []).reduce((m, d) => ({ ...m, [d]: (m[d] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const showQs = state === "done" || state === "running" ? qs : qs.slice(0, 1);

  return (
    <div className="sx-band tint mx-cite" id="ag-citations" data-section="report_citations">
      <div className="ths-h2row"><h2>How often does AI cite you?</h2><span className="pill ok">Free</span></div>
      <p className="ths-sub">Being reachable is step one. This asks an AI assistant the questions your buyers would ask, live, and counts how often the answer links to you.</p>

      {state === "idle" && (
        <div className="mx-cite-start">
          <button type="button" className="ths-btn" onClick={tryOne}>Try one question now</button>
          <span className="muted">No email needed. Takes about 15 seconds.</span>
        </div>
      )}
      {state === "off" && <div className="ths-note"><p>Live citation checks aren&apos;t switched on yet on this site.</p></div>}
      {state === "error" && <div className="ths-note"><p>{msg}</p></div>}

      {asked.length > 0 && (
        <div className="ths-totals mx3">
          <div><b>{cited}<small> / {n}</small></b><span>Answers that link to you</span></div>
          <div><b>{mentioned}<small> / {n}</small></b><span>Answers that mention you</span></div>
          <div><b>{got.filter((a) => a.foundInSearch).length}<small> / {n}</small></b><span>Searches that found you</span></div>
        </div>
      )}
      {qs.length > 0 && (
        <div className="mx-qs">
          {showQs.map((q) => {
            const a = answers[q];
            return (
              <div key={q} className={`q ${!a ? "wait" : a.cited ? "ok" : "no"}`}>
                <span className="qq">“{q}”</span>
                {!a ? <span className="pill demo">asking…</span> : a.error ? <span className="pill warn">no answer</span> : (
                  <span className="qa">
                    <span className={`pill ${a.cited ? "ok" : "bad"}`}>{a.cited ? "Linked to you" : "Not linked"}</span>
                    {a.mentioned && !a.cited && <span className="pill warn">Mentioned</span>}
                    {!a.cited && a.competitors?.length > 0 && <span className="muted">Cited instead: {a.competitors.slice(0, 3).join(", ")}</span>}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {state === "partial" && (
        <form className="ths-gate mx-gate" onSubmit={runAll} data-form="ai_citations" data-loc="report_citations">
          <div><b>Run all 5 questions, free</b><span>Add your email and the other 4 run here straight away. Nothing to wait for in your inbox.</span></div>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" aria-label="Email" />
          <button type="submit">Run all 5</button>
        </form>
      )}
      {state === "done" && rivals.length > 0 && <p className="ths-sub">Most-cited sources for these questions: {rivals.map(([d, k]) => <code key={d}>{d} ×{k}</code>)}</p>}
      {asked.length > 0 && <p className="ths-small">Method: a live sample with Claude (web search on). Questions are written from your homepage with your name left out. AI answers vary from run to run and no AI company publishes citation totals, so this is a snapshot, not a count of every citation.</p>}
    </div>
  );
}

// How an AI reads the page: the signals it uses to understand and describe you.
function Reading({ r }) {
  const thin = r.textChars < 600;
  const rows = [
    ["Page title", r.title || null, "AI answers often reuse it as the name of the page."],
    ["Description", r.description || null, "Used as the summary when the page is cited."],
    ["Main heading", r.h1 || null, "Tells the model what the page is about."],
    ["Structured data", r.schemaTypes.length ? r.schemaTypes.join(", ") : null, "Organization, Product, FAQ or Article markup helps AI state facts about you correctly."],
    ["Text before JavaScript", `${r.textChars.toLocaleString()} characters`, thin ? "Very little. Most AI crawlers don't run JavaScript, so they may see an almost empty page." : "AI crawlers can read the page without running JavaScript."],
  ];
  return (
    <div className="sx-band">
      <div className="ths-h2row"><h2>How AI reads your page</h2></div>
      <p className="ths-sub">The signals an assistant uses to understand what you do and describe you correctly.</p>
      <div className="mx-read">
        {rows.map(([k, v, why]) => (
          <div key={k} className={!v || (k.startsWith("Text") && thin) ? "miss" : ""}>
            <span className="label">{k.toUpperCase()}</span>
            <b>{v || "Missing"}</b>
            <span className="muted">{why}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ready-to-use GA4 setup so AI referrals show up as their own channel.
const AI_REGEX = "(chatgpt\\.com|chat\\.openai\\.com|perplexity\\.ai|claude\\.ai|gemini\\.google\\.com|bard\\.google\\.com|copilot\\.microsoft\\.com|edgeservices\\.bing\\.com|you\\.com|phind\\.com|meta\\.ai|deepseek\\.com|mistral\\.ai)";
function Referrals() {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(AI_REGEX); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* manual */ } toolEvent(TOOLS.ai, "action", { action: "copy_ai_channel_regex" }); };
  return (
    <div className="sx-band tint">
      <div className="ths-h2row"><h2>Measure what AI sends you</h2><span className="pill ok">Free</span></div>
      <p className="ths-sub">By default GA4 lumps AI assistants into Referral. Add this channel so ChatGPT, Perplexity, Claude, Gemini and Copilot visits show up on their own.</p>
      <ol className="mx-steps">
        <li>GA4 → Admin → <b>Data display → Channel groups</b> → copy the default group.</li>
        <li>Add a channel named <b>AI assistants</b>: <i>Source</i> · <i>matches regex</i> · paste the pattern below.</li>
        <li>Drag it <b>above Referral</b> and save. Reports use it from now on, and explorations can apply it to past data.</li>
      </ol>
      <div className="mx-code"><div className="bar"><span>Source matches regex</span><span><button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button></span></div><pre>{AI_REGEX}</pre></div>
    </div>
  );
}

function Generator({ presets, current }) {
  const [key, setKey] = useState("cited_not_trained");
  const [copied, setCopied] = useState(false);
  const p = presets[key];
  const copy = async () => { try { await navigator.clipboard.writeText(p.robots); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* manual */ } toolEvent(TOOLS.ai, "action", { action: "copy_robots", preset: key }); };
  const download = () => { const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([p.robots], { type: "text/plain" })), download: "robots.txt" }); a.click(); toolEvent(TOOLS.ai, "action", { action: "download_robots", preset: key }); };
  return (
    <div className="mx-gen">
      <div className="ths-h2row"><h2>Fix it: choose what you want</h2></div>
      <div className="mx-tabs" role="tablist">
        {Object.entries(presets).map(([k, v]) => <button key={k} role="tab" aria-selected={k === key} className={k === key ? "on" : ""} onClick={() => { setKey(k); toolEvent(TOOLS.ai, "action", { action: "choose_robots_preset", preset: k }); }}>{v.label}</button>)}
      </div>
      {p.warn && <p className="ths-warn">{p.warn}</p>}
      <p className="ths-sub">Your rules for other bots are kept. Only the AI crawler rules are rewritten. {current ? "" : "No robots.txt was found, so this starts from scratch."}</p>
      <div className="mx-code"><div className="bar"><span>robots.txt</span><span><button type="button" onClick={download}>Download</button><button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button></span></div><pre>{p.robots}</pre></div>
    </div>
  );
}

export default function CrawlerGate() {
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState("");
  const [state, setState] = useState("idle");
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [details, setDetails] = useState(false);
  const recent = useRecent("ai-visibility", ["nytimes.com", "intelegencia.com", "hotjar.com"]);

  const check = async (e, value = input, source = "typed") => {
    e?.preventDefault(); if (!value.trim()) return;
    setInput(value); setChecked(value.trim()); setState("loading"); setData(null); setMsg("");
    toolEvent(TOOLS.ai, "start", { input_source: source });
    try {
      const res = await fetch("/api/ai-gate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: value }) });
      const json = await res.json();
      if (!res.ok) { setState("error"); setMsg(json.error || "The check failed."); toolEvent(TOOLS.ai, "error", { error_type: res.status === 429 ? "rate_limited" : "request_failed" }); return; }
      setData(json); setState("done"); recent.add(value);
      toolEvent(TOOLS.ai, "complete", { input_source: source, assistants_visible: verdicts(json).visible, crawlers_blocked: json.bots.filter((b) => !b.allowed).length, cdn: json.cdn || "none", robots: json.robotsState });
    } catch { setState("error"); setMsg("Couldn't reach the checker. Try again."); toolEvent(TOOLS.ai, "error", { error_type: "network" }); }
  };
  const v = data ? verdicts(data) : null;
  const toResult = () => document.getElementById("ag-result")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="ths">
      <ScrollEffects />
      <SiteChrome home={false} current="tools" />

      <section className="sx-hero" data-section="tool_hero">
        <div data-par="0.08" className="sx-halo par" />
        <div data-par="-0.05" className="sx-ring par" />
        <div className="sx-wrap sx-hero-grid">
          <div className="sx-hero-copy">
            <div data-reveal="0" className="eyebrow"><span className="dot" />TOOL 03 · AI SEARCH · FREE</div>
            <h1><span data-reveal="80">Is your site</span><span data-reveal="180"><em>visible</em> to AI search?</span></h1>
            <p data-reveal="300" className="lede">More people now ask an AI assistant before they search. If it can&apos;t read your site, it can&apos;t recommend you. See which assistants can find and quote you, how often they actually cite you, and get the fix.</p>
            <form data-reveal="400" className="sx-form" onSubmit={check}>
              <span className="ico" aria-hidden="true">⌕</span>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="example.com" aria-label="Website" autoComplete="off" spellCheck="false" />
              <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Checking…" : "Check my site"}</button>
            </form>
            <div data-reveal="480" className="sx-examples"><span>Try:</span>{recent.examples.map((x) => <button key={x} type="button" onClick={() => check(null, x, recent.recent.includes(x) ? "recent" : "example")} disabled={state === "loading"}>{x}</button>)}</div>
            <div data-reveal="560" className="sx-trust"><span>Plain-English verdict</span><span>Live citation sample</span><span>GA4 setup for AI traffic</span></div>
          </div>
          <div data-reveal="200" className="sx-hero-art"><GateHero input={input} checked={checked} state={state} data={data} onSee={toResult} /></div>
        </div>
      </section>

      {state === "error" && <section className="sx-wrap mx-section"><div className="ths-note" role="alert"><p>{msg}</p></div></section>}

      {state === "done" && data && v && (
        <section id="ag-result" className="sx-wrap mx-section mx-result">
          {/* 1. Verdict */}
          <div className="sx-band mx-verdict" data-section="report_verdict">
            <span className="label">VERDICT · {data.host}</span>
            <h2>{v.headline}</h2>
            <p className="cost">{v.cost}</p>
            <div className="mx-assist">
              {v.list.map((a, i) => (
                <div key={a.key} className={`a ${a.status}`} style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="top"><b>{a.name}</b><span className={`pill ${ST[a.status][0]}`}>{ST[a.status][1]}</span></div>
                  <p>{a.why}</p>
                </div>
              ))}
            </div>
            <p className="ths-sub mx-train"><b>Training is separate:</b> {v.trainAllowed} of {v.trainTotal} AI training crawlers can use your content to train models. That doesn&apos;t affect whether you&apos;re cited; it&apos;s a separate choice.</p>
          </div>

          {/* 2. Citations */}
          <Citations site={data.host} />

          {/* 3. How AI reads the page, and measuring AI traffic */}
          {data.reading && <Reading r={data.reading} />}
          <Referrals />

          {/* 3. Fix */}
          <div className="sx-band" data-section="report_robots_fix"><Generator presets={data.presets} current={data.robotsState === "ok"} /></div>

          {/* 4. Details */}
          <div className="sx-band tint">
            <div className="ths-h2row"><h2>The technical details</h2><button type="button" className="g-more mx-toggle" aria-expanded={details} onClick={() => { if (!details) toolEvent(TOOLS.ai, "action", { action: "show_technical_details" }); setDetails(!details); }}>{details ? "Hide details ↑" : "Show every crawler and check ↓"}</button></div>
            <div className="mx-checks">{data.checks.filter((c) => c.status === "fail" || c.status === "warn").map((c, i) => <Check key={i} c={c} />)}</div>
            {details && (
              <>
                {ORDER.map((p) => (
                  <div key={p} className="mx-botgroup">
                    <div className="g-head"><span className="label">{data.purposes[p].label.toUpperCase()}</span><span className="muted">{data.purposes[p].desc}</span></div>
                    <div className="mx-bots">
                      {data.bots.filter((b) => b.purpose === p).map((b) => (
                        <div key={b.token} className={`row ${b.allowed ? "ok" : "bad"}`}>
                          <code>{b.token}</code><span className="who">{b.vendor} · {b.product}{b.note && <em> — {b.note}</em>}</span>
                          <span className={`pill ${b.allowed ? "ok" : "bad"}`}>{b.allowed ? "Allowed" : "Blocked"}</span>
                          <span className="via">{b.rule ? `${b.rule} (${b.via})` : b.via}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="mx-checks">{data.checks.filter((c) => c.status !== "fail" && c.status !== "warn").map((c, i) => <Check key={i} c={c} />)}</div>
                <p className="ths-small">Crawler registry: {data.registryVerified}. Checked for the homepage path ({data.path}).</p>
              </>
            )}
            <div className="mx-myth"><span className="label">COMMON MISCONCEPTION</span><p>Blocking <code>Google-Extended</code> only opts out of Gemini training. It doesn&apos;t remove you from Google Search or AI Overviews. Blocking <code>GPTBot</code> stops OpenAI training, while <code>OAI-SearchBot</code> decides whether ChatGPT search can cite you.</p></div>
          </div>

          <section className="sx-next" data-cta-zone="1">
            <div data-par="0.06" className="ring" />
            <div><span className="label">NEXT STEP</span><h2>Want AI referrals measured in GA4?</h2><p>I set up tracking for AI search and assistant referrals, so you can see which ones send visits, what those visitors do, and whether they become leads.</p></div>
            <div className="actions"><a href={contactHref} className="ths-btn" data-track="cta_click" data-loc="ai_gate">{CTA}</a><span>or email <a href={`mailto:${EMAIL}`} data-track="cta_click" data-intent="email" data-loc="ai_gate">{EMAIL}</a></span></div>
          </section>
        </section>
      )}

      <footer className="sx-foot"><div className="sx-wrap"><span>© 2026 Megha Karnwal · AI Visibility Check</span><span>Reads robots.txt and public headers. Citation samples use Claude with web search.</span><a href="/">meghakarnwal.com ↗</a></div></footer>
    </div>
  );
}
