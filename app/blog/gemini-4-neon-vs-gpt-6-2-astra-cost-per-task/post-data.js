// Everything the post page shows. Copy of final.md (approved), split into blocks.
// Text markup: [n] links to source n, **bold** is <strong>, {{text|url}} is an external link.
// Only additions to the approved wording: [n] citation markers and table captions.
// The "helper" block is where final.md had the hidden CALCULATOR INSERTION POINT comment.

export const SITE_URL = "https://measure-what-matter.netlify.app";

const B = "/blog/gemini-4-neon-vs-gpt-6-2-astra-cost-per-task/";

export const post = {
  slug: "gemini-4-neon-vs-gpt-6-2-astra-cost-per-task",
  title: "Neon or Astra? Cost your own task before you pick",
  description:
    "Gemini 4 Neon and GPT-6.2 Astra list very different token prices. Cost per finished task is what you pay. Here is the method, with the arithmetic shown.",
  author: "Megha Karnwal",
  // Run date is the default publish date. Megha sets the real one before publishing.
  publishedAt: "2026-11-24",
  lastChecked: "2026-11-20",
  readMinutes: 8,
  headlineStat: { value: "$3 vs $8", label: "Input price per million tokens, Neon vs Astra. Vendor-reported.", cite: [1, 2] },
  shareImage: `${B}share-card.png`,
  updates: [],
};

export const heroImage = `${B}hero-bg.svg`;

export const lead =
  "Which model is cheaper for a marketing automation, Gemini 4 Neon or GPT-6.2 Astra? On list prices, Neon is cheaper per token: $3 input and $15 output per million tokens against Astra's $8 and $40. [1][2] But you pay per finished task, not per token, and a third-party index shows Astra cheaper per task at every effort level both models share, from $0.66 against $0.75 at low effort to $2.52 against $6.44 at xhigh. [4] Cost your own job on both models before you commit.";

export const intro = [
  "Google published Neon on 18 Nov 2026. [1] OpenAI's model and pricing pages show no release date, and I could not open its announcement page, so I give no launch date for Astra. [2][3] This article skips the leaderboard and gives you a way to price a real task, such as a weekly report summary, a UTM audit or a GA4 anomaly check.",
];

