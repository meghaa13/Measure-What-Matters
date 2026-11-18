"use client";
import { useEffect } from "react";

// Two small effects for the blog index, no libraries:
//  1. Parallax: anything with data-parallax="0.08" drifts slower than the page as you scroll.
//  2. Reveal: anything with data-reveal fades up the first time it scrolls into view.
// Both switch off for people who ask their device for reduced motion.
export default function BlogMotion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = document.querySelectorAll("[data-reveal]");
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));

    const layers = Array.from(document.querySelectorAll("[data-parallax]"));
    let queued = false;
    const paint = () => {
      queued = false;
      const mid = window.innerHeight / 2;
      layers.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const speed = parseFloat(el.dataset.parallax) || 0.08;
        el.style.transform = `translate3d(0, ${((r.top + r.height / 2) - mid) * speed}px, 0)`;
      });
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return null;
}
