"use client";
import { useEffect, useRef, useState } from "react";

// Hero report card. Before anyone types it plays an example scan (badged EXAMPLE).
// Once the visitor types it mirrors their input, animates while scanning, then shows
// their real numbers, coverage rows and score (badged LIVE RESULT).
const DEMO = {
  host: "acme-store.com",
  totals: [["Tags", 24], ["GA4 events", 14], ["Ads conv.", 3]],
  rows: [["Form submissions", "tracked"], ["Phone links", "not_tracked"], ["Calendly bookings", "not_tracked"], ["YouTube video", "tracked"]],
  score: 62,
};
const STATUS = { tracked: ["ok", "Tracked"], not_tracked: ["bad", "Not tracked"], unclear: ["warn", "Unclear"] };

// Real numbers from a scan, in the same shape as DEMO.
function fromScan(data) {
  const gtm = data.inventory?.gtm || [], ga4 = data.inventory?.ga4 || [];
  const tags = gtm.flatMap((m) => m.tags);
  const active = tags.filter((t) => !t.pausedInGtm);
  const ga4Events = active.filter((t) => t.fn === "__gaawe").length + ga4.reduce((n, g) => n + g.created.length, 0);
  const keyEvents = new Set(ga4.flatMap((g) => g.keyEvents)).size;
  const ads = active.filter((t) => t.fn === "__awct").length;
  const totals = gtm.length
    ? [["Tags", active.length], ["GA4 events", ga4Events], ["Ads conv.", ads]]
    : [["GA4 props", ga4.length], ["Key events", keyEvents], ["Created events", ga4.reduce((n, g) => n + g.created.length, 0)]];
  // Lead with what's NOT tracked, then the rest.
  const order = { not_tracked: 0, unclear: 1, tracked: 2 };
  const rows = [...(data.coverage || [])].sort((a, b) => order[a.status] - order[b.status]).slice(0, 4).map((r) => [r.item, r.status]);
  return { host: data.host, totals, rows, score: data.score, note: data.siteNote || null };
}

function useCountUp(target, run) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!run) { setK(0); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now) => { const p = Math.min(1, (now - t0) / 900); setK(1 - Math.pow(1 - p, 3)); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return Math.round(target * k);
}

const bare = (s) => String(s || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
const same = (a, b) => bare(a) === bare(b);

export default function HeroPreview({ input = "", scanned = "", state = "idle", data = null, onSeeReport }) {
  // A finished result only applies while the box still holds the site that was scanned.
  const stale = (state === "done" || state === "needIds" || state === "error") && !same(input, scanned);
  const shown = stale ? "idle" : state;
  const live = shown !== "idle" || input.trim().length > 0;
  const result = shown === "done" && data ? fromScan(data) : null;

  // ── demo loop (only while the visitor hasn't typed anything)
  const [stage, setStage] = useState(0); // 0 typing · 1 scanning · 2 totals · 3 rows · 4 score
  const [typed, setTyped] = useState("");
  const timers = useRef([]);
  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (live) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTyped(DEMO.host); setStage(4); return; }
    let alive = true;
    const later = (fn, ms) => timers.current.push(setTimeout(() => alive && fn(), ms));
    const run = () => {
      setStage(0); setTyped("");
      for (let i = 1; i <= DEMO.host.length; i++) later(() => setTyped(DEMO.host.slice(0, i)), 80 * i);
      const t = 80 * DEMO.host.length + 300;
      later(() => setStage(1), t);
      later(() => setStage(2), t + 1300);
      later(() => setStage(3), t + 2300);
      later(() => setStage(4), t + 3400);
      later(run, t + 7800);
    };
    run();
    return () => { alive = false; timers.current.forEach(clearTimeout); };
  }, [live]);

  // What the card shows right now.
  let view, field, busy, badge;
  if (!live) {
    view = { ...DEMO, stage }; field = typed; busy = stage === 1; badge = ["EXAMPLE", "demo"];
  } else if (result) {
    view = { ...result, stage: 4 }; field = result.host; busy = false; badge = ["LIVE RESULT", "live"];
  } else if (shown === "scanning") {
    view = { ...DEMO, host: input, stage: 1, totals: DEMO.totals.map(([l]) => [l, 0]), rows: [] }; field = input.trim(); busy = true; badge = ["SCANNING", "live"];
  } else if (shown === "needIds" || shown === "error") {
    view = { ...DEMO, stage: -1, rows: [] }; field = input.trim(); busy = false; badge = ["NO TAGS READ", "warn"];
  } else {
    view = { ...DEMO, stage: 0.5, rows: [] }; field = input; busy = false; badge = ["READY TO SCAN", "live"];
  }
  const st = view.stage;
  const score = useCountUp(view.score, st >= 4);
  const tone = view.score >= 80 ? "good" : view.score >= 55 ? "mid" : "low";

  return (
    <div className={`sx-preview${result ? " is-result" : ""}`} aria-live="polite">
      <div className="bar">
        <span /><span /><span />
        <span className="url">meghakarnwal.com/apps/tag-scanner</span>
        <span className={`badge ${badge[1]}`}>{badge[0]}</span>
      </div>
      <div className="body">
        <div className="field">
          <span className="txt">{field || <i className="ph">example.com</i>}<i className="caret" style={{ opacity: (!live && st === 0) || shown === "idle" ? 1 : 0 }} /></span>
          <b className={busy ? "busy" : ""}>{busy ? "Scanning…" : "Scan"}</b>
        </div>
        <div className="sweep" style={{ opacity: busy ? 1 : 0 }} />

        {st === -1 ? (
          <div className="msg">Couldn&apos;t read tags for this site. Details are below the search box.</div>
        ) : (
          <>
            <div className="totals">
              {view.totals.map(([l, n], i) => (
                <div key={l} style={{ opacity: st >= 2 ? 1 : 0.15, transform: `translate3d(0,${st >= 2 ? 0 : 8}px,0)`, transitionDelay: `${st >= 2 ? i * 110 : 0}ms` }}>
                  <b>{st >= 2 ? n : 0}</b><span>{l}</span>
                </div>
              ))}
            </div>
            {/* Pasted IDs have no page checks to list; use the space to say what is known about the site. */}
            {result?.note && !view.rows.length && <p className="site-note" style={{ opacity: st >= 3 ? 1 : 0 }}>{result.note}</p>}
            <div className="rows" style={result?.note && !view.rows.length ? { display: "none" } : undefined}>
              {(view.rows.length ? view.rows : [["Forms", "tracked"], ["Phone links", "tracked"], ["Bookings", "tracked"], ["Video", "tracked"]]).map(([l, s], i) => (
                <div key={l + i} style={{ opacity: st >= 3 && view.rows.length ? 1 : 0, transform: `translate3d(${st >= 3 ? 0 : -10}px,0,0)`, transitionDelay: `${st >= 3 ? i * 120 : 0}ms` }}>
                  <span>{l}</span><span className={`pill ${STATUS[s][0]}`}>{STATUS[s][1]}</span>
                </div>
              ))}
            </div>
            <div className={`score ${tone}`} style={{ opacity: st >= 4 ? 1 : 0.15 }}>
              <span className="label">TRACKING HEALTH{result ? ` · ${result.host}` : ""}</span>
              <b>{st >= 4 ? score : 0}<small>/100</small></b>
              <span className="meter"><i style={{ transform: `scaleX(${st >= 4 ? score / 100 : 0})` }} /></span>
            </div>
            {result && onSeeReport && <button type="button" className="see" onClick={onSeeReport}>See the full report ↓</button>}
          </>
        )}
      </div>
    </div>
  );
}
