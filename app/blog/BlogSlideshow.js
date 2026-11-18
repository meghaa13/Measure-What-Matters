"use client";
import { useEffect, useState } from "react";

// Slideshow of the newest posts at the top of /blog. Slide data comes from the server page.
// Moves every 7 seconds, stops while the mouse or keyboard focus is inside it, and never
// auto-plays for people who asked for reduced motion.
export default function BlogSlideshow({ slides }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const n = slides.length;

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused || reduce || n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 7000);
    return () => clearInterval(t);
  }, [paused, reduce, n]);

  return (
    <section
      className="bs"
      aria-roledescription="carousel"
      aria-label="Newest posts"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="bs-stage">
        {slides.map((s, k) => (
          <article key={s.slug} className={`bs-slide${k === i ? " is-on" : ""}`} aria-hidden={k !== i} aria-roledescription="slide" aria-label={`${k + 1} of ${n}`}>
            <div className="bs-text">
              <span className="bl-cat">{s.category}</span>
              <h2 className="bs-title">{s.title}</h2>
              <p className="bs-desc">{s.description}</p>
              <span className="bl-meta"><time dateTime={s.publishedAt}>{s.date}</time><span aria-hidden="true">·</span><span>{s.readMinutes} min read</span></span>
              <a className="bs-btn" href={`/blog/${s.slug}`} tabIndex={k === i ? 0 : -1} data-track="blog_click" data-loc="blog_slideshow">Read the post <span aria-hidden="true">→</span></a>
            </div>
            <div className="bs-art" data-parallax="0.05">
              <img src={s.image} alt="" width="1200" height="630" loading={k === 0 ? "eager" : "lazy"} />
            </div>
          </article>
        ))}
      </div>
      {n > 1 && (
        <div className="bs-ctrl">
          <button type="button" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous post">←</button>
          <div className="bs-dots">
            {slides.map((s, k) => (
              <button key={s.slug} type="button" className={k === i ? "is-on" : ""} onClick={() => setI(k)} aria-label={`Show post ${k + 1}: ${s.title}`} aria-current={k === i} />
            ))}
          </div>
          <button type="button" onClick={() => setI((i + 1) % n)} aria-label="Next post">→</button>
        </div>
      )}
    </section>
  );
}
