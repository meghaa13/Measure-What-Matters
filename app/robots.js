const SITE = "https://meghakarnwal.com";
export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      // Training-only crawlers; assistants that cite sources (OAI-SearchBot, PerplexityBot, Claude-SearchBot) stay allowed.
      { userAgent: ["GPTBot", "CCBot", "Google-Extended", "Bytespider", "meta-externalagent"], disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