export const sections = [
  {
    id: "what-the-vendors-published",
    heading: "What the vendors published",
    blocks: [
      { type: "p", text: "Prices below are vendor-reported list prices per million tokens." },
      {
        type: "table",
        caption: "Table 1. Vendor-reported list prices per million tokens, and context window.",
        head: ["", "Gemini 4 Neon (Google, 18 Nov 2026)", "GPT-6.2 Astra (OpenAI docs, read 20 Nov 2026)"],
        rows: [
          ["Input", "$3", "$8"],
          ["Cached input", "$0.15", "$0.40"],
          ["Output", "$15", "$40"],
          ["Context window", "1 million tokens", "1,050,000 tokens (up to 922,000 input, 128,000 output)"],
        ],
        cites: [1, 2, 3],
      },
      {
        type: "p",
        text: "Two rules in the fine print matter. For Astra, any request with more than 272,000 input tokens is billed at double the input and cache rates and 1.5 times the output rate, for the whole request. [3] I did not find a matching long-context rule on Google's Neon page, so I can't say whether one exists. Check before you send long prompts.",
      },
      {
        type: "p",
        text: "Google also makes two claims on its 18 Nov 2026 page. It says Neon at its default high thinking level has a \"32% lower cost per task\" than Gemini 4 Carbon, and that Neon is first on Zapier's AutomationBench at 56.3%. [1] Both are Google-reported. Zapier, not Google, runs AutomationBench; I have not checked Zapier's own page, and other trackers may rank Neon differently. Google does not define how it counts cost per task, and neither claim compares Neon with Astra.",
      },
    ],
  },
  {
    id: "why-price-per-token-is-the-wrong-number",
    heading: "Why price per token is the wrong number",
    blocks: [
      {
        type: "p",
        text: "Neon's input price is 37.5% of Astra's, and its output price is also 37.5% of Astra's. So at list prices, the same prompt and the same answer length cost Astra 2.67 times what they cost Neon.",
      },
      {
        type: "p",
        text: "Artificial Analysis, an independent benchmarking site, reports cost per task on its Intelligence Index (page read 20 Nov 2026, no publication date shown): [4]",
      },
      {
        type: "table",
        caption: "Table 2. Artificial Analysis cost per task and minutes, by effort level. Cost values are matched to levels by position on the page; only the Low row is confirmed by the page's own summary text.",
        head: ["Effort", "Astra cost per task", "Neon cost per task", "Astra minutes", "Neon minutes"],
        rows: [
          ["Low", "$0.66", "$0.75", "2.0", "3.7"],
          ["Medium", "$1.62", "$1.90", "4.9", "8.3"],
          ["High", "$2.07", "$3.74", "6.3", "14.8"],
          ["Xhigh", "$2.52", "$6.44", "7.7", "21.5"],
        ],
        cites: [4],
      },
      {
        type: "p",
        text: "The page lists the effort levels but does not label each cost value. I matched the values to levels by position, and only the Low row is confirmed by the page's own summary text. The page also lists Astra at Max ($4.00, 14.2 minutes), where Neon has no entry. On this reading, Astra is cheaper and faster at every level both models share, even though its token prices are 2.67 times higher. Google says Neon runs at high thinking by default, so the High row may be the nearest to a default comparison, but that rests on the position-based matching. An Intelligence Index task is not a marketing task, so do not copy these figures to your work. They show something narrower: a model with higher token prices can finish a task for less if it uses fewer tokens. [1][4]",
      },
      { type: "p", text: "Three things move your real cost per task." },
      {
        type: "ol",
        items: [
          "Tokens used. Input is the same for both models if you send the same prompt. Output is not. Thinking models write different amounts.",
          "Cached share. Repeated context, such as a long system prompt or a fixed report template, is billed at the cached rate. Neon's cached price is 5% of its input price, and so is Astra's ($0.40 against $8). Because both discounts are the same, caching lowers both bills in the same proportion. This holds only if the same share of input is cached on both models, prices stay at list, and Astra stays under its 272,000-token step. It changes what you spend, not which model is cheaper. [1][3]",
          "Success rate. A run that fails and gets repeated costs twice. What you want is spend on all attempts divided by tasks that passed.",
        ],
      },
    ],
  },
  {
    id: "the-method-cost-per-successful-task",
    heading: "The method: cost per successful task",
    blocks: [
      {
        type: "p",
        text: "This is my own definition, not a vendor or industry standard, and it covers model-call cost only. It leaves out retrieval, infrastructure and the human time spent fixing bad output. The principle of dividing by successes, not requests, is also the one a cost guide from {{wavect.io|https://wavect.io/blog/llm-cost-calculator-2026/}} uses. [5]",
      },
      {
        type: "ul",
        items: [
          "Cost per attempt = (fresh input tokens x input price + cached tokens x cached price + output tokens x output price) / 1,000,000",
          "Cost per successful task = cost per attempt / success rate (as a fraction)",
        ],
      },
      {
        type: "p",
        text: "A worked example with made-up token counts, to show the arithmetic only. Say one attempt sends 20,000 fresh input tokens and gets 2,000 output tokens back, with nothing cached.",
      },
      {
        type: "ul",
        items: [
          "Neon: 20,000 x $3 / 1,000,000 = $0.06 input, plus 2,000 x $15 / 1,000,000 = $0.03 output, so $0.09 per attempt.",
          "Astra: 20,000 x $8 / 1,000,000 = $0.16 input, plus 2,000 x $40 / 1,000,000 = $0.08 output, so $0.24 per attempt.",
        ],
      },
      {
        type: "p",
        text: "Those token counts are placeholders. They are not measurements of any real task, and I have not measured cost per task for any model on any marketing job.",
      },
      {
        type: "p",
        text: "Now add success rates. Neon costs the same per finished task as Astra when its cost per attempt divided by its success rate equals Astra's. At the figures above, if Astra succeeds 100% of the time, Neon must succeed at least 37.5% of the time to break even ($0.09 / 0.375 = $0.24). At list prices with equal token counts, that lets Neon fail more than six times in ten and still match Astra. That is a wide margin, which is the reason to measure the other thing, token counts, on each model. If Astra writes half the output tokens on your task, the gap narrows. This method also ignores batch, flex and priority tiers and any discounts; it uses standard list prices only.",
      },
    ],
  },
  {
    id: "try-it-with-your-numbers",
    heading: "Try it with your numbers",
    blocks: [
      { type: "p", text: "Set up one column per model and fill in your own figures." },
      {
        type: "ul",
        items: [
          "Tasks per month (the same for both)",
          "Fresh input tokens, cached input tokens and output tokens per attempt, entered separately for each model, because output length differs",
          "Success rate per attempt, from your own test, for each model",
          "Input, cached and output price per million tokens, from the table above",
        ],
      },
      { type: "p", text: "Then work down each column:" },
      {
        type: "ol",
        items: [
          "Cost per attempt = (fresh x input price + cached x cached price + output x output price) / 1,000,000",
          "Cost per successful task = cost per attempt / success rate",
          "Monthly cost = cost per successful task x tasks per month",
        ],
      },
      {
        type: "p",
        text: "To find the break-even, take the Astra column's cost per attempt (c_A) and success rate (s_A), and Neon's cost per attempt (c_N). Neon matches Astra's cost per successful task at a success rate of s_A x c_N / c_A. With the example above and Astra at 100%, that is 1 x 0.09 / 0.24 = 37.5%. If the answer is above 100%, no success rate makes them equal and Astra is cheaper. If it is below 1%, Neon is cheaper at any success rate you would accept.",
      },
      {
        type: "p",
        text: "Check the limits before you trust a result. Fresh plus cached input must stay under 1 million tokens for Neon and 922,000 for Astra. Above 272,000 input tokens, use Astra's long-context prices ($16 input, $0.80 cached, $60 output), which apply to the whole request. [2][3] Prices change, so write down the date you took them from.",
      },
      // Replaces the hidden CALCULATOR INSERTION POINT comment in final.md (Gate B binding condition).
      { type: "helper" },
      {
        type: "callout",
        kind: "opinion",
        title: "My view (opinion)",
        paragraphs: [
          "My opinion, labelled as such: a model that costs more per token can be the cheaper choice, and a model that wins a leaderboard may lose on your invoice. The only number that settles it is your own prompt, run on both.",
        ],
      },
    ],
  },
  {
    id: "what-to-do-with-this",
    heading: "What to do with this",
    blocks: [
      {
        type: "ol",
        items: [
          "Pick one automation you already run, such as a report summary or a UTM audit.",
          "Run the same prompt 20 times on each model. Log input, cached and output tokens per run, and mark each result pass or fail against a check you wrote in advance.",
          "Enter the averages and success rates into the formulas above. Twenty runs gives a rough average, not a confidence interval.",
          "Re-run if a vendor changes prices. Neon's page is dated 18 Nov 2026; OpenAI's pages are undated and were read on 20 Nov 2026.",
        ],
      },
    ],
  },
];

