"use client";
import { useState } from "react";
import CountUp from "./CountUp";
import { toolEvent, TOOLS } from "../../lib/analytics";

// Tag rows grouped by what they do.
const GROUPS = [
  ["Analytics", (t) => /GA4|Google tag|Universal Analytics/.test(t.type) && !/^AW-/.test(t.what)],
  ["Advertising", (t) => /Google Ads|Conversion Linker|Floodlight|Pixel|Insight|UET|X \(Twitter\)|Pinterest|Reddit|Snap/.test(t.type) || /^AW-/.test(t.what)],
  ["Behaviour & UX", (t) => /Clarity|Hotjar/.test(t.type)],
  ["Consent", (t) => /Consent/.test(t.type)],
  ["Listeners", (t) => /listener/.test(t.type)],
  ["Other", (t) => !t.pausedInGtm],
  ["Paused tags", () => true],
];
const PREVIEW = 4; // tags shown per category before "Show all"

const STATUS = { tracked: ["ok", "Tracked"], not_tracked: ["bad", "Not tracked"], unclear: ["warn", "Unclear"] };

function Params({ list }) {
  const [open, setOpen] = useState(false);
  if (!list.length) return <span className="muted">No extra parameters</span>;
  const shown = open ? list : list.slice(0, 5);
  return (
    <span className="params">
      {shown.map((p) => <code key={p}>{p}</code>)}
      {list.length > 5 && <button type="button" onClick={() => setOpen(!open)}>{open ? "less" : `+${list.length - 5} more`}</button>}
    </span>
  );
}

