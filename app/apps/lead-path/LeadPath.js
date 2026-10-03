"use client";
import { useMemo, useState } from "react";
import ScrollEffects from "../../ScrollEffects";
import SiteChrome from "../../SiteChrome";
import { toolEvent, formSubmit, TOOLS } from "../../lib/analytics";
import { CTA, EMAIL, contactHref } from "../../lib/site";
import LeadHero from "./LeadHero";
import { STAGES, leadVerdict } from "./verdict";
import { useRecent } from "../../lib/recent";

const PILL = { pass: ["ok", "Pass"], fail: ["bad", "Fail"], warn: ["warn", "Check"], info: ["info", "Info"] };
const CONF = { Confirmed: "bad", Likely: "warn", Verify: "info", Info: "info" };
const CLICK_IDS = ["gclid", "gbraid", "wbraid", "gad_source", "msclkid", "fbclid", "ttclid", "li_fat_id"];
const GROUP_LABEL = { CS1: "Click IDs or UTMs lost in redirects", CS2: "Long redirect chains", CS7: "Broken landing pages", CS3: "No Google tag on the landing page", CS6: "Client-side redirects", CS4: "Click IDs lost for unconsented visitors", CS5: "Journey leaves the domain" };

const postForm = (name, fields) => fetch("/__forms.html", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ "form-name": name, ...fields }).toString() }).catch(() => {});
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const path = (u) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "") + (x.pathname === "/" ? "" : x.pathname); } catch { return u; } };
const normUrl = (u) => { try { const x = new URL(/^https?:/i.test(u) ? u : `https://${u}`); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/+$/, "")).toLowerCase(); } catch { return ""; } };

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

// Ad click → each redirect → landing page, with the parameters that made it through.
function PathDiagram({ click }) {
  const nodes = [{ label: "Paid click", sub: "test IDs added", kind: "start" },
    ...click.hops.map((h) => ({ label: `${h.status} redirect`, sub: path(h.url), kind: "hop" })),
    { label: click.status >= 400 ? `${click.status} error` : "Landing page", sub: path(click.landedUrl), kind: click.pass ? "end ok" : "end bad" }];
  return (
    <div className="mx-path">
      <div className="nodes">
        {nodes.map((n, i) => (
          <div key={i} className={`node ${n.kind}`} style={{ animationDelay: `${i * 140}ms` }}>
            <b>{n.label}</b><span>{n.sub}</span>
            {i < nodes.length - 1 && <i className="link" />}
          </div>
        ))}
      </div>
      <div className="params">
        {Object.keys({ ...Object.fromEntries(click.kept.map((k) => [k, 1])), ...Object.fromEntries(click.dropped.map((k) => [k, 1])) })
          .sort((a, b) => (CLICK_IDS.includes(b) - CLICK_IDS.includes(a)))
          .map((k) => <span key={k} className={`pill ${click.kept.includes(k) ? "ok" : "bad"}`}>{click.kept.includes(k) ? "✓" : "✕"} {k}</span>)}
      </div>
    </div>
  );
}

// What the form looks like: nearest heading, its fields and its button, so it's clear which form this is.
function FormPreview({ p, tool }) {
  if (!p) return null;
  if (p.embed) return (
    <div className="mx-fp embed"><span className="label">THE FORM</span><b>{p.embed}</b>{p.ident && <span className="muted">{p.ident}</span>}</div>
  );
  const shown = p.fields.slice(0, 6);
  return (
    <div className="mx-fp">
      <span className="label">THE FORM{p.ident ? ` · #${p.ident}` : ""}</span>
      {p.heading && <b className="h">“{p.heading}”</b>}
      <div className="wire">
        {shown.map((f, i) => (
          <span key={i} className={`fld ${f.type === "textarea" ? "area" : ""} ${f.type === "checkbox" ? "chk" : ""}`}>
            {f.type === "checkbox" ? "☐ " : ""}{f.label}{f.required ? " *" : ""}
          </span>
        ))}
        {p.fields.length > shown.length && <span className="more">+{p.fields.length - shown.length} more field{p.fields.length - shown.length > 1 ? "s" : ""}</span>}
        <span className="btn">{p.submit}</span>
      </div>
    </div>
  );
}

