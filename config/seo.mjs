// ONE place for search-engine text. Edit titles and descriptions here, nowhere else.
//
// - SITE_URL: the live address. Change it here when a real domain is bought.
// - SITE: the site-wide defaults (used when a page has no entry of its own).
// - PAGES: title + description for every page that is not a blog post, keyed by its path.
// - POST_OVERRIDES: optional title/description for a blog post, keyed by its slug.
//   Leave a post out and it uses the title and description from its own post-data.js.
//
// Titles: aim for 60 characters or fewer (Google cuts longer ones). Descriptions: about 155 or fewer.

export const SITE_URL = "https://measure-what-matter.netlify.app";

export const SITE = {
  name: "Megha Karnwal",
  title: "Megha Karnwal — Web & Data Analyst",
  description: "Web & Data Analyst working across analytics, automation and AI.",
};

export const PAGES = {
  "/": {
    title: SITE.title,
    description: SITE.description,
  },
  "/blog": {
    title: "Blog | Megha Karnwal",
    description: "Notes on analytics, measurement and AI for marketing teams. Every claim links to a dated source.",
  },
  "/privacy": {
    title: "Privacy — Megha Karnwal",
    description: "What this site and its free tools collect, why, and how long it's kept.",
  },
  "/apps/tag-scanner": {
    title: "Free GTM & GA4 Tag Checker | Tag Health Scan",
    description: "Scan a website's Google tag and GTM setup. See what's tracked, what's broken and what's risky, with a confidence label on every finding.",
  },
  "/apps/lead-path": {
    title: "Free Lead Source Tracking Checker | Lead Path X-Ray",
    description: "Follow one visit from an ad, email, social or partner link through redirects, tags and forms, and see where its source gets lost before the CRM.",
  },
  "/apps/cro-xray": {
    title: "Free Website CRO Check | CRO X-Ray",
    description: "Up to three conversion problems you can't see from your own desk: promises the next step doesn't keep, forms nobody measures, and phones that wait too long for the button. With the evidence.",
  },
  "/apps/ai-crawler-gate": {
    title: "AI Crawler & robots.txt Checker | AI Visibility Check",
    description: "Can ChatGPT, Perplexity, Claude and Google AI Overviews find and quote your site? Plain verdict and a copy-paste robots.txt fix.",
  },
  "/apps/clean-tracking-plan": {
    title: "GA4 dataLayer Requirements Template | Clean Tracking Plan",
    description: "Get the dataLayer requirements for your website type, with every field classified before it is collected: safe, consent-gated, hash only, or never collect.",
  },
  // The 404 page: shown for any address that does not exist. Not indexed.
  notFound: {
    title: "Page not found — Megha Karnwal",
  },
};

// Example: POST_OVERRIDES["track-ai-mode-traffic-ga4"] = { title: "...", description: "..." };
export const POST_OVERRIDES = {};
