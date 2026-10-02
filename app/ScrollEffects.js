"use client";
import { useEffect } from "react";

// Reveal-on-scroll, parallax (data-par), in-view progress (data-view) and the top progress bar.
export default function ScrollEffects({ motion = 1 }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.style.opacity = "1"; e.target.style.transform = "none"; io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    if (!reduce) {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        const d = +el.dataset.reveal || 0;
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,28px,0)";
        el.style.transition = `opacity .9s cubic-bezier(.2,.7,.2,1) ${d}ms, transform 1.1s cubic-bezier(.2,.7,.2,1) ${d}ms`;
        io.observe(el);
      });
    }
    // Chat prompts: typing dots until the bubble is in view, then the question fades in.
    const chatIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      chatIO.unobserve(e.target);
      const dots = e.target.querySelector("[data-dots]"), txt = e.target.querySelector("[data-txt]");
      setTimeout(() => { dots.style.display = "none"; txt.style.display = "inline"; txt.style.animation = "fadeUp .45s cubic-bezier(.2,.7,.2,1) both"; }, 420);
    }), { threshold: 0.6 });
    if (!reduce) {
      document.querySelectorAll("[data-chat]").forEach((el) => {
        const dots = el.querySelector("[data-dots]"), txt = el.querySelector("[data-txt]");
        if (!dots || !txt) return;
        dots.style.display = "inline-flex"; txt.style.display = "none";
        chatIO.observe(el);
      });
    }
    const views = [...document.querySelectorAll("[data-view]")];
    const pars = [...document.querySelectorAll("[data-par]")];
    const bar = document.querySelector("[data-progress]");
    const m = reduce ? 0 : motion, k = reduce ? 1 : 0.12;
    const cl = (x) => Math.min(1, Math.max(0, x));
    const L = (el, key, v) => { const c = el[key]; let n = c == null ? v : c + (v - c) * k; if (Math.abs(n - v) < 0.0004) n = v; el[key] = n; return n; };

    let raf;
    const tick = () => {
      const vh = window.innerHeight;
      for (const el of views) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--v", L(el, "_v", cl((vh - r.top) / (vh + r.height))).toFixed(4));
      }
      for (const el of pars) {
        const r = el.parentElement.getBoundingClientRect();
        const off = r.top + r.height / 2 - vh / 2;
        el.style.setProperty("--y", L(el, "_y", off * +el.dataset.par * m).toFixed(1) + "px");
      }
      if (bar) {
        const h = document.documentElement.scrollHeight - vh;
        bar.style.transform = `scaleX(${L(bar, "_s", h > 0 ? cl(window.scrollY / h) : 0).toFixed(4)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); io.disconnect(); chatIO.disconnect(); };
  }, [motion]);
  return null;
}