function FormCard({ f, snippet }) {
  const [show, setShow] = useState(false);
  return (
    <div className={`mx-form ${f.ok ? "ok" : "bad"}`}>
      <div className="head">
        <b>{f.preview?.heading ? `${f.preview.heading.length > 42 ? f.preview.heading.slice(0, 40) + "…" : f.preview.heading}` : f.preview?.submit && f.preview.submit !== "Submit" ? `“${f.preview.submit}” form` : f.tool}</b>
        {(f.preview?.heading || (f.preview?.submit && f.preview.submit !== "Submit")) && <span className="pill demo">{f.tool}</span>}
        <span className="pill info">{f.method === "iframe" ? "iframe" : f.method}</span>
        {f.fields != null && <span className="muted">{f.fields} fields{f.required ? `, ${f.required} required` : ""}</span>}
        <span className="where">{f.pages.length > 1 ? `on ${f.pages.length} pages` : path(f.page)}</span>
      </div>
      <FormPreview p={f.preview} tool={f.tool} />
      <div className="lead-path"><span className="label">WHAT HAPPENS TO A LEAD&apos;S SOURCE</span><p>{f.path}</p></div>
      <div className="facts">
        <div><span className="label">ATTRIBUTION</span><span>{f.attrNote}</span></div>
        {f.pages.length > 1 && <div><span className="label">PAGES</span><span>{f.pages.map(path).join(" · ")}</span></div>}
      </div>
      <div className="mx-checks">{f.checks.map((c, i) => <Check key={i} c={c} />)}</div>
      {snippet && f.checks.some((c) => c.id === "FX2" && c.status === "fail") && (
        <div className="snippet">
          <button type="button" onClick={() => { if (!show) toolEvent(TOOLS.lead, "action", { action: "show_fix_snippet" }); setShow(!show); }}>{show ? "Hide" : "Show"} the hidden-field fix for developers</button>
          {show && <pre>{snippet}</pre>}
        </div>
      )}
    </div>
  );
}

// ── Bulk mode helpers: Google Ads export (final URL + clicks + cost)
function parseAdsCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const split = (l) => { const out = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if ((ch === "," || ch === "\t") && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((s) => s.trim()); };
  const hi = lines.findIndex((l) => /final url|landing page/i.test(l) && /cost/i.test(l));
  if (hi < 0) return null;
  const head = split(lines[hi]).map((h) => h.toLowerCase());
  const iu = head.findIndex((h) => /final url|landing page/.test(h)), ic = head.findIndex((h) => h === "cost" || /^cost\b/.test(h)), ik = head.findIndex((h) => h === "clicks");
  const icur = head.findIndex((h) => /currency/.test(h));
  const spend = new Map(); let currency = "";
  for (const l of lines.slice(hi + 1)) {
    const c = split(l); const url = c[iu]; if (!url || /^total/i.test(c[0] || "")) continue;
    const key = normUrl(url); if (!key) continue;
    const cost = parseFloat(String(c[ic] || "0").replace(/[^0-9.-]/g, "")) || 0;
    const clicks = parseInt(String(c[ik] || "0").replace(/[^0-9]/g, ""), 10) || 0;
    if (icur >= 0 && c[icur]) currency = c[icur];
    const e = spend.get(key) || { url: /^https?:/i.test(url) ? url : `https://${url}`, cost: 0, clicks: 0 };
    e.cost += cost; e.clicks += clicks; spend.set(key, e);
  }
  return { spend, currency };
}

