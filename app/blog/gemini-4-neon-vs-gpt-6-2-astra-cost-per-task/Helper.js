"use client";
// Cost per successful task, Neon vs Astra. Browser only: no fetches, no AI, nothing stored.
// Typed values are never sent to analytics; only start / complete / action events.
import { useState, useRef, useEffect } from "react";
import { toolEvent } from "../../lib/analytics";
import "./helper.css";

const TOOL = "cost_per_task_neon_astra";
const PRICE_DATE = "20 Nov 2026";
const LONG_STEP = 272000; // Astra: above this many input tokens, the whole request uses long rates
const ASTRA_LONG = { input: 16, cached: 0.8, output: 60 };

const MODELS = {
  neon: { name: "Gemini 4 Neon", inputLimit: 1000000, limitLabel: "1,000,000 (context figure)", outputLimit: null },
  astra: { name: "GPT-6.2 Astra", inputLimit: 922000, limitLabel: "922,000", outputLimit: 128000 },
};

const DEFAULTS = {
  tasks: "1000",
  neon: { fresh: "20000", cached: "0", output: "2000", success: "100", pIn: "3", pCached: "0.15", pOut: "15" },
  astra: { fresh: "20000", cached: "0", output: "2000", success: "100", pIn: "8", pCached: "0.40", pOut: "40" },
};

const FIELDS = [
  ["fresh", "Fresh input tokens per attempt", "tokens"],
  ["cached", "Cached input tokens per attempt", "tokens"],
  ["output", "Output tokens per attempt", "tokens"],
  ["success", "Success rate per attempt", "%"],
  ["pIn", "Input price", "USD per 1M"],
  ["pCached", "Cached input price", "USD per 1M"],
  ["pOut", "Output price", "USD per 1M"],
];

// Plain number from text: allows commas, rejects anything else. null = empty, NaN = invalid.
function num(s) {
  const t = String(s).trim().replace(/,/g, "");
  if (t === "") return null;
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  const v = Number(t);
  return Number.isFinite(v) ? v : NaN;
}
const MAX_TOKENS = 1e9; // per field; far above any model limit
const MAX_PRICE = 1e6; // USD per 1M tokens
const int = (n) => Math.round(n).toLocaleString("en-US");
const usd = (n) => {
  if (n === 0) return "$0.00";
  const d = Math.abs(n) < 0.01 ? 6 : Math.abs(n) < 1 ? 4 : 2;
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: d });
};
const pct = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 1 }) + "%";

// One model: validate, then cost per attempt / per successful task.
export function modelCost(key, v) {
  const m = MODELS[key];
  const errors = {};
  const n = {};
  for (const [f] of FIELDS) n[f] = num(v[f]);
  for (const f of ["fresh", "cached", "output"]) {
    if (n[f] === null) n[f] = 0;
    else if (Number.isNaN(n[f]) || n[f] > MAX_TOKENS) errors[f] = "Enter a number from 0 to 1,000,000,000";
  }
  if (n.success === null || Number.isNaN(n.success) || n.success < 1 || n.success > 100) errors.success = "Enter a rate from 1 to 100";
  for (const f of ["pIn", "pOut"]) if (n[f] === null || Number.isNaN(n[f]) || n[f] > MAX_PRICE) errors[f] = "Enter a price from 0 to 1,000,000";
  let cachedBlank = false;
  if (n.pCached === null) { cachedBlank = true; n.pCached = 0; }
  else if (Number.isNaN(n.pCached) || n.pCached > MAX_PRICE) errors.pCached = "Enter a price from 0 to 1,000,000, or leave blank";
  if (Object.keys(errors).length === 0) {
    const input = n.fresh + n.cached;
    if (input + n.output === 0) errors._all = "Enter at least one token count";
    if (input > m.inputLimit) errors.fresh = `Fresh plus cached input is ${int(input)}; the limit is ${m.limitLabel}`;
    if (m.outputLimit && n.output > m.outputLimit) errors.output = `Output limit is ${int(m.outputLimit)} tokens`;
  }
  if (Object.keys(errors).length) return { errors };
  const input = n.fresh + n.cached;
  const longStep = key === "astra" && input > LONG_STEP;
  const p = longStep ? { in: ASTRA_LONG.input, cached: ASTRA_LONG.cached, out: ASTRA_LONG.output } : { in: n.pIn, cached: n.pCached, out: n.pOut };
  const attempt = (n.fresh * p.in + n.cached * p.cached + n.output * p.out) / 1e6;
  const s = n.success / 100;
  return { n, p, longStep, cachedUnpriced: cachedBlank && n.cached > 0 && !longStep, attempt, s, perTask: attempt / s };
}

