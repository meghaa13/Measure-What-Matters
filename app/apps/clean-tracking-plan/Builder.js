"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CLASSES, LEAKS, MARKETS, NEVER, STACK, TAGS, TYPES } from "./data";
import { codeTabs, counts, has, isPush, isServer, mpSnippet, planCSV, planJSON, pushSnippet, visibleStages } from "./codegen";

const EMAIL = "meghakarnwal13@gmail.com";
const DEFAULT = { type: "b2b", mkt: "us", stack: { ads: true, meta: false, crm: true, cmp: true } };

const track = (event, p) => { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event, ...p }); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function highlight(src) {
  return esc(src).split("\n").map((line) => {
    const i = line.search(/(\/\/|^\s*#)/);
    if (i >= 0 && !/https?:$/.test(line.slice(0, i))) return line.slice(0, i) + '<span class="cm">' + line.slice(i) + "</span>";
    return line;
  }).join("\n").replace(/'(granted|denied)'/g, "<span class=\"k\">'$1'</span>");
}

// ── state <-> URL, so a plan can be shared as a link
function readURL() {
  if (typeof window === "undefined") return DEFAULT;
  const q = new URLSearchParams(window.location.search);
  const type = TYPES[q.get("type")] ? q.get("type") : DEFAULT.type;
  const mkt = MARKETS[q.get("market")] ? q.get("market") : DEFAULT.mkt;
  const stack = q.has("stack")
    ? Object.fromEntries(STACK.map(([k]) => [k, q.get("stack").split(",").includes(k)]))
    : DEFAULT.stack;
  return { type, mkt, stack };
}
const query = (S) => new URLSearchParams({ type: S.type, market: S.mkt, stack: STACK.map(([k]) => k).filter((k) => S.stack[k]).join(",") }).toString();
function writeURL(S) {
  window.history.replaceState(null, "", `${window.location.pathname}?${query(S)}`);
}

function download(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useCopy() {
  const [copied, setCopied] = useState(null);
  const t = useRef();
  const copy = async (id, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); }
    catch { setCopied(id + ":fail"); }
    clearTimeout(t.current);
    t.current = setTimeout(() => setCopied(null), 1800);
  };
  const label = (id, base = "Copy") => copied === id ? "Copied" : copied === id + ":fail" ? "Select and press Ctrl+C" : base;
  return [copy, label];
}

// ── hash lab
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const normEmailG = (e) => { e = e.trim().toLowerCase(); const [u, d] = e.split("@"); return d === "gmail.com" || d === "googlemail.com" ? u.replace(/\./g, "") + "@" + d : e; };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns digits incl. country code, plus a note when we had to infer it.
function phoneDigits(raw, mkt) {
  const t = raw.trim();
  let d = t.replace(/\D/g, "");
  if (!d) return { d: "" };
  if (t.startsWith("+")) return { d };
  if (d.startsWith("00")) return { d: d.slice(2) };
  const m = MARKETS[mkt];
  if (m.cc === "1" && d.length === 10) return { d: "1" + d, note: `No country code, so +1 was added for ${m.name}.` };
  if (m.cc === "1" && d.length === 11 && d.startsWith("1")) return { d };
  if (m.cc === "61" && d.startsWith("0")) return { d: "61" + d.slice(1), note: "No country code, so the leading 0 was replaced with +61 for Australia." };
  return { d, warn: "Add the country code (e.g. +44…). Without it the hash won't match the ad platform's records." };
}

function HashLab({ S }) {
  const [email, setEmail] = useState("  Jane.Doe@Gmail.com ");
  const [phone, setPhone] = useState("+1 (415) 555-0132");
  const [out, setOut] = useState({ rows: [], notes: [] });
  const used = useRef(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const rows = [], notes = [];
      if (email.trim()) {
        if (!EMAIL_RE.test(email.trim())) notes.push({ warn: true, t: "That doesn't look like a full email address. Ad platforms will hash it, but it won't match anyone." });
        const g = normEmailG(email);
        rows.push(["Google · normalised email", g, false], ["Google · sha256_email_address", await sha256(g), true]);
        if (S.stack.meta) rows.push(["Meta · em", await sha256(email.trim().toLowerCase()), true]);
      }
      if (phone.trim()) {
        const { d, note, warn } = phoneDigits(phone, S.mkt);
        if (note) notes.push({ t: note });
        if (warn) notes.push({ warn: true, t: warn });
        if (d) {
          rows.push(["Google · normalised phone", "+" + d, false], ["Google · sha256_phone_number", await sha256("+" + d), true]);
          if (S.stack.meta) rows.push(["Meta · ph", await sha256(d), true]);
        }
      }
      if (live) setOut({ rows, notes });
    })();
    return () => { live = false; };
  }, [email, phone, S.stack.meta, S.mkt]);

  const onInput = (fn) => (e) => { if (!used.current) { used.current = true; track("hash_lab_used"); } fn(e.target.value); };

  return (
    <div className="ctp-lab">
      <div className="ctp-lab-in">
        <div className="ctp-field"><label htmlFor="in-email">Email</label><input id="in-email" type="email" autoComplete="off" value={email} onChange={onInput(setEmail)} /></div>
        <div className="ctp-field"><label htmlFor="in-phone">Phone (with country code)</label><input id="in-phone" type="tel" autoComplete="off" value={phone} onChange={onInput(setPhone)} /></div>
      </div>
      <div className="ctp-out" aria-live="polite">
        {out.rows.length ? out.rows.map(([l, v, h]) => (
          <div key={l} className="ctp-outrow"><span>{l}</span><code className={h ? "h" : ""}>{v}</code></div>
        )) : <p className="ctp-note">Type an email or phone number to see its hashed form.</p>}
        {out.notes.map((n) => <p key={n.t} className={`ctp-note${n.warn ? " warn" : ""}`}>{n.t}</p>)}
        {out.rows.length > 0 && <p className="ctp-note">The hash is one-way, but the same input always gives the same output. That&apos;s how ad platforms match it to their own users, and why the normalising rules matter.</p>}
      </div>
    </div>
  );
}