function useBulk() {
  const [text, setText] = useState("");
  const [ads, setAds] = useState(null);
  const [run, setRun] = useState({ state: "idle", done: 0, total: 0, results: [] });

  const onFile = async (e) => { const f = e.target.files?.[0]; if (!f) return; const parsed = parseAdsCsv(await f.text()); setAds(parsed ? { ...parsed, name: f.name } : { error: "Couldn't find Final URL and Cost columns. Export the Landing pages report as CSV." }); };
  const typed = text.split(/[\s,]+/).filter((u) => u.includes("."));
  const fromAds = ads?.spend ? [...ads.spend.values()].map((x) => x.url) : [];
  const urls = [...new Set([...typed, ...fromAds])].slice(0, 300);

  const start = async (ev) => {
    ev?.preventDefault();
    if (!urls.length) return;
    toolEvent(TOOLS.lead, "start", { mode: "bulk", links: urls.length, with_spend: !!ads?.spend });
    setRun({ state: "running", done: 0, total: urls.length, results: [] });
    setTimeout(() => document.getElementById("lp-bulk-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    const all = [];
    for (let i = 0; i < urls.length; i += 8) {
      const res = await fetch("/api/lead-path", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "bulk", urls: urls.slice(i, i + 8) }) }).then((r) => r.json()).catch(() => ({ results: [] }));
      if (res.error) { await new Promise((r) => setTimeout(r, 20000)); i -= 8; continue; } // rate limited: wait, retry batch
      all.push(...(res.results || []));
      setRun({ state: "running", done: Math.min(urls.length, i + 8), total: urls.length, results: [...all] });
    }
    setRun((r) => ({ ...r, state: "done" }));
    toolEvent(TOOLS.lead, "complete", { mode: "bulk", links: all.length, broken: all.filter((r) => !r.pass || r.error).length, with_spend: !!ads?.spend });
  };

  const grouped = useMemo(() => {
    const g = {};
    for (const r of run.results) for (const ck of (r.checks || []).filter((x) => x.status === "fail")) (g[ck.id] = g[ck.id] || []).push(r);
    return g;
  }, [run.results]);
  const spendOf = (r) => ads?.spend?.get(normUrl(r.url))?.cost || 0;
  const broken = run.results.filter((r) => !r.pass || r.error);
  const brokenSpend = broken.reduce((n, r) => n + spendOf(r), 0);
  const totalSpend = ads?.spend ? [...ads.spend.values()].reduce((n, x) => n + x.cost, 0) : 0;
  const money = (n) => `${ads?.currency ? ads.currency + " " : ""}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const inputs = (
    <form className="mx-bulk-box" onSubmit={start}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} spellCheck="false" aria-label="Links to check, one per line"
        placeholder={"Paste your links here, one per line\nexample.com/landing\nexample.com/pricing?utm_source=newsletter\nexample.com/demo?gclid=…"} />
      <div className="mx-bulk-bar">
        <label className="mx-upload">
          <input type="file" accept=".csv,.tsv,text/csv" onChange={onFile} />
          <span>{ads?.name ? `✓ ${ads.name}` : "＋ Add ad spend export (optional)"}</span>
        </label>
        <span className="count">{urls.length ? `${urls.length} link${urls.length > 1 ? "s" : ""}` : "No links yet"}</span>
        <button type="submit" disabled={!urls.length || run.state === "running"}>{run.state === "running" ? `Checking ${run.done} / ${run.total}…` : `Check ${urls.length || ""} link${urls.length === 1 ? "" : "s"}`}</button>
      </div>
      {ads?.spend && <span className="mx-bulk-note ok">{ads.spend.size} URLs and {money(totalSpend)} of spend loaded from your export.</span>}
      {ads?.error && <span className="mx-bulk-note bad">{ads.error}</span>}
      {!ads && <span className="mx-bulk-note">The export (Google Ads landing pages report with Final URL, Clicks and Cost) is read in your browser, never uploaded. Up to 300 links.</span>}
    </form>
  );

  const results = run.state === "idle" ? null : (
    <div id="lp-bulk-result" className="sx-band mx-bulk-out" data-section="report_bulk">
      <div className="ths-h2row"><h2>{run.state === "running" ? "Checking your links…" : broken.length ? `${broken.length} of ${run.results.length} links break tracking` : "Every link keeps its source"}</h2>{run.state === "running" && <span className="ths-sub">{run.done} / {run.total}</span>}</div>
      <div className="ths-totals">
        <div><b>{run.results.length}</b><span>Links checked</span></div>
        <div><b>{broken.length}</b><span>Broken paths</span></div>
        <div><b>{Object.keys(grouped).length}</b><span>Failure types</span></div>
        {ads?.spend && <div className="spend"><b>{money(brokenSpend)}</b><span>Spend through broken paths</span></div>}
      </div>
      {ads?.spend && broken.length > 0 && <p className="mx-spend-line"><b>{money(brokenSpend)}</b> of the spend in your export ({totalSpend ? Math.round((brokenSpend / totalSpend) * 100) : 0}%) went through paths that break tracking. That&apos;s spend sent through broken paths, not lost revenue.</p>}
      {Object.entries(grouped).map(([id, rows]) => (
        <details key={id} className="mx-group" open={id === "CS1"}>
          <summary><span className="pill bad">{rows.length}</span> {GROUP_LABEL[id] || id}{ads?.spend && <span className="muted"> · {money(rows.reduce((n, r) => n + spendOf(r), 0))}</span>}</summary>
          <div className="rows">{rows.map((r) => {
            const ck = r.checks.find((x) => x.id === id);
            return <div key={r.url}><code>{path(r.url)}</code><span>{ck.title}</span>{ck.fix && <span className="muted">Fix: {ck.fix}</span>}</div>;
          })}</div>
        </details>
      ))}
    </div>
  );
  return { inputs, results };
}

function Monitoring({ site }) {
  const [email, setEmail] = useState(""), [done, setDone] = useState(false);
  const submit = async (e) => { e.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { formSubmit("lead_path_monitoring", "report_monitoring", { status: "failed", failure_reason: "invalid_email" }); return; } await postForm("lead-path-monitoring", { email: email.trim(), site: site || "" }); setDone(true); formSubmit("lead_path_monitoring", "report_monitoring", { email }); };
  return (
    <div className="mx-monitor">
      <div><span className="label">WEEKLY MONITORING · EARLY ACCESS</span><b>Get an alert when a redirect starts dropping click IDs.</b><span className="muted">Redirects change silently when sites are redeployed. Monitoring re-checks your final URLs every week. Join the early-access list and I&apos;ll set it up with you.</span></div>
      {done ? <span className="pill ok">You&apos;re on the list.</span> : (
        <form onSubmit={submit} data-form="lead_path_monitoring" data-loc="report_monitoring"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" aria-label="Email" /><button type="submit">Join</button></form>
      )}
    </div>
  );
}

export default function LeadPath() {
  const [mode, setMode] = useState("single");
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState("");
  const [state, setState] = useState("idle");
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const bulk = useBulk();
  const recent = useRecent("lead-path", ["hotjar.com", "intelegencia.com"]);

  const check = async (e, value = input, source = "typed") => {
    e?.preventDefault(); if (!value.trim()) return;
    setInput(value); setChecked(value.trim()); setState("loading"); setData(null); setMsg("");
    toolEvent(TOOLS.lead, "start", { mode: "single", input_source: source });
    try {
      const res = await fetch("/api/lead-path", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "single", url: value }) });
      const json = await res.json();
      if (!res.ok) { setState("error"); setMsg(json.error || "The check failed."); toolEvent(TOOLS.lead, "error", { error_type: res.status === 429 ? "rate_limited" : "request_failed" }); return; }
      setData(json); setState("done"); recent.add(value);
      toolEvent(TOOLS.lead, "complete", { mode: "single", input_source: source, click_pass: json.click.pass, forms: json.forms.length, broken_stage: ["arrives", "landing_page", "form", "crm"][leadVerdict(json).stages.indexOf("bad")] || "none", page_source: String(json.pageSource || "live").startsWith("archive") ? "archive" : json.pageSource || "live" });
    } catch { setState("error"); setMsg("Couldn't reach the checker. Try again."); toolEvent(TOOLS.lead, "error", { error_type: "network" }); }
  };

  return (
    <div className="ths">
      <ScrollEffects />
      <SiteChrome home={false} current="tools" />

      <section className="sx-hero" data-section="tool_hero">
        <div data-par="0.08" className="sx-halo par" />
        <div data-par="-0.05" className="sx-ring par" />
        <div className="sx-wrap sx-hero-grid">
          <div className="sx-hero-copy">
            <div data-reveal="0" className="eyebrow"><span className="dot" />TOOL 02 · ATTRIBUTION · FREE</div>
            <h1><span data-reveal="80">Where does your traffic</span><span data-reveal="180"><em>lose its source</em>?</span></h1>
            <p data-reveal="300" className="lede">Ads, email, social or partner links: a visit only counts for its channel if its UTMs and click IDs survive the redirects, get read by your tags and get captured by your forms. This follows one visit all the way and shows where the trail breaks.</p>
            {mode === "single" && (
              <form data-reveal="400" className="sx-form mx-first" onSubmit={check}>
                <span className="ico" aria-hidden="true">⌕</span>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="any campaign link or landing page" aria-label="Landing page URL" autoComplete="off" spellCheck="false" />
                <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Checking…" : "Follow the visit"}</button>
              </form>
            )}
            {mode === "single" ? (
              <div data-reveal="480" className="sx-examples"><span>Try:</span>{recent.examples.map((x) => <button key={x} type="button" onClick={() => check(null, x, recent.recent.includes(x) ? "recent" : "example")} disabled={state === "loading"}>{x}</button>)}
                <button type="button" className="mx-switch" onClick={() => { setMode("bulk"); toolEvent(TOOLS.lead, "action", { action: "open_bulk" }); }}>Checking a whole campaign? Check many links at once →</button>
              </div>
            ) : (
              <div className="mx-bulk-hero">{bulk.inputs}<button type="button" className="mx-switch" onClick={() => setMode("single")}>← Back to checking one link</button></div>
            )}
            <div data-reveal="560" className="sx-trust"><span>Fake test IDs only (gclid=XRAY_TEST)</span><span>Never submits a form</span><span>Never calls ad platforms</span></div>
          </div>
          <div data-reveal="200" className="sx-hero-art">
            {mode === "single"
              ? <LeadHero input={input} checked={checked} state={state} data={data} onSee={() => document.getElementById("lp-result")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
              : <div className="mx-hero-path" aria-hidden="true">
                  {[["Campaign link", "utm_* · gclid"], ["Redirects", "kept or dropped?"], ["Landing page", "tag reads source"], ["Form", "captures source"], ["CRM", "lead source"]].map(([a, b], i) => (
                    <div key={a} className={`step${i === 1 ? " warn" : ""}`} style={{ animationDelay: `${i * 0.5}s` }}><b>{a}</b><span>{b}</span></div>
                  ))}
                </div>}
          </div>
        </div>
      </section>

      {mode === "bulk" && bulk.results && <section className="sx-wrap mx-section">{bulk.results}</section>}

      {mode === "single" && state === "loading" && (
        <section className="sx-wrap sx-scanning"><div className="sx-term"><div className="sx-term-head"><span className="live">FOLLOWING THE CLICK · {input}</span><span>…</span></div><div className="sx-term-sweep" />
          {["Adding fake click IDs and UTMs", "Following every redirect", "Reading the landing page and its tags", "Finding lead forms on up to 10 pages", "Checking how each form keeps the source"].map((t) => <div key={t} className="ln on"><span className="mk">›</span><span className="t">{t}</span><span className="d" /></div>)}
        </div></section>
      )}
      {mode === "single" && state === "error" && <section className="sx-wrap mx-section"><div className="ths-note" role="alert"><p>{msg}</p></div></section>}

      {mode === "single" && state === "done" && data && (
        <section id="lp-result" className="sx-wrap mx-section mx-result">
          {(() => { const v = leadVerdict(data); return (
            <div className="sx-band mx-verdict" data-section="report_verdict">
              <span className="label">VERDICT · {path(data.click.landedUrl)}</span>
              <h2>{v.headline}</h2>
              <p className="cost">{v.cost}</p>
              <div className="mx-stages">{STAGES.map((s, i) => <div key={s} className={`st ${v.stages[i]}`} style={{ animationDelay: `${i * 90}ms` }}><span className="n">0{i + 1}</span><b>{s}</b><span className="v">{{ ok: "Kept", bad: "Lost", warn: "At risk", unknown: "Can't see from outside" }[v.stages[i]]}</span></div>)}</div>
            </div>
          ); })()}
          <div className="sx-band" data-section="report_click_survival">
            <div className="ths-h2row"><h2>Click survival</h2><span className={`pill ${data.click.pass ? "ok" : "bad"}`}>{data.click.pass ? "Path passes" : "Path breaks tracking"}</span></div>
            <PathDiagram click={data.click} />
            <div className="mx-checks">{data.click.checks.map((c, i) => <Check key={i} c={c} />)}</div>
          </div>

          <div className="sx-band tint" data-section="report_forms">
            <div className="ths-h2row"><h2>Form X-Ray</h2><span className="ths-sub">{data.forms.length} form{data.forms.length === 1 ? "" : "s"} across {data.pagesChecked.length} page{data.pagesChecked.length === 1 ? "" : "s"}</span></div>
            {data.pageSource && data.pageSource !== "live" && <p className="mx-note">{data.pageSource === "blocked" ? "The site blocks automated visits and no archived copy was found, so its forms couldn't be read." : `The site blocks automated visits, so forms and tags were read from the ${data.pageSource}. Redirect results above are live.`}</p>}
            <p className="ths-sub">Form tracking found in the tags: {data.tracking.length ? data.tracking.slice(0, 6).map((t) => <code key={t}>{t.replace(/\s+\(pattern\)/, "")}</code>) : "none"}</p>
            {data.forms.length ? data.forms.map((f, i) => <FormCard key={i} f={f} snippet={data.snippet} />)
              : <p className="ths-sub">No lead forms found in the raw HTML of the pages checked. Forms built entirely by JavaScript need the browser render (phase 2).</p>}
          </div>

          <div className="sx-band mx-crm" data-section="report_crm_test">
            <div className="ths-h2row"><h2>Test the CRM step yourself</h2><span className="pill info">2 minutes</span></div>
            <p className="ths-sub">No tool can see inside your CRM from outside, but you can check the last step by hand:</p>
            <ol className="mx-steps">
              <li>Open this test link in a private window: <a href={data.crmTestUrl} target="_blank" rel="noopener" onClick={() => toolEvent(TOOLS.lead, "action", { action: "open_crm_test_link" })}>{path(data.crmTestUrl)}?utm_source=lead_path_test…</a></li>
              <li>Submit the form with a name you'll recognise, like <b>Test Lead Path</b>.</li>
              <li>Open that lead in your CRM. If its source shows <code>lead_path_test</code> / <code>crm_check</code>, the trail survives end to end. If it says Direct, Offline or nothing, the source is lost between the form and the CRM.</li>
            </ol>
          </div>

          <Monitoring site={data.host} />

          <section className="sx-next" data-cta-zone="1">
            <div data-par="0.06" className="ring" />
            <div><span className="label">NEXT STEP</span><h2>Want the CRM side checked too?</h2><p>This is the outside view. The paid audit follows real leads into the CRM and confirms every Verify item, with a fix plan in priority order.</p></div>
            <div className="actions"><a href={contactHref} className="ths-btn" data-track="cta_click" data-loc="lead_path">{CTA}</a><span>or email <a href={`mailto:${EMAIL}`} data-track="cta_click" data-intent="email" data-loc="lead_path">{EMAIL}</a></span></div>
          </section>
        </section>
      )}

      <footer className="sx-foot"><div className="sx-wrap"><span>© 2026 Megha Karnwal · Lead Path X-Ray</span><span>Fake test IDs only. Forms are read, never submitted.</span><a href="/">meghakarnwal.com ↗</a></div></footer>
    </div>
  );
}