export function compare(state) {
  const N = modelCost("neon", state.neon);
  const A = modelCost("astra", state.astra);
  const tasks = num(state.tasks);
  const tasksErr = tasks === null || Number.isNaN(tasks) || tasks < 1 || tasks > 1e7 || !Number.isInteger(tasks) ? "Enter a whole number from 1 to 10,000,000" : null;
  if (N.errors || A.errors || tasksErr) return { N, A, tasksErr, ok: false };
  if (![N.perTask, A.perTask, N.attempt, A.attempt].every(Number.isFinite)) return { N, A, tasksErr: "Numbers too large to work out", ok: false };
  const cheaper = N.perTask === A.perTask ? null : N.perTask < A.perTask ? "neon" : "astra";
  // Break-even: c_N / s_N = c_A / s_A  =>  s_N* = s_A x c_N / c_A
  const be = A.attempt > 0 ? (A.s * N.attempt / A.attempt) * 100 : null;
  return { N, A, tasks, cheaper, be, ok: true };
}

function ModelFields({ id, label, values, errors, onChange }) {
  return (
    <fieldset className="cph-model">
      <legend>{label}</legend>
      {errors?._all && <p className="cph-err" role="alert">{errors._all}</p>}
      {FIELDS.map(([f, text, unit]) => {
        const fid = `cph-${id}-${f}`;
        const err = errors?.[f];
        return (
          <div className="cph-field" key={f}>
            <label htmlFor={fid}>{text} <span className="cph-unit">({unit})</span></label>
            <input id={fid} type="text" inputMode="decimal" autoComplete="off" value={values[f]}
              aria-invalid={err ? "true" : undefined} aria-describedby={err ? `${fid}-e` : undefined}
              onChange={(e) => onChange(id, f, e.target.value)} />
            {err && <p className="cph-err" id={`${fid}-e`} role="alert">{err}</p>}
          </div>
        );
      })}
    </fieldset>
  );
}

function ModelResult({ name, r, win }) {
  return (
    <div className={"cph-res" + (win ? " cph-win" : "")}>
      <h4>{name}{win && <span className="cph-tag">cheaper per successful task</span>}</h4>
      <dl>
        <div><dt>Cost per attempt</dt><dd>{usd(r.attempt)}</dd></div>
        <div><dt>Cost per successful task</dt><dd className="cph-big">{usd(r.perTask)}</dd></div>
      </dl>
      {r.longStep && <p className="cph-note">Over 272,000 input tokens: long-request rates ($16 / $0.80 / $60, fixed) used for the whole request.</p>}
      {r.cachedUnpriced && <p className="cph-note">Cached price is blank, so cached tokens are left unpriced (counted as $0).</p>}
    </div>
  );
}

const line = (m, r) =>
  `${m.name}: (${int(r.n.fresh)} x $${r.p.in} + ${int(r.n.cached)} x $${r.p.cached} + ${int(r.n.output)} x $${r.p.out}) / 1,000,000 = ${usd(r.attempt)} per attempt; / ${r.n.success}% = ${usd(r.perTask)} per successful task.`;

