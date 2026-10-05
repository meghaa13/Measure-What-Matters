const SITE = "https://meghakarnwal.com";
export default function sitemap() {
  return ["", "/apps/tag-scanner", "/apps/lead-path", "/apps/cro-xray", "/apps/ai-crawler-gate", "/apps/clean-tracking-plan", "/privacy"]
    .map((p) => ({ url: `${SITE}${p}`, changeFrequency: "monthly", priority: p ? 0.7 : 1 }));
}