// ── one event row
function EventRow({ r, st, S, copy, label }) {
  const [open, setOpen] = useState(false);
  const push = isPush(r, st), srv = isServer(r, st);
  const snippet = push ? pushSnippet(r, S) : srv ? mpSnippet(r, S) : null;
  const id = st.stage + r.name;
  return (
    <div className="ctp-row">
      <div className="ctp-ev">
        <code>{r.name}</code>
        <div className="ctp-badges">
          <span className="ctp-badge">{r.badge}</span>
          {srv && <span className="ctp-badge srv">server</span>}
          {r.conv && <span className="ctp-badge conv">key event</span>}
        </div>
        <div className="ctp-when">{r.when}</div>
      </div>
      <div className="ctp-params">
        <div className="ctp-pchips">
          {r.params.map((p) => (
            <span key={p.k} className={`ctp-p c-${p.cls}`} title={CLASSES[p.cls].label}>
              {p.k}{p.note && <span className="pn"> · {p.note}</span>}
            </span>
          ))}
        </div>
        {r.note && <p className="ctp-note" dangerouslySetInnerHTML={{ __html: r.note }} />}
        {r.auto && <p className="ctp-note">Collected automatically. No dataLayer push needed, just check enhanced measurement is on.</p>}
        {snippet && (
          <div className="ctp-snip">
            <button type="button" className="ctp-snip-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <span>{open ? "−" : "+"}</span>{push ? "dataLayer push" : "Measurement Protocol request"}
            </button>
            {open && (
              <div className="ctp-codebox small">
                <div className="ctp-codebar"><span>{r.name}</span>
                  <button type="button" className="ctp-copy" onClick={() => { track("code_copy", { snippet: r.name, site_type: S.type }); copy(id, snippet); }}>{label(id)}</button>
                </div>
                <pre dangerouslySetInnerHTML={{ __html: highlight(snippet) }} />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="ctp-consent">
        <span className="ctp-ctl-label">Consent needed</span>
        {r.consent.map((c) => <span key={c} className="ctp-sig">{c}</span>)}
      </div>
    </div>
  );
}

export default function Builder() {
  const [S, setS] = useState(DEFAULT);
  const [ready, setReady] = useState(false);
  const [codeTab, setCodeTab] = useState(0);
  const [copy, label] = useCopy();

  useEffect(() => { setS(readURL()); setReady(true); track("builder_open"); }, []);
  useEffect(() => { if (ready) writeURL(S); }, [S, ready]);

  const stages = useMemo(() => visibleStages(S), [S]);
  const c = useMemo(() => counts(S), [S]);
  const tabs = useMemo(() => codeTabs(S), [S]);
  const tab = tabs[Math.min(codeTab, tabs.length - 1)];
  const code = useMemo(() => tab.g(S), [tab, S]);
  const m = MARKETS[S.mkt];

  const set = (key, v) => {
    setS((s) => ({ ...s, [key]: v }));
    track(key === "type" ? "site_type_select" : "market_select", { selection: v });
  };
  const toggle = (k) => {
    setS((s) => ({ ...s, stack: { ...s.stack, [k]: !s.stack[k] } }));
    track("stack_toggle", { tool: k, enabled: !S.stack[k] });
  };

  const alerts = [];
  const add = (lvl, txt) => alerts.push({ lvl, txt });
  if (!S.stack.cmp && S.mkt === "eu") add("never", "No consent banner: for EEA and UK visitors, analytics and ad tags must stay off. Add a banner that sends Consent Mode v2 signals before running ads.");
  if (!S.stack.cmp && S.mkt === "ca") add("gated", "No consent banner: visitors from Quebec need tracking off by default under Law 25. Add a banner with a CA-QC region rule.");
  if (!S.stack.cmp && S.mkt === "us") add("gated", "No consent banner: you still need a way to honour \"Do not sell or share\" and Global Privacy Control opt-outs.");
  if (!S.stack.cmp && S.stack.ads) add("gated", "Without a banner, ad_user_data is never set from a real choice, so enhanced conversions rest on assumed consent.");
  if (!S.stack.crm && (S.type === "b2b" || S.type === "saas")) add("hash", `No CRM or backend link: you can count ${S.type === "b2b" ? "form fills but not qualified leads or revenue" : "first payments but not renewals, cancellations or refunds"}. Add CRM / backend to see the full picture by channel.`);
  if (S.type === "booking") add("gated", "If you offer health, wellness, legal or financial services, the service name itself is sensitive. Send generic categories, and keep them off ad platforms.");
  if (S.type === "publisher" && (S.stack.ads || S.stack.meta)) add("gated", "Don't build ad audiences from article topics that reveal health, politics, religion or sexuality.");
  if (S.stack.meta && S.stack.ads) add("hash", "Two ad platforms: send the same hashed data and the same event IDs to both, so neither double-counts.");
  if (!alerts.length) add("safe", "Your stack covers the essentials. Work through the leaks list below before you launch.");

  const fileBase = `tracking-plan-${S.type}-${S.mkt}`;
  const shareURL = () => (ready ? `${window.location.origin}${window.location.pathname}?${query(S)}` : "");

  return (
    <div className="ctp">
      <div className="ctp-wrap">
        <header className="ctp-header">
          <div className="ctp-hgroup">
            <Link href="/#apps" className="ctp-back">← Megha Karnwal · Apps</Link>
            <div className="ctp-eyebrow">GA4 · Consent Mode v2 · First-party data</div>
            <h1>The Clean <em>Tracking Plan</em></h1>
            <p className="ctp-lede">Pick your website type, market and stack. You get the dataLayer requirements for every event, with each field sorted into safe, consent-gated, hash only or never collect, plus the consent signals and code to match.</p>
          </div>
          <div className="ctp-byline">Built by Megha Karnwal<br />Analytics · Automation · AI<br />Runs in your browser. Nothing is sent.</div>
        </header>

        {/* controls */}
        <section aria-label="Your setup" className="ctp-sec">
          <div className="ctp-controls">
            <div className="ctp-ctl wide">
              <span className="ctp-ctl-label" id="l-type">Website type</span>
              <div className="ctp-seg" role="group" aria-labelledby="l-type">
                {Object.entries(TYPES).map(([k, t]) => <button key={k} type="button" aria-pressed={S.type === k} onClick={() => set("type", k)}>{t.label}</button>)}
              </div>
            </div>
            <div className="ctp-ctl">
              <span className="ctp-ctl-label" id="l-mkt">Main market</span>
              <div className="ctp-seg" role="group" aria-labelledby="l-mkt">
                {Object.entries(MARKETS).map(([k, x]) => <button key={k} type="button" aria-pressed={S.mkt === k} onClick={() => set("mkt", k)}>{k === "eu" ? "EEA / UK" : k === "us" ? "US" : x.name}</button>)}
              </div>
            </div>
            <div className="ctp-ctl">
              <span className="ctp-ctl-label" id="l-stack">Your stack</span>
              <div className="ctp-seg" role="group" aria-labelledby="l-stack">
                {STACK.map(([k, l]) => <button key={k} type="button" className="ctp-chip" aria-pressed={!!S.stack[k]} onClick={() => toggle(k)}>{l}</button>)}
              </div>
            </div>
          </div>
        </section>

        {/* summary */}
        <section aria-labelledby="h-sum" className="ctp-sec">
          <div className="ctp-sec-head">
            <div className="ctp-eyebrow" id="h-sum">Your plan at a glance</div>
            <h2>{TYPES[S.type].label} plan · {m.name}</h2>
          </div>
          <div className="ctp-summary">
            {Object.keys(CLASSES).map((k) => (
              <div key={k} className={`ctp-cls c-${k}`}><b>{c[k]}</b><span>{CLASSES[k].label}</span><small>{CLASSES[k].desc}</small></div>
            ))}
          </div>
          <div className="ctp-alerts">
            {alerts.map((a) => (
              <div key={a.txt} className={`ctp-alert c-${a.lvl}`}><span className="tag">{{ never: "Blocker", gated: "Check", hash: "Note", safe: "Ready" }[a.lvl]}</span><span>{a.txt}</span></div>
            ))}
          </div>
          <div className="ctp-exports">
            <button type="button" className="ctp-btn" onClick={() => { track("plan_export", { format: "csv", site_type: S.type }); download(fileBase + ".csv", planCSV(S), "text/csv"); }}>Download plan (.csv)</button>
            <button type="button" className="ctp-mini" onClick={() => { track("plan_export", { format: "json", site_type: S.type }); download(fileBase + ".json", planJSON(S), "application/json"); }}>JSON spec</button>
            <button type="button" className="ctp-mini" onClick={() => { track("plan_share", { site_type: S.type }); copy("share", shareURL()); }}>{label("share", "Copy link to this plan")}</button>
          </div>
        </section>

        {/* plan */}
        <section aria-labelledby="h-plan" className="ctp-sec">
          <div className="ctp-sec-head">
            <div className="ctp-eyebrow">Event plan</div>
            <h2 id="h-plan">What to collect, and how each field is treated</h2>
            <p>GA4 recommended event names wherever one exists. Events marked <em>custom</em> need registering as custom definitions. Open any event to get its exact dataLayer push.</p>
          </div>
          <div className="ctp-stages">
            {stages.map((st) => (
              <div key={st.stage} className="ctp-stage">
                <div className="ctp-stage-h"><span>{st.stage}</span><span>{st.dest ? "Ad platform destinations" : st.server ? "Server-side · Measurement Protocol" : "Browser · GTM"}</span></div>
                {st.rows.map((r) => <EventRow key={r.name} r={r} st={st} S={S} copy={copy} label={label} />)}
              </div>
            ))}
          </div>
        </section>

        {/* never */}
        <section aria-labelledby="h-never" className="ctp-sec">
          <div className="ctp-sec-head">
            <div className="ctp-eyebrow">Never collect</div>
            <h2 id="h-never">Fields that stay out of analytics entirely</h2>
            <p>These can sit in your CRM, booking or order system. They should never appear in a dataLayer push, an event parameter or a URL.</p>
          </div>
          <div className="ctp-never-grid">
            {NEVER[S.type].map(([k, why]) => <div key={k} className="ctp-never-item"><span className="ctp-p c-never">{k}</span><p className="ctp-note">{why}</p></div>)}
          </div>
        </section>

        {/* consent */}
        <section aria-labelledby="h-consent" className="ctp-sec">
          <div className="ctp-sec-head">
            <div className="ctp-eyebrow">Consent matrix</div>
            <h2 id="h-consent">Which consent each tag needs</h2>
            <p>Google tags read the four Consent Mode v2 signals. Other platforms map to your banner&apos;s marketing category.</p>
          </div>
          <div className="ctp-tablewrap">
            <table>
              <thead><tr><th>Tag</th><th>analytics_storage</th><th>ad_storage</th><th>ad_user_data</th><th>ad_personalization</th><th>Note</th></tr></thead>
              <tbody>
                {TAGS.filter((t) => has(t.need, S.stack)).map((t) => (
                  <tr key={t.t}><td><strong>{t.t}</strong></td>
                    {[t.a, t.s, t.u, t.p].map((v, i) => v === "—" ? <td key={i} className="n">—</td> : v ? <td key={i} className="y">Required</td> : <td key={i} className="n">·</td>)}
                    <td className="ctp-note">{t.note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ctp-market">
            <div className="ctp-mcard"><b>Default for {m.name}</b><span>{m.def}</span></div>
            <div className="ctp-mcard"><b>Why</b><span className="muted">{m.detail}</span></div>
          </div>
        </section>

        {/* leaks */}
        <section aria-labelledby="h-leaks" className="ctp-sec">
          <div className="ctp-sec-head">
            <div className="ctp-eyebrow">Common leaks</div>
            <h2 id="h-leaks">Where personal data slips into analytics by accident</h2>
            <p>None of these are deliberate. All of them show up in real GA4 properties.</p>
          </div>
          <div className="ctp-leaks">
            {LEAKS.filter((l) => has(l.need, S.stack)).map((l) => (
              <div key={l.t} className="ctp-leak"><h3>{l.t}</h3><p><span className="lbl">How to check</span>{l.check}</p><p><span className="lbl">Fix</span>{l.fix}</p></div>
            ))}
          </div>
        </section>

        {/* code */}
        <section aria-labelledby="h-code" className="ctp-sec">
          <div className="ctp-sec-head">
            <div className="ctp-eyebrow">Implementation</div>
            <h2 id="h-code">Code that matches this plan</h2>
            <p>Generated from your choices above. Replace the IDs in capitals with your own. Currency is set to {m.currency} for {m.name}.</p>
          </div>
          <div className="ctp-seg" role="tablist">
            {tabs.map((t, i) => <button key={t.n} type="button" role="tab" aria-selected={t === tab} aria-pressed={t === tab} onClick={() => setCodeTab(i)}>{t.n}</button>)}
          </div>
          <div className="ctp-codebox">
            <div className="ctp-codebar">
              <span>{tab.f}</span>
              <span className="ctp-codebar-actions">
                <button type="button" className="ctp-copy" onClick={() => download(tab.f, code, "text/plain")}>Download</button>
                <button type="button" className="ctp-copy" onClick={() => { track("code_copy", { snippet: tab.f, site_type: S.type }); copy("code", code); }}>{label("code", "Copy code")}</button>
              </span>
            </div>
            <pre dangerouslySetInnerHTML={{ __html: highlight(code) }} />
          </div>
        </section>

        {/* hash lab */}
        <section aria-labelledby="h-lab" className="ctp-sec">
          <div className="ctp-sec-head">
            <div className="ctp-eyebrow">Hash lab</div>
            <h2 id="h-lab">See exactly what an ad platform receives</h2>
            <p>Type a sample email or phone number. It&apos;s normalised and hashed with SHA-256 right here in your browser, using each platform&apos;s own rules. Nothing leaves this page.</p>
          </div>
          <HashLab S={S} />
        </section>

        {/* cta */}
        <section className="ctp-cta" aria-labelledby="h-cta">
          <div>
            <h2 id="h-cta">Want this plan built and audited on your own site?</h2>
            <p>I&apos;ll check what your site sends today, find the leaks, and implement the plan in GTM and GA4. Two years of live delivery on sensitive production data.</p>
          </div>
          <div className="ctp-cta-actions">
            <a className="ctp-btn" href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Tracking plan for my ${TYPES[S.type].label} site`)}&body=${encodeURIComponent(`Hi Megha,\n\nI used The Clean Tracking Plan and would like help implementing it.\n\nMy plan: ${shareURL()}\n`)}`}
              onClick={() => track("builder_cta_click", { site_type: S.type, market: S.mkt })}>Book a 20-min call</a>
            <div className="ctp-mail">or email <code>{EMAIL}</code> <button type="button" className="ctp-mini" onClick={() => { track("email_copy"); copy("mail", EMAIL); }}>{label("mail")}</button></div>
          </div>
        </section>

        <footer className="ctp-footer">
          <span>© 2026 Megha Karnwal · The Clean Tracking Plan</span>
          <span>Practitioner guidance, not legal advice. Confirm consent rules for your markets with counsel.</span>
        </footer>
      </div>
    </div>
  );
}
