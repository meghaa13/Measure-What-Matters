// Blog post page. Lives at site/app/blog/google-says-server-side-gtm-full-ip-google-ads-2027/page.js
// with post-data.js and blog.css beside it. Server component: no client JavaScript of its own.
import SiteChrome from "../../SiteChrome";
import { postSeo } from "../../lib/seo";
import { EMAIL, LINKEDIN, CTA, bookHref, bookTarget } from "../../lib/site";
import { SITE_URL, post, heroImage, sectionArt, cardsFor, sections, lead, sources, disclosure, related } from "./post-data";
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

// "[1]" -> link to source 1; "**x**" -> <strong>. Anything else is plain text.
function Inline({ text }) {
  return text.split(/(\[\d\]|\*\*[^*]+\*\*)/g).map((part, i) => {
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

// Phone version of a figure: real HTML text (15px), same facts as the SVG.
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
          </li>
        ))}
      </ul>
    </div>
  );
}

// One figure = SVG (wide screens) + HTML cards (phones). CSS shows exactly one; display:none
// also removes the other from the accessibility tree, so screen readers get it once.
function Fig({ f, id }) {
  return (
    <figure className="bp-fig">
      {/* Plain img: these are SVG files, which next/image would not improve. Width and height stop layout shift. */}
      <img className="bp-svg" src={f.src} width={f.width} height={f.height} alt={f.alt} loading="lazy" decoding="async" />
      <Cards m={cardsFor[id]} alt={f.alt} />
      <figcaption>{f.caption}<Cites list={f.cites} /></figcaption>
    </figure>
  );
}

function Block({ b }) {
  switch (b.type) {
    case "p": return <p><Inline text={b.text} /></p>;
    case "ul": return <List as="ul" items={b.items} />;
    case "ol": return <List as="ol" items={b.items} />;
    case "callout":
      return (
        // Own class names (bp-note*) on purpose: globals.css already defines .read and .tag
        // as a two-column grid, which squashed an earlier version of this box.
        <aside className={`bp-note bp-note-${b.kind}`} aria-label={b.title}>
          <p className="bp-note-label">{b.title}</p>
          {b.paragraphs.map((t, i) => <p key={i}><Inline text={t} /></p>)}
          {b.ul && <List as="ul" items={b.ul} />}
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
      {/* "<" is escaped so no text in the data can close the script tag early. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main className="bp">
        <article>
          <header className="bp-hero" style={{ "--hero": `url(${heroImage})` }}>
            <div className="bp-wrap bp-hero-in">
              <div className="bp-tag">{post.category}</div>
              <h1>{post.title}</h1>
              <p className="bp-stand">{post.standfirst}</p>

              <figure className="bp-ip" aria-hidden="true">
                <div className="bp-ip-k">Example visitor IP</div>
                <div className="bp-ip-v">203.0.113.42</div>
                <div className="bp-ip-box">Server container</div>
                <div className="bp-ip-lane">
                  <span className="bp-ip-who">GA tags</span>
                  <span className="bp-ip-out bp-ip-red">203.0.113.<i>•••</i></span>
                  <span className="bp-ip-note">Keeps redacting</span>
                </div>
                <div className="bp-ip-lane bp-ip-hot">
                  <span className="bp-ip-who">Ads, DV360, SA360, CM360 tags</span>
                  <span className="bp-ip-out">203.0.113.42</span>
                  <span className="bp-ip-note">From 11 Jan 2027, reportedly</span>
                </div>
                <figcaption>Illustration with a documentation address, not data.</figcaption>
              </figure>

              <div className="bp-meta" role="group" aria-label="Article details">
                <div className="bp-stat">
                  <b>{post.headlineStat.value}</b>
                  <span>{post.headlineStat.label}</span>
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
                <p>Checked <time dateTime={post.lastChecked}>{longDate(post.lastChecked)}</time> against {sources.length} linked sources. Only one is the origin of the news.</p>
                <p>Parts marked <b>My view</b> are opinion.</p>
                <a href={correction}>Report a correction</a>
              </div>
            </aside>

            <div className="bp-main">
              <section className="bp-lead" aria-label="Summary">
                <p className="bp-eyebrow">The short version</p>
                <p><Inline text={lead} /></p>
              </section>

              {sections.map((s) => (
                <section key={s.id} id={s.id} className="bp-sec">
                  <h2>{s.heading}</h2>
                  {sectionArt[s.id] && <Fig f={sectionArt[s.id]} id={s.id} />}
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
              <h2>Running a server container?</h2>
              <p>Send me what your tags look like, or ask me to review your server-side setup before 11 January.</p>
            </div>
            <div className="bp-cta-btns">
              <a className="btn btn-primary" href={`mailto:${EMAIL}?subject=${encodeURIComponent("Server-side GTM and full IPs")}`}>Email me</a>
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
