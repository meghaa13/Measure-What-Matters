// Blog post page for google-agent-allow-then-measure.
// Server component. No client code and no helper on this page.
import SiteChrome from "../../SiteChrome";
import { EMAIL, LINKEDIN, CTA, bookHref, bookTarget } from "../../lib/site";
import { SITE_URL, post, heroImage, lead, sections, sources, disclosure, related } from "./post-data";
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

const Cite = ({ n }) => (
  <sup className="bp-cite"><a href={`#src-${n}`} aria-label={`Source ${n}`}>[{n}]</a></sup>
);

// "[1]" -> link to source 1; "{{text|url}}" -> external link. Anything else is plain text.
function Inline({ text }) {
  return text.split(/(\[\d\]|\{\{[^}]+\}\}|`[^`]+`)/g).map((part, i) => {
    const cite = part.match(/^\[(\d)\]$/);
    if (cite) return <Cite key={i} n={cite[1]} />;
    const code = part.match(/^`([^`]+)`$/);
    if (code) return <code key={i}>{code[1]}</code>;
    const link = part.match(/^\{\{([^|]+)\|([^}]+)\}\}$/);
    if (link) return <a key={i} href={link[2]} rel="noopener noreferrer">{link[1]}</a>;
    return part;
  });
}

const List = ({ as: Tag, items }) => (
  <Tag>{items.map((t, i) => <li key={i}><Inline text={t} /></li>)}</Tag>
);

function Table({ b }) {
  return (
    <figure className="bp-table">
      <div className="bp-scroll" tabIndex={0} role="region" aria-label={b.caption}>
        <table>
          <thead><tr>{b.head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption>{b.caption} {b.cites.map((n) => <Cite key={n} n={n} />)}</figcaption>
    </figure>
  );
}

// Flow diagram as real HTML, so it stays sharp and readable on a phone (the three checks stack under 700px).
function Flow({ b }) {
  return (
    <figure className="bp-flow">
      <div className="bp-flow-body" role="group" aria-label={b.title}>
        <p className="bp-flow-title">{b.title}</p>
        <div className="bp-flow-start">{b.start}</div>
        <span className="bp-flow-arrow" aria-hidden="true" />
        <ul className="bp-flow-checks">
          {b.checks.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
        <span className="bp-flow-arrow" aria-hidden="true" />
        <div className="bp-flow-result">{b.result}</div>
      </div>
      <figcaption>{b.caption} {b.cites.map((n) => <Cite key={n} n={n} />)}</figcaption>
    </figure>
  );
}

// Rule-order stack: the allow rule sits above the blocks it must be evaluated before.
function Stack({ b }) {
  return (
    <figure className="bp-flow bp-stack">
      <div className="bp-flow-body" role="group" aria-label={b.title}>
        <p className="bp-flow-title">{b.title}</p>
        <div className="bp-flow-result">{b.top}</div>
        <span className="bp-flow-arrow" aria-hidden="true" />
        <ul className="bp-stack-list">
          {b.below.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </div>
      <figcaption>{b.caption}{" "}{b.cites.map((n) => <Cite key={n} n={n} />)}</figcaption>
    </figure>
  );
}

function Block({ b }) {
  switch (b.type) {
    case "flow": return <Flow b={b} />;
    case "stack": return <Stack b={b} />;
    case "p": return <p><Inline text={b.text} /></p>;
    case "ul": return <List as="ul" items={b.items} />;
    case "ol": return <List as="ol" items={b.items} />;
    case "table": return <Table b={b} />;
    case "callout":
      return (
        <aside className={`bp-note bp-note-${b.kind}`} aria-label={b.title}>
          <h3>{b.title}</h3>
          {b.paragraphs.map((t, i) => <p key={i}><Inline text={t} /></p>)}
          {b.items && <List as="ul" items={b.items} />}
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
  // The part of the title after the colon is set in italic purple.
  const [titleA, titleB] = post.title.split(/(?<=:)\s+/);

  return (
    <>
      <SiteChrome home={false} current="blog" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main className="bp">
        <article>
          <header className="bp-hero" style={{ "--hero": `url(${heroImage})` }}>
            <div className="bp-wrap bp-hero-in">
              <h1>{titleA}{titleB && <> <em>{titleB}</em></>}</h1>
              <p className="bp-stand">{post.description}</p>

              <div className="bp-meta" role="group" aria-label="Article details">
                <div className="bp-stat">
                  <b>{post.headlineStat.value}</b>
                  <span>{post.headlineStat.label} {post.headlineStat.cite.map((n) => <Cite key={n} n={n} />)}</span>
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
                <p>Boxes marked My opinion are my view. The GA4 questions are untested.</p>
                <a href={correction}>Report a correction</a>
              </div>
            </aside>

            <div className="bp-main">
              <div className="bp-lead">
                <p><Inline text={lead} /></p>
              </div>

              {sections.map((s) => (
                <section key={s.id} id={s.id} className="bp-sec">
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
              <h2>Want this checked on your site?</h2>
              <p>Send me what your logs show, or ask me to review your setup.</p>
            </div>
            <div className="bp-cta-btns">
              <a className="btn btn-primary" href={`mailto:${EMAIL}?subject=${encodeURIComponent("Google-Agent on my site")}`}>Email me</a>
              <a className="btn btn-ghost" href={bookHref} target={bookTarget} rel={bookTarget ? "noopener noreferrer" : undefined}>{CTA}</a>
            </div>
          </section>

          <section className="bp-related" aria-labelledby="rel-h">
            <h2 id="rel-h">Related on this site</h2>
            <ul>
              {related.map((r) => (
                <li key={r.href}><a href={r.href}><span className="bp-rel-t">{r.title}</span><span>{r.note}</span></a></li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
