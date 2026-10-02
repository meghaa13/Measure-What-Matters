// Crawler registry, grouped by purpose. Re-check monthly against each vendor's docs and
// update `REGISTRY_VERIFIED` (and any entry that changed). Bot lists move fast.
export const REGISTRY_VERIFIED = "Pending first verification";

export const PURPOSES = {
  search: { label: "AI search & answers", desc: "Builds the index AI search engines cite and link to. Blocking it removes you from their answers." },
  user: { label: "Fetches users ask for", desc: "Loads a page when someone asks an assistant about it. Blocking it means the assistant can't read the page on request." },
  training: { label: "Model training", desc: "Collects pages to train future models. Blocking it doesn't affect whether you're cited in search." },
};

// token = the User-agent token used in robots.txt
export const BOTS = [
  { token: "OAI-SearchBot", vendor: "OpenAI", product: "ChatGPT search", purpose: "search", doc: "https://platform.openai.com/docs/bots" },
  { token: "ChatGPT-User", vendor: "OpenAI", product: "ChatGPT (user requests)", purpose: "user", doc: "https://platform.openai.com/docs/bots" },
  { token: "GPTBot", vendor: "OpenAI", product: "Model training", purpose: "training", doc: "https://platform.openai.com/docs/bots" },
  { token: "Claude-SearchBot", vendor: "Anthropic", product: "Claude search", purpose: "search", doc: "https://support.anthropic.com/" },
  { token: "Claude-User", vendor: "Anthropic", product: "Claude (user requests)", purpose: "user", doc: "https://support.anthropic.com/" },
  { token: "ClaudeBot", vendor: "Anthropic", product: "Model training", purpose: "training", doc: "https://support.anthropic.com/" },
  { token: "PerplexityBot", vendor: "Perplexity", product: "Perplexity search", purpose: "search", doc: "https://docs.perplexity.ai/guides/bots" },
  { token: "Perplexity-User", vendor: "Perplexity", product: "Perplexity (user requests)", purpose: "user", doc: "https://docs.perplexity.ai/guides/bots" },
  { token: "Googlebot", vendor: "Google", product: "Google Search, incl. AI Overviews & AI Mode", purpose: "search", doc: "https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers" },
  { token: "Google-Extended", vendor: "Google", product: "Gemini training (not Search)", purpose: "training", doc: "https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers", note: "A robots.txt token, not a separate crawler. Blocking it doesn't remove you from Search or AI Overviews." },
  { token: "Bingbot", vendor: "Microsoft", product: "Bing & Copilot", purpose: "search", doc: "https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0" },
  { token: "Applebot", vendor: "Apple", product: "Siri & Spotlight", purpose: "search", doc: "https://support.apple.com/en-us/119829" },
  { token: "Applebot-Extended", vendor: "Apple", product: "Apple Intelligence training", purpose: "training", doc: "https://support.apple.com/en-us/119829", note: "A robots.txt token; Applebot still crawls for search." },
  { token: "meta-externalagent", vendor: "Meta", product: "Meta AI training", purpose: "training", doc: "https://developers.facebook.com/docs/sharing/webmasters/web-crawlers" },
  { token: "CCBot", vendor: "Common Crawl", product: "Open dataset used to train many models", purpose: "training", doc: "https://commoncrawl.org/ccbot" },
  { token: "Bytespider", vendor: "ByteDance", product: "Model training", purpose: "training", doc: null },
];

// Intent presets for the robots.txt generator: purpose → allow / disallow.
export const PRESETS = {
  cited_not_trained: { label: "Be cited, not trained on", rule: { search: "allow", user: "allow", training: "disallow" } },
  allow_all: { label: "Allow all AI crawlers", rule: { search: "allow", user: "allow", training: "allow" } },
  block_all: { label: "Block all AI crawlers", rule: { search: "disallow", user: "disallow", training: "disallow" }, warn: "This also blocks Googlebot and Bingbot, which removes you from Google and Bing search. The generator keeps those two allowed." },
};
