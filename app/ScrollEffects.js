"use client";
import { useEffect } from "react";

// Reveal-on-scroll, parallax (data-par), in-view progress (data-view) and the top progress bar.
// Cards that light up under the pointer (see ".glow" in globals.css).
const GLOW = ".stack-col, .case, .vpp, .note-card, .faq-item";

// How each section opens as it scrolls into view (styles: "Section openings" in globals.css).
// Inspired by scroll components on 21st.dev, rebuilt in plain CSS so nothing new is downloaded.
const OPENINGS = [
  [".story .copy-stack", "wipe-l"],     // Approach: text wipes in from the left...
  [".story .panel-box", "wipe-r"],      // ...and the chart from the right (Dual Wipe Reveal)
  [".m2-intro .h2", "words"],     // Method: the heading lights up word by word (Text Highlighter)
  [".work .vpp", "wipe-l"],             // Proof: the lead case wipes in,
  [".work .cases", "pop"],              // then the case cards pop in one after another (Stagger Reveal Grid)
  [".stack-grid", "steps"],             // Stack: the three cards arrive in order 01, 02, 03 (stepped Scroll Reveal)
  [".tools-viewport", "tilt"],          // Tools: the card tilts up flat as you scroll (Container Scroll Animation)
  [".co-track", "zoom"],                // Side projects: zooms in from soft focus (Progressive Blur)
  [".notes", "flip"],                   // Point of view: notes flip down like cards
  [".faq-list", "slide-r"],             // FAQ: questions slide in from the right
  [".contact-box", "expand"],           // Contact: the panel grows to full size (Scroll Media Expansion)
];
const SCROLL_LINKED = ["tilt", "expand"];

// Wrap each word of a heading in a span so words can light up in turn.
function splitWords(el) {
  let i = 0;
  const walk = (node) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const part of n.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
          const w = document.createElement("span"); w.className = "w"; w.style.setProperty("--i", i++); w.textContent = part; frag.appendChild(w);
        }
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    }
  };
  walk(el);
}

export default function ScrollEffects({ motion = 1 }) {
  useEffect(() => {
    const onMove = (e) => {
      const el = e.target.closest?.(GLOW);
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Section openings: tag the elements, then open each one the first time it is seen.
    // A wiped block is clipped to nothing, so the browser never reports it as visible:
    // watch its parent instead and open the block when the parent comes into view.
    const targets = new WeakMap();
    const openIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      (targets.get(e.target) || [e.target]).forEach((t) => t.classList.add("is-open"));
      openIO.unobserve(e.target);
    }), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    const watch = (el, kind) => {
      if (!kind.startsWith("wipe")) return openIO.observe(el);
      const p = el.parentElement;
      targets.set(p, [...(targets.get(p) || []), el]);
      openIO.observe(p);
    };
    for (const [sel, kind] of OPENINGS) {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.dataset.open) return;
        el.dataset.open = kind;
        [...el.children].forEach((c, i) => c.style.setProperty("--i", i));
        if (kind === "words") splitWords(el);
        if (SCROLL_LINKED.includes(kind)) el.dataset.view = "1"; else watch(el, kind);
      });
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.style.opacity = "1"; e.target.style.transform = "none"; io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    if (!reduce) {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        if (el.dataset.open || el.parentElement?.dataset.open) return;
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
    return () => { cancelAnimationFrame(raf); io.disconnect(); chatIO.disconnect(); openIO.disconnect(); };
  }, [motion]);
  return null;
}
