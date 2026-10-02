// Small server-rendered pieces shared by the landing page sections.
import { CTA, SHOW_PROMPTS, bookHref, bookTarget } from "./lib/site";

// Chat bubble that shows typing dots, then the question (animated by ScrollEffects).
export function Prompt({ children, white }) {
  if (!SHOW_PROMPTS) return null;
  return (
    <div data-chat="1" data-reveal="0" className={`prompt${white ? " white" : ""}`}>
      <span className="dots" data-dots="1"><span /><span /><span /></span>
      <span data-txt="1">“{children}”</span>
    </div>
  );
}

export function BookLink({ loc, className, children }) {
  return (
    <a href={bookHref} target={bookTarget} rel={bookTarget ? "noopener" : undefined} className={className}
      data-track="cta_click" data-loc={loc}>{children}</a>
  );
}

// Inline "message from Megha" CTA placed between sections.
export function CtaZone({ loc, children }) {
  return (
    <div data-cta-zone="1" className="wrap cta-zone">
      <div data-reveal="0">
        <div className="stack">
          <div className="bubble">{children}</div>
          <BookLink loc={loc}>{CTA} <span aria-hidden="true">→</span></BookLink>
        </div>
        <div className="face"><img src="/uploads/img1.webp" alt="Megha" /></div>
      </div>
    </div>
  );
}
