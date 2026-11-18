import CrawlerGate from "./CrawlerGate";
import ToolAbout from "../ToolAbout";
import { pageMeta } from "../../lib/seo";
import "../tag-scanner/scanner.css";
import "../tag-scanner/scanner-layout.css";
import "../micro.css";

export const metadata = pageMeta({
  title: "AI Crawler & robots.txt Checker | AI Visibility Check",
  description: "Can ChatGPT, Perplexity, Claude and Google AI Overviews find and quote your site? Plain verdict and a copy-paste robots.txt fix.",
  path: "/apps/ai-crawler-gate",
});

export default function CrawlerGatePage() {
  return (
    <>
      <CrawlerGate />
      <ToolAbout
        heading="What the AI Visibility Check tells you"
        intro="AI assistants and AI search features can only quote a site they are allowed to read. This check reads your robots.txt file and public headers, then gives a plain verdict on whether ChatGPT, Perplexity, Claude and Google AI Overviews can find and quote your site, with a copy-paste robots.txt fix if something is blocked."
        faqs={[
          { q: "What does it read?", a: "Only your robots.txt and public headers. It does not log in or change anything." },
          { q: "Can robots.txt alone tell the whole story?", a: "No. A firewall or CDN can also block bots without showing it in robots.txt, so treat the verdict as the rules you have published, not a guarantee of access." },
          { q: "Is allowing AI crawlers always right?", a: "Not always. Some crawlers collect data to train models and others fetch pages to answer a user's question. Decide per crawler, based on what you want from each." },
        ]}
        related={[
          { href: "/blog/ai-agent-traffic-how-much-to-plan-for", label: "4 Uber rides from AI agents in Halloween week: what to plan for" },
          { href: "/blog/track-ai-mode-traffic-ga4", label: "Google says AI Mode earns less. What can you measure?" },
        ]}
      />
    </>
  );
}
