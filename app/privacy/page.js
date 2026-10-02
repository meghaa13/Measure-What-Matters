import SiteChrome from "../SiteChrome";
import { ConsentLink } from "../Consent";
import { EMAIL } from "../lib/site";

export const metadata = {
  title: "Privacy — Megha Karnwal",
  description: "What this site and its free tools collect, why, and how long it's kept.",
};

export default function Privacy() {
  return (
    <div className="legal">
      <SiteChrome home={false} />
      <main className="legal-body">
        <span className="eyebrow">PRIVACY NOTICE · UPDATED OCTOBER 2026</span>
        <h1>What this site collects, and why.</h1>
        <p>This is a personal portfolio run by Megha Karnwal, who is responsible for the data described here. Questions or requests: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>

        <h2>Analytics</h2>
        <p>Google Analytics (through Google Tag Manager) records anonymous usage: pages viewed, sections reached, buttons clicked and which tools were used. It never receives your name, email or anything you type into a tool. In the EEA, UK and Switzerland it only runs after you agree in the cookie banner; elsewhere it runs by default. Advertising measurement (Google Ads, LinkedIn) only runs if you allow it. Change your choice any time: <ConsentLink />.</p>

        <h2>The free tools</h2>
        <ul>
          <li><b>What they read:</b> only public information about the website you enter: its HTML, robots.txt, redirects and published tag configuration. No logins, no private data, and forms are read, never submitted.</li>
          <li><b>What is stored:</b> nothing about you. Results are held in server memory for up to an hour so repeat checks of the same site are faster, then dropped. An anonymous count of which rules fired (no site, no IDs) is logged for aggregate stats.</li>
          <li><b>AI features:</b> the Tag Health Scan summary and the AI citation sample send the scanned domain and findings to Anthropic&apos;s Claude API. Anthropic doesn&apos;t use API data to train models.</li>
          <li><b>Recent searches</b> are kept in your own browser (local storage) and never leave it.</li>
        </ul>

        <h2>When you give your email</h2>
        <p>If you ask for a full report, monitoring or a citation sample, your email and the site you checked go to Netlify Forms so Megha can reply. They are used only for that, never sold or shared, and deleted on request or after 12 months.</p>

        <h2>Your rights</h2>
        <p>You can ask to see, correct or delete anything held about you, or withdraw consent, by emailing the address above. If you&apos;re in the EU or UK you can also complain to your data protection authority; in India, under the Digital Personal Data Protection Act 2023, to the Data Protection Board.</p>

        <h2>Processors</h2>
        <p>Netlify (hosting and forms), Google (analytics), Anthropic (AI features). Data may be processed outside your country under those providers&apos; standard safeguards.</p>
        <p className="legal-back"><a href="/">← Back to the site</a> · <a href="/#tools">Free tools</a></p>
      </main>
    </div>
  );
}
