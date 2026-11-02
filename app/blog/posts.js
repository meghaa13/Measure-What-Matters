// The one list of blog posts. The /blog index, the home page strip and the sitemap all read it.
// To add a post: create blog/<slug>/ with a post-data.js that exports `post`, then add one import and one entry below.
import { post as ga4AiMode } from "./track-ai-mode-traffic-ga4/post-data";
import { post as adsReviewSummaries } from "./google-ads-review-summaries-test/post-data";

export const posts = [ga4AiMode, adsReviewSummaries].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
