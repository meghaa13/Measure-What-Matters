"use client";
import { useEffect, useState } from "react";

// The visitor's own recent searches (kept only in their browser), shown before the default examples.
// Never shared between visitors: other people's searches would reveal which companies they're checking.
export function useRecent(key, defaults, max = 3) {
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(`recent:${key}`) || "[]").slice(0, max)); } catch { /* storage off */ }
  }, [key, max]);
  const add = (value) => {
    const v = String(value || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!v) return;
    setRecent((list) => {
      const next = [v, ...list.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, max);
      try { localStorage.setItem(`recent:${key}`, JSON.stringify(next)); } catch { /* storage off */ }
      return next;
    });
  };
  const lower = recent.map((r) => r.toLowerCase());
  const examples = [...recent, ...defaults.filter((d) => !lower.includes(d.toLowerCase()))].slice(0, Math.max(defaults.length, 3));
  return { examples, recent, add };
}
