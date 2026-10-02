import CrawlerGate from "./CrawlerGate";
import "../tag-scanner/scanner.css";
import "../tag-scanner/scanner-layout.css";
import "../micro.css";

export const metadata = {
  title: "AI Visibility Check — Megha Karnwal",
  description: "Can ChatGPT, Perplexity, Claude and Google AI Overviews find and quote your site, and how often do they cite you? Plain verdict, live citation sample and a copy-paste robots.txt fix.",
};

export default function CrawlerGatePage() {
  return <CrawlerGate />;
}
