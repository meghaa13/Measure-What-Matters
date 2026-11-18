// Blog post page. Server component: no client JavaScript of its own.
import SiteChrome from "../../SiteChrome";
import { postSeo } from "../../lib/seo";
import { EMAIL, LINKEDIN, CTA, bookHref, bookTarget } from "../../lib/site";
import { SITE_URL, post, disclaimer, lead, timeline, shot, sections, sources, disclosure, related } from "./post-data";
import "./blog.css";

const url = `${SITE_URL}/blog/${post.slug}`;

export function generateMetadata() {
  const { title, description } = postSeo(post);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.lastChecked,
      authors: [post.author],
      images: [{ url: `${SITE_URL}${post.shareImage}`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description },
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
    <> Source: {list.map((n, i) => <span key={n}>{i ? ", " : ""}<a href={`#src-${n}`}>[{n}]</a></span>)}.</>
  );

// Dates timeline. Real HTML text (not an image) so it stays readable on a phone and for screen readers.
// Solid marker = reported on the case page and by an outlet. Hollow marker = news outlets only, docket not checked.
function Timeline() {
  return (
    <figure className="bp-fig bp-tl">
      <div className="bp-tl-head">
        <p className="bp-tl-flag">Proposed sale</p>
        <p className="bp-tl-title">{timeline.title}</p>
        <p className="bp-tl-sub">{timeline.sub}</p>
      </div>
      <ol className="bp-tl-list">
        {timeline.rows.map((r) => (
          <li key={r.date} className={r.checked ? "" : "is-unchecked"}>
            <div className="bp-tl-when">
              <span className="bp-tl-date">{r.date}</span>
              <span className="bp-tl-time">{r.time}</span>
            </div>
            <div className="bp-tl-what">
              <span className="bp-tl-event">{r.what}</span>
              <span className="bp-tl-by">{r.by}</span>
            </div>
          </li>
        ))}
      </ol>
      <figcaption>{timeline.caption}<Cites list={timeline.cites} /></figcaption>
    </figure>
  );
}

function Block({ b }) {
  switch (b.type) {
    case "p": return <p><Inline text={b.text} /></p>;
    case "em": return <p className="bp-updated"><em><Inline text={b.text} /></em></p>;
    case "ul": return <List as="ul" items={b.items} />;
    case "ol": return <List as="ol" items={b.items} />;
    case "steps": return <ol className="bp-steps">{b.items.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ol>;
    case "rule": return <blockquote className="bp-rule"><ol>{b.items.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ol></blockquote>;
    case "table":
      return (
        <div className="bp-table-wrap" role="region" aria-label="Dates as reported" tabIndex={0}>
          <table className="bp-table">
            <thead><tr>{b.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} data-label={b.head[j]}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case "timeline": return <Timeline />;
    case "shot":
      return (
        <figure className="bp-fig bp-shot">
          <a href={shot.src} target="_blank" rel="noopener noreferrer" aria-label="Open the screenshot at full size"><img src={shot.src} width={shot.width} height={shot.height} alt={shot.alt} loading="lazy" decoding="async" /></a>
          <figcaption>{shot.caption} <a href="#src-5">[5]</a></figcaption>
          <details className="bp-trans">
            <summary>Verbatim transcription of the screenshot</summary>
            {shot.transcript.map((t, i) => <p key={i}>{t}</p>)}
            <p><a href={shot.txt}>Full transcription as a text file</a></p>
          </details>
        </figure>
      );
    case "callout":
      return (
        // Own class names (bp-note*) on purpose: globals.css already defines .read and .tag.
        <aside className={`bp-note bp-note-${b.kind}`} aria-label={b.title}>
          <p className="bp-note-label">{b.title}</p>
          {b.paragraphs.map((t, i) => <p key={i}><Inline text={t} /></p>)}
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
                <h1>{post.titleA} <em>{post.titleB}</em></h1>
                <p className="bp-stand">{post.description}</p>
              </div>
              {/* Illustration, not data and not a screenshot: the message lines are blank bars, no invented chat text.
                  The tag only repeats facts from the article (proposed, not sold, 2 million+ minor accounts reported). */}
              <div className="bp-lot" role="img" aria-label="Illustration: a chat window with blank message lines and a lot tag attached reading Lot, chat content, proposed sale, nothing sold. Reported to include more than 2 million accounts of minors.">
                <div className="bp-chat" aria-hidden="true">
                  <div className="bp-chat-bar"><i /><i /><i /><span>chat</span></div>
                  <div className="bp-chat-body">
                    <div className="bp-msg in"><b /><b /></div>
                    <div className="bp-msg out"><b /><b /><b /></div>
                    <div className="bp-msg in"><b /></div>
                    <div className="bp-msg out"><b /><b /></div>
                    <div className="bp-msg in"><b /><b /><b /></div>
                  </div>
                </div>
                <div className="bp-tagcard" aria-hidden="true">
                  <span className="bp-tagcard-hole" />
                  <p className="bp-tagcard-k">Lot</p>
                  <p className="bp-tagcard-t">Chat content</p>
                  <p className="bp-tagcard-s">Proposed sale</p>
                  <p className="bp-tagcard-n">Nothing sold</p>
                  <p className="bp-tagcard-m">Reported: 2 million+ minor accounts</p>
                </div>
              </div>

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
                <p>Checked <time dateTime={post.lastChecked}>{longDate(post.lastChecked)}</time> against {sources.length} linked sources. None is the court docket.</p>
                <p>Parts marked <b>My view</b> are opinion.</p>
                <a href={correction}>Report a correction</a>
              </div>
            </aside>

            <div className="bp-main">
              <aside className="bp-disclaimer" aria-label="Not legal advice"><p>{disclaimer}</p></aside>
              <section className="bp-lead" aria-label="Summary">
                <p className="bp-eyebrow">The short version</p>
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
                        {s.outlet}, <time dateTime={s.date}>{s.dateLabel}</time>
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
              <h2>Check your AI tools against items 1 to 4</h2>
              <p>Send me what you find, or ask me to look at how a vendor&apos;s terms read against your setup. Not legal advice.</p>
            </div>
            <div className="bp-cta-btns">
              <a className="btn btn-primary" href={`mailto:${EMAIL}?subject=${encodeURIComponent("AI vendor terms checklist")}`}>Email me</a>
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
