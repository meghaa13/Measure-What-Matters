import { posts } from "./blog/posts";

const SITE = "https://measure-what-matter.netlify.app";
export default function sitemap() {
  return ["", "/apps/tag-scanner", "/apps/lead-path", "/apps/cro-xray", "/apps/ai-crawler-gate", "/apps/clean-tracking-plan", "/privacy", "/blog", ...posts.map((p) => `/blog/${p.slug}`)]
    .map((p) => ({ url: `${SITE}${p}`, changeFrequency: "monthly", priority: p ? 0.7 : 1 }));
}
