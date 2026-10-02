"use client";
import { useEffect, useRef, useState } from "react";

// Number that counts up from 0 when it scrolls into view.
export default function CountUp({ to, ms = 900 }) {
  const [v, setV] = useState(0);
  const el = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now) => { const p = Math.min(1, (now - t0) / ms); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, ms]);
  return <span ref={el}>{v}</span>;
}
