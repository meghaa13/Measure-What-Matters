import Scanner from "./Scanner";
import ToolAbout from "../ToolAbout";
import { pageMeta } from "../../lib/seo";
import "./scanner.css";
import "./scanner-layout.css";

export const metadata = pageMeta("/apps/tag-scanner");

export default function TagScannerPage() {
  return (
    <>
      <Scanner />
      <ToolAbout
        heading="What the Tag Health Scan checks"
        intro="Paste a website address and the scan finds its Google tag and Google Tag Manager (GTM) containers, reads how they are configured, and lists what is tracked, what looks broken and what is risky. It is meant for marketers and analysts who want a second opinion on a tracking setup without opening GTM."
        steps={[
          { t: "Find the tags", d: "It reads the live homepage for Google tag and GTM IDs. If the site blocks automated visits, it falls back to the latest archived copy and labels it as archived." },
          { t: "Read the configuration", d: "It fetches each container from Google and reads it as data. The container code is parsed, never run." },
          { t: "Map what is tracked", d: "Every tag, event, conversion and trigger is translated into plain English: what fires, when, and what it sends." },
          { t: "Find what is missing or broken", d: "It checks the page for forms, calls, bookings and video, then runs a library of rules. Every finding carries a confidence label, so you can tell a firm finding from a guess." },
        ]}
        faqs={[
          { q: "What do I need to enter?", a: "Only the public address of the website. No login or access to the GTM account is needed." },
          { q: "Does it change anything on the site?", a: "No. It only reads public information and the published container." },
          { q: "Why is there a confidence label on each finding?", a: "An outside check cannot see everything. The label says how sure the scan is, so you know what to verify in your own GTM and GA4 first." },
        ]}
        related={[{ href: "/blog/google-says-server-side-gtm-full-ip-google-ads-2027", label: "Google says server-side GTM will send full IPs to Ads in 2027" }]}
      />
    </>
  );
}