export default function Helper() {
  const [st, setSt] = useState(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const completed = useRef(false);
  const res = compare(st);

  // complete: only after the reader has edited something (started is set by an edit) and a valid result shows.
  useEffect(() => {
    if (res.ok && started.current && !completed.current) { completed.current = true; toolEvent(TOOL, "complete"); }
  }, [res.ok, st]);

  const first = () => { if (!started.current) { started.current = true; toolEvent(TOOL, "start"); } };
  const setModel = (id, f, v) => { first(); setSt((s) => ({ ...s, [id]: { ...s[id], [f]: v } })); };
  const setTasks = (v) => { first(); setSt((s) => ({ ...s, tasks: v })); };
  const reset = () => { toolEvent(TOOL, "action", { action: "reset" }); setSt(DEFAULTS); completed.current = false; started.current = false; };

  let summary = "";
  let diff = 0;
  if (res.ok) {
    const { N, A, tasks, cheaper } = res;
    diff = Math.abs(N.perTask - A.perTask);
    summary = `Cost per successful task (model-call cost only, prices as of ${PRICE_DATE}): Neon ${usd(N.perTask)}, Astra ${usd(A.perTask)}. Monthly for ${int(tasks)} tasks: Neon ${usd(N.perTask * tasks)}, Astra ${usd(A.perTask * tasks)}.` +
      (cheaper ? ` ${MODELS[cheaper].name} is cheaper.` : " They cost the same.");
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      toolEvent(TOOL, "action", { action: "copy" });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  return (
    <section className="cph" aria-labelledby="cph-title">
      <h3 id="cph-title">Cost per successful task, Neon vs Astra</h3>
      <p className="cph-intro">Enter your own numbers for each model. Everything is worked out in your browser; nothing is sent or saved. Token counts are examples until you replace them.</p>

      <div className="cph-field cph-tasks">
        <label htmlFor="cph-tasks">Tasks per month <span className="cph-unit">(count)</span></label>
        <input id="cph-tasks" type="text" inputMode="numeric" autoComplete="off" value={st.tasks}
          aria-invalid={res.tasksErr ? "true" : undefined} aria-describedby={res.tasksErr ? "cph-tasks-e" : undefined} onChange={(e) => setTasks(e.target.value)} />
        {res.tasksErr && <p className="cph-err" id="cph-tasks-e" role="alert">{res.tasksErr}</p>}
      </div>

      <div className="cph-grid">
        <ModelFields id="neon" label={MODELS.neon.name} values={st.neon} errors={res.N.errors} onChange={setModel} />
        <ModelFields id="astra" label={MODELS.astra.name} values={st.astra} errors={res.A.errors} onChange={setModel} />
      </div>
      <p className="cph-asof">Prices as of {PRICE_DATE}, vendor-reported: Google (18 Nov 2026) for Neon; OpenAI pricing page (undated) for Astra. Editable, so change them if the vendors do.</p>

      <div className="cph-out">
        {!res.ok && <p className="cph-empty">Fix the highlighted fields to see a result.</p>}
        {res.ok && (
          <>
            <div className="cph-results">
              <ModelResult name={MODELS.neon.name} r={res.N} win={res.cheaper === "neon"} />
              <ModelResult name={MODELS.astra.name} r={res.A} win={res.cheaper === "astra"} />
            </div>
            <p className="cph-verdict" role="status">
              {res.cheaper
                ? `${MODELS[res.cheaper].name} costs ${usd(diff)} less per successful task, ${usd(diff * res.tasks)} less a month at ${int(res.tasks)} tasks.`
                : "Both cost the same per successful task."}
            </p>
            <p className="cph-be">
              {res.be === null
                ? "Break-even needs Astra's cost per attempt to be above $0."
                : res.be >= 1 && res.be <= 100
                  ? `Break-even: at your Astra success rate of ${pct(res.A.s * 100)}, Neon matches Astra's cost per successful task at a Neon success rate of ${pct(res.be)}.`
                  : `No Neon success rate from 1% to 100% makes the two equal at your Astra success rate (it would need ${pct(res.be)}). ${MODELS[res.cheaper || "neon"].name} is cheaper across that range.`}
            </p>
          </>
        )}
        <div className="cph-actions">
          {res.ok && <button type="button" onClick={copy}>{copied ? "Copied" : "Copy result"}</button>}
          <button type="button" onClick={reset}>Reset to examples</button>
        </div>
      </div>

      <details className="cph-method">
        <summary>How this is worked out</summary>
        <p>This is our own definition, not a vendor or industry standard. It covers model-call cost only: no retrieval, infrastructure or human rework. It follows the divide-by-successes principle in the <a href="https://wavect.io/blog/llm-cost-calculator-2026/" rel="noopener noreferrer">wavect.io guide</a> (principle only; the formula is ours).</p>
        <ul>
          <li>Cost per attempt = (fresh x input price + cached x cached price + output x output price) / 1,000,000, using each model&apos;s own token counts.</li>
          <li>Cost per successful task = cost per attempt / success rate. A failed attempt is retried until it passes, so attempts per task = 1 / success rate.</li>
          <li>Monthly cost = cost per successful task x tasks per month.</li>
          <li>Break-even: the models cost the same when c_N / s_N = c_A / s_A, so the Neon success rate that matches Astra is s_A x c_N / c_A.</li>
          <li>Astra above 272,000 input tokens (fresh plus cached; OpenAI writes "272K", read here as exactly 272,000) is priced at $16.00 input, $0.80 cached and $60.00 output per 1M for the whole request. These rates are fixed, not editable. Source: <a href="https://developers.openai.com/api/docs/pricing" rel="noopener noreferrer">OpenAI pricing page</a>. Google&apos;s Neon page shows no such step (none found, not proven absent).</li>
          <li>Input checks: fresh plus cached must not exceed 1,000,000 for Neon (the context figure; Google&apos;s separate input limit is not sourced) or 922,000 for Astra (<a href="https://developers.openai.com/api/docs/models/gpt-6.2-astra" rel="noopener noreferrer">OpenAI model page</a>). Astra output is capped at 128,000.</li>
        </ul>
        {res.ok && (
          <div className="cph-lines">
            <p>Your arithmetic:</p>
            <p>{line(MODELS.neon, res.N)}</p>
            <p>{line(MODELS.astra, res.A)}</p>
          </div>
        )}
      </details>
    </section>
  );
}