export const sources = [
  {
    n: 1,
    title: "Introducing Gemini 4 Neon",
    outlet: "Google",
    date: "2026-11-18",
    dateLabel: "18 Nov 2026",
    url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/",
    supports: "Neon prices ($3 input, $0.15 cached, $15 output per million tokens), 1 million token context, the 32% lower cost per task claim and the AutomationBench result. All Google-reported.",
    status: "Opened and read, 20 Nov 2026",
    verified: true,
  },
  {
    n: 2,
    title: "GPT-6.2 Astra model page",
    outlet: "OpenAI developers",
    date: null,
    dateLabel: "No date shown, read 20 Nov 2026",
    url: "https://developers.openai.com/api/docs/models/gpt-6.2-astra",
    supports: "Astra prices, the 1,050,000 token context and the 922,000 input and 128,000 output limits.",
    status: "Opened and read, 20 Nov 2026",
    verified: true,
  },
  {
    n: 3,
    title: "API pricing",
    outlet: "OpenAI developers",
    date: null,
    dateLabel: "No date shown, read 20 Nov 2026",
    url: "https://developers.openai.com/api/docs/pricing",
    supports: "Astra short-context and long-context rates, including the step above 272,000 input tokens.",
    status: "Opened and read, 20 Nov 2026",
    verified: true,
  },
  {
    n: 4,
    title: "Gemini 4 Neon vs GPT-6.2 Astra",
    outlet: "Artificial Analysis",
    date: null,
    dateLabel: "No date shown, read 20 Nov 2026",
    url: "https://artificialanalysis.ai/models/comparisons/gemini-4-neon-vs-gpt-6-2-astra",
    supports: "Cost per task and minutes by effort level (Table 2). Third-party data. Values are matched to effort levels by position; only the Low row is confirmed by the page's own summary text.",
    status: "Opened and read, 20 Nov 2026. Level labels inferred.",
    verified: false,
  },
  {
    n: 5,
    title: "LLM cost calculator guide",
    outlet: "wavect.io",
    date: "2026-07-08",
    dateLabel: "Published 8 Jul 2026, reviewed 11 Nov 2026",
    url: "https://wavect.io/blog/llm-cost-calculator-2026/",
    supports: "The principle of dividing cost by successful tasks, not requests. The formula in this article is my own.",
    status: "Opened and read, 20 Nov 2026",
    verified: true,
  },
];

export const disclosure = {
  heading: "How this was made",
  body: [
    "AI agents researched and wrote this article, and a second agent checked it against the sources. I reviewed it and chose to publish it. The calculator was built the same way and runs only in your browser: nothing you type is sent or saved.",
    "If you find a mistake, tell me and I will fix it and add a dated note at the top. I will not edit it silently.",
  ],
};

export const related = [
  { href: "/blog/track-ai-mode-traffic-ga4", title: "Google says AI Mode earns less. What can you measure?", note: "A test you can run on your own GA4 property." },
  { href: "/blog/ai-agent-traffic-how-much-to-plan-for", title: "4 Uber rides from AI agents in Halloween week: what to plan for", note: "Sizing an AI change before you spend on it." },
];
