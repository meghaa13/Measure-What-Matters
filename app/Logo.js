import { useId } from "react";

// The mark: an "m" drawn as one signal path, with a pulse travelling along it.
export function LogoMark({ size = 46 }) {
  const id = useId();
  const d = "M8 38V20a8 8 0 0 1 16 0V38V20a8 8 0 0 1 16 0V38";
  return (
    <svg className="mk-mark" viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C5B6F0" /><stop offset=".5" stopColor="#8E74DD" /><stop offset="1" stopColor="#2E2263" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${id})`} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path className="mk-run" d={d} pathLength="100" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeDasharray="7 93" />
      <circle className="mk-ping" cx="40" cy="38" r="4.5" fill="#5B43B5" />
      <circle cx="40" cy="38" r="4.5" fill="#2E2263" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

// Mark + name + tagline.
export default function Logo() {
  return (
    <span className="mk-logo">
      <LogoMark />
      <span className="mk-text">
        <span className="mk-name">Megha Karnwal</span>
        <span className="mk-tag">ANALYTICS · AUTOMATION · AI</span>
      </span>
    </span>
  );
}
