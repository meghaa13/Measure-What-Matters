import Link from "next/link";
import SiteChrome from "./SiteChrome";

export const metadata = { title: "Page not found — Megha Karnwal" };

export default function NotFound() {
  return (
    <div className="legal">
      <SiteChrome home={false} />
      <main className="legal-body nf" data-error-page="404">
        <span className="eyebrow">404 · PAGE NOT FOUND</span>
        <h1>This link went nowhere.</h1>
        <p>Ironically, a broken path is exactly what my tools look for. Try one of these instead:</p>
        <div className="nf-links">
          <Link className="btn btn-primary" href="/#tools" data-track="nav_click" data-loc="not_found">See the free tools</Link>
          <Link className="btn btn-ghost" href="/" data-track="nav_click" data-loc="not_found">Back to home</Link>
        </div>
      </main>
    </div>
  );
}
