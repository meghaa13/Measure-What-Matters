import "./tool-about.css";

// Plain-text explanation under each tool. Server component: the words are in the page HTML,
// so search engines can read them (the tools themselves run in the browser).
// Props: heading, intro, steps [{ t, d }], faqs [{ q, a }], related [{ href, label }].
export default function ToolAbout({ heading, intro, steps = [], faqs = [], related = [] }) {
  return (
    <section className="ta" aria-labelledby="ta-h">
      <div className="ta-wrap">
        <h2 id="ta-h">{heading}</h2>
        <p className="ta-intro">{intro}</p>
        {steps.length > 0 && (
          <ol className="ta-steps">
            {steps.map((s) => (
              <li key={s.t}><strong>{s.t}.</strong> {s.d}</li>
            ))}
          </ol>
        )}
        {faqs.length > 0 && (
          <div className="ta-faq">
            <h3>Common questions</h3>
            {faqs.map((f) => (
              <div key={f.q}>
                <h4>{f.q}</h4>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        )}
        {related.length > 0 && (
          <p className="ta-related">
            Related reading:{" "}
            {related.map((r, i) => (
              <span key={r.href}>{i ? " · " : ""}<a href={r.href}>{r.label}</a></span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