export function Coverage({ rows }) {
  if (!rows?.length) return null;
  const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});
  return (
    <section className="ths-block">
      <div className="ths-h2row">
        <h2>What&apos;s tracked, and what isn&apos;t</h2>
        <span className="ths-legend">
          <span className="pill ok">{counts.tracked || 0} tracked</span>
          <span className="pill bad">{counts.not_tracked || 0} not tracked</span>
          <span className="pill warn">{counts.unclear || 0} unclear</span>
        </span>
      </div>
      <p className="ths-sub">Things a visitor can do on the homepage, checked against the tag setup.</p>
      <div className="ths-cov">
        {rows.map((r) => (
          <div key={r.item} className={`row ${r.status}`}>
            <span className={`pill ${STATUS[r.status][0]}`}>{STATUS[r.status][1]}</span>
            <b>{r.item}</b>
            <span className="found">{r.found}</span>
            <span className="how">{r.how}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Inventory({ inventory }) {
  const { gtm = [], ga4 = [] } = inventory || {};
  if (!gtm.length && !ga4.length) return null;
  const allTags = gtm.flatMap((m) => m.tags);
  const totals = [
    ["Tags", allTags.length],
    ["GA4 events", allTags.filter((t) => t.fn === "__gaawe").length + ga4.reduce((n, g) => n + g.created.length, 0)],
    ["Key events", new Set(ga4.flatMap((g) => g.keyEvents)).size],
    ["Ads conversions", allTags.filter((t) => t.fn === "__awct").length],
    ["dataLayer events", new Set(gtm.flatMap((m) => m.dlEvents)).size],
  ];

  return (
    <section className="ths-block">
      <div className="ths-h2row"><h2>What this site tracks</h2></div>
      <div className="ths-totals">{totals.map(([k, v]) => <div key={k}><b><CountUp to={v} /></b><span>{k}</span></div>)}</div>

      {ga4.map((g) => (
        <div key={g.id} className="ths-card">
          <div className="card-head"><span className="label">GA4 PROPERTY</span><b>{g.id}</b></div>
          <dl>
            <dt>Collected automatically</dt>
            <dd>{g.enhanced.length ? g.enhanced.map((e) => <span key={e} className="chip">{e}</span>) : <span className="muted">Enhanced measurement is off</span>}</dd>
            <dt>Key events (conversions)</dt>
            <dd>{g.keyEvents.length ? g.keyEvents.map((e) => <code key={e}>{e}</code>) : <span className="muted">None marked</span>}</dd>
            {g.created.length > 0 && <>
              <dt>Events created in GA4</dt>
              <dd className="stack">{g.created.map((c) => <span key={c.name + c.when}><code>{c.name}</code>{c.key && <em> key event</em>} <span className="muted">when {c.when}</span></span>)}</dd>
            </>}
            <dt>Google signals</dt><dd>{g.signals === "ENABLED" ? "On" : g.signals ? "Off" : "Not set"}</dd>
            <dt>Internal-traffic rules</dt><dd>{g.internalFilters || "None"}</dd>
            {g.crossDomain.length > 0 && <><dt>Cross-domain linking</dt><dd>{g.crossDomain.join(", ")}</dd></>}
            <dt>Automatic personal-data collection</dt>
            <dd>{g.piiAuto ? `On (${g.piiFields.join(", ") || "user-provided data"})${g.redactEmail === false ? ", email redaction off" : ""}` : "Off"}</dd>
          </dl>
        </div>
      ))}

      {gtm.map((m) => (
        <div key={m.id} className="ths-card">
          <div className="card-head"><span className="label">GTM CONTAINER</span><b>{m.id}</b>{m.version && <span className="muted">version {m.version}</span>}</div>
          <TagTable tags={m.tags} />
          {m.dlEvents.length > 0 && (
            <div className="ths-sub-block">
              <span className="label">DATALAYER EVENTS THE SITE PUSHES</span>
              <div className="chips">{m.dlEvents.map((e) => <code key={e}>{e.replace(/\s+\(pattern\)/, "")}</code>)}</div>
            </div>
          )}
          {m.dlVars.length > 0 && (
            <div className="ths-sub-block">
              <span className="label">DATALAYER KEYS READ ({m.dlVars.length})</span>
              <Params list={m.dlVars} />
              {m.piiVars.length > 0 && <p className="ths-warn">Reads keys that look like personal data: {m.piiVars.map((v) => <code key={v}>{v}</code>)}. Fine if they only feed hashed enhanced conversions; worth verifying.</p>}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

function Tag({ t }) {
  return (
    <div className={`tag${t.paused ? " paused" : ""}`}>
      <div className="t-head">
        <b>{t.type}</b>
        {t.what && <code>{t.what}</code>}
        {t.enhanced && <span className="pill info">enhanced conversions</span>}
        {t.consent.length > 0 && <span className="pill ok">consent: {t.consent.join(", ")}</span>}
        {t.pausedInGtm ? <span className="pill warn">paused in GTM</span> : t.paused && <span className="pill warn">no trigger · not firing</span>}
      </div>
      {t.fires.length > 0 && <div className="t-row"><span className="k">{t.pausedInGtm ? "Would fire" : "Fires on"}</span><span>{t.fires.join(" OR ")}</span></div>}
      {t.blockedBy.length > 0 && <div className="t-row"><span className="k">Blocked when</span><span>{t.blockedBy.join(" OR ")}</span></div>}
      {(t.params.length > 0 || t.fn === "__gaawe") && <div className="t-row"><span className="k">Sends</span><Params list={t.params} /></div>}
    </div>
  );
}

// One category: first few tags, then "Show all N … tags" / "Show fewer".
function TagGroup({ name, list }) {
  const paused = name === "Paused tags";
  const [open, setOpen] = useState(false);
  const limit = paused ? 0 : PREVIEW;
  const shown = open ? list : list.slice(0, limit);
  const noun = name === "Other" ? "other" : name.replace(" tags", "").toLowerCase();
  return (
    <div className={`group${paused ? " is-paused" : ""}`}>
      <div className="g-head">
        <span className="label">{name.toUpperCase()} · {list.length}</span>
        {paused && <span className="g-note">Switched off in GTM. They don&apos;t fire.</span>}
      </div>
      {shown.map((t, i) => <Tag key={i} t={t} />)}
      {list.length > limit && (
        <button type="button" className="g-more" aria-expanded={open} onClick={() => { if (!open) toolEvent(TOOLS.scan, "action", { action: "expand_tag_group", group: name }); setOpen(!open); }}>
          {open ? "Show fewer" : paused ? `Show ${list.length} paused tag${list.length > 1 ? "s" : ""}` : `Show all ${list.length} ${noun} tags`}
          <span aria-hidden="true">{open ? "↑" : "↓"}</span>
        </button>
      )}
    </div>
  );
}

function TagTable({ tags }) {
  const assigned = new Set();
  const grouped = GROUPS.map(([g, test]) => [g, tags.filter((t, i) => { if (assigned.has(i) || !test(t)) return false; assigned.add(i); return true; })]).filter(([, l]) => l.length);
  return (
    <div className="ths-tags">
      {grouped.map(([g, list]) => <TagGroup key={g} name={g} list={list} />)}
    </div>
  );
}
