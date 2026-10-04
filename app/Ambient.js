"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Background dots, site-wide: small dots in white, lilac, lavender and purple
// that fade in and out in place. They are only ever placed on empty background:
// never over text, cards, images or controls, and never in a hero section.
const COLORS = ["#FFFFFF", "#C5B6F0", "#E6E0FA", "#8E74DD", "#5B43B5"];
const HEROES = '[data-section="hero"], [data-section="tool_hero"], .sx-hero, .method2';
const PAD = 18;       // clear space kept around every obstacle
const AREA_PER_DOT = 52000; // px² of free background per dot
const MAX_DOTS = 85;

// Small seeded generator, so the layout is stable between recalculations.
function rng(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

function obstacles(layer) {
  const vw = window.innerWidth, out = [];
  const add = (r) => { if (r.width > 0 && r.height > 0) out.push([r.left + window.scrollX - PAD, r.top + window.scrollY - PAD, r.right + window.scrollX + PAD, r.bottom + window.scrollY + PAD]); };
  // A hero is kept clear edge to edge, including the empty margins beside it.
  document.querySelectorAll(HEROES).forEach((el) => { const r = el.getBoundingClientRect(); out.push([-1e5, r.top + window.scrollY - PAD, 1e5, r.bottom + window.scrollY + PAD]); });
  for (const el of document.body.querySelectorAll("*")) {
    if (layer.contains(el) || el.closest(".ambient, .consent-layer, script, style")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed") continue;
    // Sticky content travels: block the whole area it moves through.
    if (cs.position === "sticky" && el.parentElement) { add(el.parentElement.getBoundingClientRect()); continue; }
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const tag = el.tagName;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const media = /^(IMG|SVG|svg|CANVAS|VIDEO|INPUT|BUTTON|SELECT|TEXTAREA|A|PRE|CODE)$/.test(tag);
    const boxed = r.width < vw - 4 && (
      (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") || cs.backgroundImage !== "none" ||
      parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0 || cs.boxShadow !== "none");
    if (hasText || media || boxed) add(r);
  }
  return out;
}

// Is this element (or a box it sits in) something a dot must not touch?
function solid(el, vw) {
  for (let e = el; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
    if (e.matches(HEROES) || e.closest(".nav, .fab")) return true;
    if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return true;
    if (/^(IMG|svg|CANVAS|VIDEO|INPUT|BUTTON|SELECT|TEXTAREA|A|PRE|CODE)$/.test(e.tagName)) return true;
    const r = e.getBoundingClientRect();
    if (r.width >= vw - 4) continue; // only an edge-to-edge section counts as background
    const cs = getComputedStyle(e);
    if ((cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") || cs.backgroundImage !== "none" || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0 || cs.boxShadow !== "none") return true;
  }
  return false;
}

// Content moves after the dots are placed (typing prompts, tabs, reveals, fonts).
// Look at what is under each on-screen dot and drop any that now touch content.
function prune(layer) {
  const vw = window.innerWidth, vh = window.innerHeight, m = PAD;
  for (const d of [...layer.children]) {
    const q = d.getBoundingClientRect();
    if (q.bottom < 0 || q.top > vh) continue;
    const pts = [[q.left + q.width / 2, q.top + q.height / 2], [q.left - m, q.top - m], [q.right + m, q.top - m], [q.left - m, q.bottom + m], [q.right + m, q.bottom + m], [q.left - m, q.top + q.height / 2], [q.right + m, q.top + q.height / 2]];
    if (pts.some(([x, y]) => { const el = x >= 0 && y >= 0 && x < vw && y < vh ? document.elementFromPoint(x, y) : null; return el && solid(el, vw); })) d.remove();
  }
}

function build(layer) {
  const W = document.documentElement.clientWidth;
  layer.style.height = "0px"; // don't let the layer itself stretch the page while measuring
  const H = document.documentElement.scrollHeight;
  layer.style.height = `${H}px`;
  const obs = obstacles(layer);
  const blocked = (x, y, s) => obs.some(([l, t, r, b]) => x + s > l && x < r && y + s > t && y < b);
  const rand = rng(20261004);
  const want = Math.min(MAX_DOTS, Math.round((W * H) / AREA_PER_DOT));
  const frag = document.createDocumentFragment();
  let placed = 0;
  for (let i = 0; i < want * 14 && placed < want; i++) {
    const size = 3 + Math.round(rand() * 7);
    const x = rand() * (W - size), y = rand() * (H - size);
    const color = COLORS[Math.floor(rand() * COLORS.length)], dur = 3.5 + rand() * 5.5, delay = -rand() * 9;
    if (blocked(x, y, size)) continue;
    const d = document.createElement("span");
    d.className = `dot${color === "#FFFFFF" ? " w" : ""}`;
    d.style.cssText = `left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${size}px;height:${size}px;background:${color};animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s`;
    frag.appendChild(d); placed++;
  }
  layer.replaceChildren(frag);
  prune(layer);
}

export default function Ambient() {
  const ref = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const layer = ref.current;
    let timer = 0, lastW = 0, lastH = 0;
    const schedule = (wait = 350) => { clearTimeout(timer); timer = setTimeout(() => build(layer), wait); };
    schedule(700);
    // Recalculate when the page changes shape (resize, reports appearing, tabs, accordions).
    const ro = new ResizeObserver(() => {
      const w = document.documentElement.clientWidth, h = document.body.scrollHeight;
      if (w !== lastW || Math.abs(h - lastH) > 4) { lastW = w; lastH = h; schedule(); }
    });
    ro.observe(document.body);
    const onClick = () => schedule(900);
    document.addEventListener("click", onClick);
    // Keep checking what is on screen: after scrolling stops, and on a slow tick.
    let idle = 0;
    const onScroll = () => { clearTimeout(idle); idle = setTimeout(() => prune(layer), 160); };
    window.addEventListener("scroll", onScroll, { passive: true });
    const tick = setInterval(() => prune(layer), 2500);
    return () => { clearTimeout(timer); clearTimeout(idle); clearInterval(tick); ro.disconnect(); document.removeEventListener("click", onClick); window.removeEventListener("scroll", onScroll); };
  }, [pathname]);

  return (
    <div ref={ref} className="dots-layer" aria-hidden="true" />
  );
}
