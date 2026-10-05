import Link from "next/link";
import { ConsentLink } from "./Consent";
import { EMAIL, LINKEDIN, RESUME, contactHref, bookTarget } from "./lib/site";

const TOOLS = [
  ["/apps/tag-scanner", "Tag Health Scan"],
  ["/apps/lead-path", "Lead Path X-Ray"],
  ["/apps/cro-xray", "CRO X-Ray"],
  ["/apps/ai-crawler-gate", "AI Visibility Check"],
];
const SITE = [["/#story", "Finding the problem"], ["/#method", "What I build"], ["/#work", "Proof"], ["/#stack", "Stack"], ["/#apps", "Side projects"], ["/#faq", "FAQ"]];

// Shared footer on every page (rendered once in layout.js).
export default function SiteFooter() {
  return (
    <footer className="site-foot" data-section="footer">
      <div className="sf-wrap">
        <div className="sf-brand">
          <Link href="/" className="sf-name" data-track="nav_click" data-loc="footer">Megha Karnwal</Link>
          <p>Web &amp; data analyst. Analytics, automation and AI for teams who want numbers they can trust.</p>
          <a href={contactHref} target={bookTarget} rel={bookTarget ? "noopener" : undefined} className="sf-cta" data-track="cta_click" data-loc="footer">Book a 20-min call →</a>
        </div>
        <nav aria-label="Site">
          <b>Site</b>
          {SITE.map(([h, t]) => <Link key={h} href={h} data-track="nav_click" data-loc="footer">{t}</Link>)}
        </nav>
        <nav aria-label="Free tools">
          <b>Free tools</b>
          {TOOLS.map(([h, t]) => <Link key={h} href={h} data-track="nav_click" data-loc="footer">{t}</Link>)}
        </nav>
        <div className="sf-col">
          <b>Contact</b>
          <a href={`mailto:${EMAIL}`} data-track="nav_click" data-loc="footer">{EMAIL}</a>
          <a href={LINKEDIN} target="_blank" rel="noopener" data-track="nav_click" data-loc="footer">LinkedIn ↗</a>
          <a href={RESUME} download="Megha-Karnwal-Resume.pdf" data-track="nav_click" data-loc="footer">Résumé (PDF)</a>
        </div>
      </div>
      <div className="sf-wrap sf-base">
        <span>© 2026 Megha Karnwal</span>
        <span><Link href="/privacy" data-track="nav_click" data-loc="footer">Privacy</Link> · <ConsentLink /></span>
      </div>
    </footer>
  );
}
