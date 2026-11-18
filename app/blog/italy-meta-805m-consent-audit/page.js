// Blog post page. Server component: no client JavaScript of its own.
import SiteChrome from "../../SiteChrome";
import { EMAIL, LINKEDIN, CTA, bookHref, bookTarget } from "../../lib/site";
import { SITE_URL, post, heroArt, sectionArt, sections, lead, shots, garanteUrl, sources, disclosure, related } from "./post-data";
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
    <> Source: {list.map((n, i) => <span key={n}>{i ? ", " : ""}<a href={`#src-${n}`}>[{n}]</a></span>)}.</>
  );

// The chart is an SVG with large type, so it stays readable when scaled to a phone.
// The caption carries the same facts as real text.
function Fig({ f }) {
  return (
    <figure className="bp-fig">
      {/* Plain img: an SVG file, which next/image would not improve. Width and height stop layout shift. */}
      <img src={f.src} width={f.width} height={f.height} alt={f.alt} loading="lazy" decoding="async" />
      <figcaption>{f.caption}<Cites list={f.cites} /></figcaption>
    </figure>
  );
}

// Real screenshot, cropped with CSS only: the file is untouched and the full image opens on tap.
// The crop box has a fixed aspect; the image is scaled so the text column fills it and is pulled
// up/left (percent margins are relative to the box width) to hide the Garante's sticky menu strip.
function Shot({ s }) {
  return (
    <figure className="bp-fig bp-shot">
      <a className={s.crop ? "bp-crop" : "bp-crop bp-crop-full"} href={s.src} target="_blank" rel="noopener noreferrer"
         aria-label="Open the full screenshot in a new tab" style={s.crop ? { "--y": s.y } : undefined}>
        <img src={s.src} width={s.width} height={s.height} alt={s.alt} loading="lazy" decoding="async" />
      </a>
      <figcaption>
        {s.caption}<Cites list={[1]} />{" "}
        <a href={garanteUrl} rel="noopener noreferrer" target="_blank">{garanteUrl}</a>. Tap the image for the full screenshot.
      </figcaption>
      {s.quote && (
        <details className="bp-trans">
          <summary>Italian sentence and English gloss</summary>
          <p lang="it"><b>Italian, verbatim:</b> &ldquo;{s.quote.it}&rdquo;</p>
          <p><b>English gloss (ours, not an official translation):</b> {s.quote.en}</p>
        </details>
      )}
    </figure>
  );
}

function Block({ b }) {
  switch (b.type) {
    case "p": return <p><Inline text={b.text} /></p>;
    case "ul": return <List as="ul" items={b.items} />;
    case "ol": return <List as="ol" items={b.items} />;
    case "steps": return <ol className="bp-steps">{b.items.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ol>;
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
              {/* Illustration, not data. The alt text says what it shows. */}
              <img className="bp-hero-art" src={heroArt} width="560" height="520" alt="Illustration: a phone with one Allow switch turned on, a solid pill reading Allowed, and a dashed gap down to a pill reading Agreed with a question mark." />

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
                  {sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.heading.replace(/ \(my method.*\)$/, "")}</a></li>)}
                  <li><a href="#sources">Sources</a></li>
                  <li><a href="#made">How this was made</a></li>
                </ol>
              </nav>
              <div className="bp-trust">
                <p className="bp-rail-h">Trust notes</p>
                <p>Checked <time dateTime={post.lastChecked}>{longDate(post.lastChecked)}</time> against {sources.length} linked sources.</p>
                <p>Parts marked <b>My view</b> or <b>My method</b> are opinion.</p>
                <a href={correction}>Report a correction</a>
              </div>
            </aside>

            <div className="bp-main">
              <section className="bp-lead" aria-label="Summary">
                <p className="bp-eyebrow">The short version</p>
                <p><Inline text={lead} /></p>
              </section>

              <Shot s={shots.header} />

              {sections.map((s) => (
                <section key={s.id} id={s.id} className={`bp-sec bp-op-${s.opener}`}>
                  <h2>{s.heading}</h2>
                  {s.blocks.map((b, i) => <Block key={i} b={b} />)}
                  {sectionArt[s.id] && <Fig f={sectionArt[s.id]} />}
                  {sectionArt[s.id] && [shots.method, shots.start, shots.fine].map((x) => <Shot key={x.src} s={x} />)}
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
              <h2>Run steps 1, 2 and 5 on your own setup</h2>
              <p>Send me what the sheet shows, or ask me to look at how your tags behave before a choice is made. Not legal advice.</p>
            </div>
            <div className="bp-cta-btns">
              <a className="btn btn-primary" href={`mailto:${EMAIL}?subject=${encodeURIComponent("Consent audit sheet")}`}>Email me</a>
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
