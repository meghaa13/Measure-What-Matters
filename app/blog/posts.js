// The one list of blog posts. The /blog index, the home page strip and the sitemap all read it.
// To add a post: create blog/<slug>/ with a post-data.js that exports `post`, then add one import and one entry below.
import { post as ga4AiMode } from "./track-ai-mode-traffic-ga4/post-data";
import { post as adsReviewSummaries } from "./google-ads-review-summaries-test/post-data";
import { post as sgtmFullIp } from "./google-says-server-side-gtm-full-ip-google-ads-2027/post-data";
import { post as californiaOpenai } from "./california-openai-agent-guardrail-checklist/post-data";
import { post as agentTraffic } from "./ai-agent-traffic-how-much-to-plan-for/post-data";
import { post as italyMeta } from "./italy-meta-805m-consent-audit/post-data";
import { post as characterAi } from "./characterai-bankruptcy-ai-vendor-terms-checklist/post-data";
import { post as neonVsAstra } from "./gemini-4-neon-vs-gpt-6-2-astra-cost-per-task/post-data";
import { post as googleAgent } from "./google-agent-allow-then-measure/post-data";

export const posts = [googleAgent, neonVsAstra, californiaOpenai, agentTraffic, italyMeta, characterAi, ga4AiMode, adsReviewSummaries, sgtmFullIp].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
