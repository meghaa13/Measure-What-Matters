// Blog post page. Place at site/app/blog/ai-agent-traffic-how-much-to-plan-for/page.js
// with post-data.js and blog.css beside it. Server component: no client JavaScript of its own.
import SiteChrome from "../../SiteChrome";
import { EMAIL, LINKEDIN, CTA, bookHref, bookTarget } from "../../lib/site";
import { cardsFor } from "./figure-cards";
import { SITE_URL, post, heroCrowd, methodFig, shot, sections, lead, sources, alsoCovered, disclosure, related } from "./post-data";
import "./blog.css";

const url = `${SITE_URL}/blog/${post.slug}`;

export function generateMetadata() {
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.lastChecked,
      authors: [post.author],
      images: [{ url: `${SITE_URL}${post.shareImage}`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

const longDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// "[1]" -> link to source 1; "**x**" -> <strong>; "`x`" -> <code>. Anything else is plain text.
function Inline({ text }) {
  return text.split(/(\[\d\]|\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    const cite = part.match(/^\[(\d)\]$/);
    if (cite) {
      const n = cite[1];
      return (
        <sup key={i} className="bp-cite">
          <a href={`#src-${n}`} aria-label={`Source ${n}`}>[{n}]</a>
        </sup>
      );
    }
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    return part;
  });
}

const List = ({ as: Tag, items }) => (
  <Tag>{items.map((t, i) => <li key={i}><Inline text={t} /></li>)}</Tag>
);

const Cites = ({ list }) =>
  list.length > 0 && (
    <> Sources: {list.map((n, i) => <span key={n}>{i ? ", " : ""}<a href={`#src-${n}`}>[{n}]</a></span>)}.</>
  );

// Phone version of a figure: real HTML text (14px or more), same facts as the SVG.
function Cards({ m, alt }) {
  return (
    <div className="bp-cards" role="group" aria-label={alt}>
      <p className="bp-cards-eyebrow">{m.eyebrow}</p>
      <p className="bp-cards-h">{m.heading}</p>
      {m.lead && (
        <div className="bp-cards-lead">
          <b>{m.lead.title}</b>
          <span>{m.lead.text}</span>
        </div>
      )}
      {m.leadNote && <p className="bp-cards-sub">{m.leadNote}</p>}
      <ul className="bp-cards-list">
        {m.cards.map((c, i) => (
          <li key={i} className={`bp-card${c.tone ? ` bp-card-${c.tone}` : ""}`}>
            {c.label && <span className="bp-card-label">{c.label}</span>}
            {c.title && <b>{c.title}</b>}
            {c.text && <span className="bp-card-text">{c.text}</span>}
            {c.items && <ul>{c.items.map((t, j) => <li key={j}>{t}</li>)}</ul>}
            {c.weak && <span className="bp-card-weak"><em>Weakness</em> {c.weak}</span>}
            {c.foot && <span className="bp-card-foot"><Inline text={c.foot} /></span>}
          </li>
        ))}
      </ul>
      {m.chips && (
        <div className="bp-chips"><span>{m.chipsLabel}</span>{m.chips.map((c) => <b key={c}>{c}</b>)}</div>
      )}
      {m.legend && (
        <ul className="bp-legend">
          {m.legend.map((l) => <li key={l.tone}><i className={`bp-dot bp-dot-${l.tone}`} aria-hidden="true" />{l.text}</li>)}
        </ul>
      )}
      {m.note && <p className="bp-cards-note">{m.note}</p>}
    </div>
  );
}

// One figure = SVG (wide screens) + HTML cards (phones). CSS shows exactly one; display:none
// also removes the other from the accessibility tree, so screen readers get it once.
function Fig({ f, id }) {
  return (
    <figure className="bp-fig bp-wide">
      {/* Plain img: these are SVG files, which next/image would not improve. Width and height stop layout shift. */}
      <img className="bp-svg" src={f.src} width={f.width} height={f.height} alt={f.alt} loading="lazy" decoding="async" />
      <Cards m={cardsFor[id]} alt={f.alt} />
      <figcaption>{f.caption}<Cites list={f.cites} /></figcaption>
    </figure>
  );
}


// Real capture of Google's help page, unaltered. Verbatim text sits in a collapsible block.
function Shot() {
  return (
    <figure className="bp-fig bp-shot">
      <a href={shot.url} target="_blank" rel="noopener noreferrer" aria-label="Open Google's Default channel group help page">
        <img src={shot.src} width={shot.width} height={shot.height} alt={shot.alt} loading="lazy" decoding="async" />
      </a>
      <figcaption>
        <a href={shot.url} target="_blank" rel="noopener noreferrer">{shot.caption}</a> <a href="#src-5">[5]</a>
      </figcaption>
      <details className="bp-trans">
        <summary>Verbatim text from the capture</summary>
        {shot.transcript.map((t, i) => <p key={i}>{t}</p>)}
      </details>
    </figure>
  );
}

function Block({ b }) {
  switch (b.type) {
    case "p": return <p><Inline text={b.text} /></p>;
    case "ul": return <List as="ul" items={b.items} />;
    case "ol": return <List as="ol" items={b.items} />;
    case "steps": return <ol className="bp-steps">{b.items.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ol>;
    case "companies":
      // One card per company. Separate cards, no shared scale: the article does not compare them.
      return (
        <ul className="bp-cos">
          {b.items.map((c) => (
            <li key={c.name} className="bp-co">
              <div className="bp-co-head">
                <h3>{c.name}</h3>
                <span>{c.period}</span>
              </div>
              <p className="bp-co-fig">{c.figure}</p>
              <p className="bp-co-note">{c.figureNote}</p>
              <p className="bp-co-text"><Inline text={c.text} /></p>
            </li>
          ))}
        </ul>
      );
    case "shot": return <Shot />;
    case "method": return <Fig f={methodFig} id="what-ga4-can-and-cannot-see" />;
    case "callout":
      return (
        // Own class names (bp-note*) on purpose: globals.css already defines .read and .tag
        // as a two-column grid, which squashed the first version of this box.
        <aside className={`bp-note bp-note-${b.kind}`} aria-label={b.title}>
          <p className="bp-note-label">{b.title}</p>
          {b.paragraphs.map((t, i) => <p key={i}><Inline text={t} /></p>)}
          {b.ol && <List as="ol" items={b.ol} />}
          {b.after && b.after.map((t, i) => <p key={`a${i}`}><Inline text={t} /></p>)}
        </aside>
      );
    default: return null;
  }
}

export default function PostPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `${SITE_URL}${post.shareImage}`,
    datePublished: post.publishedAt,
    dateModified: post.lastChecked,
    author: { "@type": "Person", name: post.author, url: SITE_URL, sameAs: [LINKEDIN] },
    publisher: { "@type": "Person", name: post.author, url: SITE_URL, sameAs: [LINKEDIN] },
    mainEntityOfPage: url,
    citation: sources.map((s) => s.url),
  };
  const correction = `mailto:${EMAIL}?subject=${encodeURIComponent(`Correction: ${post.title}`)}`;
  // The part after the colon is set in italic purple.
  const [titleA, titleB] = post.title.split(/(?<=:)\s+/);

  return (
    <>
      <SiteChrome home={false} current="blog" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main className="bp">
        <article>
          <header className="bp-hero">
            <div className="bp-wrap bp-hero-in">
              <div className="bp-hero-text">
                <div className="bp-tag">{post.category}</div>
                <h1>{titleA}{titleB && <> <em>{titleB}</em></>}</h1>
                <p className="bp-stand">{post.description}</p>
              </div>
              {/* Illustration only, not a data chart: a crowd of human-visit dots and four highlighted dots. */}
              <figure className="bp-crowd">
                <img src={heroCrowd} width={400} height={300} alt="Illustration, not a data chart: a large crowd of small dots standing for human visits, with four dots highlighted for Uber's 4 agent trips." />
                <figcaption><i className="bp-crowd-key" aria-hidden="true" /> Uber's 4 agent trips in Halloween week. The other dots stand for human visits. Illustration only: not drawn to scale and not a data chart.</figcaption>
              </figure>

              <div className="bp-meta" role="group" aria-label="Article details">
                <div className="bp-stat">
                  <b>{post.headlineStat.value}</b>
                  <span>{post.headlineStat.label} <sup className="bp-cite"><a href={`#src-${post.headlineStat.cite}`}>[{post.headlineStat.cite}]</a></sup></span>
                </div>
                <dl className="bp-facts">
                  <div><dt>By</dt><dd><a href="/">{post.author}</a></dd></div>
                  <div><dt>Published</dt><dd><time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time></dd></div>
                  <div><dt>Last checked</dt><dd><time dateTime={post.lastChecked}>{longDate(post.lastChecked)}</time></dd></div>
                  <div><dt>Sources</dt><dd><a href="#sources">{sources.length} linked</a></dd></div>
                  <div><dt>Read</dt><dd>{post.readMinutes} min</dd></div>
                </dl>
              </div>
              {post.updates.length > 0 && (
                <ul className="bp-updates">
                  {post.updates.map((u) => <li key={u.date}><b>Updated {longDate(u.date)}:</b> {u.note}</li>)}
                </ul>
              )}
            </div>
          </header>

          <div className="bp-wrap bp-layout">
            <aside className="bp-rail" aria-label="Article navigation and trust notes">
              <nav className="bp-toc" aria-label="In this article">
                <p className="bp-rail-h">On this page</p>
                <ol>
                  {sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.heading}</a></li>)}
                  <li><a href="#sources">Sources</a></li>
                  <li><a href="#made">How this was made</a></li>
                </ol>
              </nav>
              <div className="bp-trust">
                <p className="bp-rail-h">Trust notes</p>
                <p>Checked <time dateTime={post.lastChecked}>{longDate(post.lastChecked)}</time> against {sources.length} linked sources.</p>
                <p>Parts marked <b>My view</b> are opinion.</p>
                <a href={correction}>Report a correction</a>
              </div>
            </aside>

            <div className="bp-main">
              <section className="bp-lead" aria-label="Summary">
                {lead.map((t, i) => <p key={i}><Inline text={t} /></p>)}
              </section>

              {sections.map((s) => (
                <section key={s.id} id={s.id} className={`bp-sec bp-op-${s.opener}`}>
                  <h2>{s.heading}</h2>
                  {s.blocks.map((b, i) => <Block key={i} b={b} />)}
                </section>
              ))}

              <section id="sources" className="bp-sources" aria-labelledby="sources-h">
                <h2 id="sources-h">Sources</h2>
                <ol>
                  {sources.map((s) => (
                    <li key={s.n} id={`src-${s.n}`}>
                      <a className="bp-src-title" href={s.url} rel="noopener noreferrer" target="_blank">{s.title}</a>
                      <div className="bp-src-by">
                        {s.outlet}, {s.date ? <time dateTime={s.date}>{s.dateLabel}</time> : s.dateLabel}
                      </div>
                      <p>Supports: {s.supports}</p>
                      <span className={`bp-status ${s.verified ? "ok" : "warn"}`}>{s.status}</span>
                    </li>
                  ))}
                </ol>
                <p className="bp-also">{alsoCovered}</p>
              </section>

              <section id="made" className="bp-made" aria-labelledby="made-h">
                <h2 id="made-h">{disclosure.heading}</h2>
                {disclosure.body.map((t, i) => <p key={i}>{t}</p>)}
                <a className="bp-corr" href={correction}>Report a correction</a>
              </section>
            </div>
          </div>
        </article>

        <div className="bp-wrap bp-after">
          <section className="bp-cta" aria-label="Follow up">
            <div>
              <h2>How much agent traffic does your site get?</h2>
              <p>Send me your AI Assistant row and log counts, or ask me to set up the measurement.</p>
            </div>
            <div className="bp-cta-btns">
              <a className="btn btn-primary" href={`mailto:${EMAIL}?subject=${encodeURIComponent("Agent traffic measurement")}`}>Email me</a>
              <a className="btn btn-ghost" href={bookHref} target={bookTarget} rel={bookTarget ? "noopener noreferrer" : undefined}>{CTA}</a>
            </div>
          </section>

          <section className="bp-related" aria-labelledby="rel-h">
            <h2 id="rel-h">Related on this site</h2>
            <ul>
              {related.map((r) => (
                <li key={r.href}><a href={r.href}><b>{r.title}</b><span>{r.note}</span></a></li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
