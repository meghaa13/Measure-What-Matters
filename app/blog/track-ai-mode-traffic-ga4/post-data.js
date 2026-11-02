// Everything the post page shows. Copy of final.md (approved), split into blocks.
// Text markup: [n] becomes a link to source n, **bold** becomes <strong>.
// Do not edit the wording here without editing the article first.

export const SITE_URL = "https://meghakarnwal.com";

const B = "/blog/track-ai-mode-traffic-ga4/";

export const post = {
  slug: "track-ai-mode-traffic-ga4",
  category: "Analytics · AI Mode",
  title: "Google says AI Mode earns less. What can you measure?",
  description:
    "Google says AI Mode monetises less well but gave no figures. What Search Console can show, what GA4 may hide, and a test you can run today.",
  standfirst:
    "Google says AI Mode monetises less well but gave no figures. Search Console counts the clicks but will not split them out. Whether GA4 labels them correctly is something to test on your own property.",
  author: "Megha Karnwal",
  // The run date is the default publish date. Megha sets the real one before publishing.
  publishedAt: "2026-11-02",
  lastChecked: "2026-11-02",
  readMinutes: 6, // final.md is about 1,150 words
  headlineStat: { value: "$63.35bn", label: "Google Search and other revenue, Q3 2026. No AI Mode split.", cite: 1 },
  // Share image: export images/share-card.svg to a 1200x630 PNG (social sites ignore SVG).
  shareImage: `${B}share-card.png`,
  updates: [], // add { date: "2026-11-12", note: "..." } here; the page shows them under the byline
};

export const heroImage = `${B}hero-bg.svg`;
export const heroArt = `${B}hero-art.svg`;

// One illustration per major section, shown under its heading. All are SVG built from the article's
// own words or from numbers in sources.md; none is a screenshot.
export const sectionArt = {
  "what-google-said": {
    src: `${B}revenue.svg`, width: 800, height: 400,
    alt: "Bar chart, US dollars million, axis from zero. Google Search and other revenue was 56,567 in Q3 2025 and 63,350 in Q3 2026, about 12 percent growth by the writer's arithmetic. The release does not mention AI Mode.",
    caption: "Figure 1. Google Search and other revenue, Q3 2025 and Q3 2026, US$ million. The release does not split out AI Mode.",
    cites: [1],
  },
  "what-search-console-shows": {
    src: `${B}counts.svg`, width: 800, height: 320,
    alt: "Diagram. A click on an external link in AI Mode counts as a click, with position measured the same way as a normal results page, and is reported under the Web search type. There is no AI Mode only filter.",
    caption: "Figure 2. How Search Console treats an AI Mode click. Illustration, no data plotted.",
    cites: [3, 4],
  },
  "what-ga4-does": {
    src: `${B}ga4-fork.svg`, width: 800, height: 340,
    alt: "Diagram. How GA4 labels an AI Mode visit is not documented. Two outcomes are possible and neither is confirmed: inside Direct, or inside google / organic.",
    caption: "Figure 3. Two possible outcomes in GA4, both unconfirmed. Illustration, no data plotted.",
    cites: [4, 5],
  },
  "a-test-you-can-run": {
    src: `${B}test-flow.svg`, width: 800, height: 340,
    alt: "Method diagram of five steps: pick a page, click through from AI Mode on several browsers and devices, read GA4, optionally query BigQuery, and check Search Console over many days. Repeat the GA4 part about ten times.",
    caption: "Figure 4. The test as five steps. No data plotted: you produce the numbers.",
    cites: [5],
  },
  "what-to-do": {
    src: `${B}todo.svg`, width: 800, height: 300,
    alt: "Four moves: run the test this week and re-run it in a quarter, use Search Console clicks as your cleanest count, judge AI Mode ads on your own conversions and cost per acquisition, and add a dated note to your reporting.",
    caption: "Figure 5. The closing actions. Illustration, no data plotted.",
    cites: [],
  },
};

export const lead =
  "On Alphabet's Q3 results day (28 October), Google's Chief Business Officer acknowledged \"the lower monetization we were seeing in AI Mode\", according to Marketing Dive. [2] He gave no size for the gap. Per Google's two documentation pages, Search Console counts AI Mode clicks and position but does not split them out. [3][4] Whether GA4 labels those visits correctly is something to test on your own property, not take on trust from a blog post. That includes this one.";

export const sections = [
  {
    id: "what-google-said",
    heading: "What Google said, and what it did not",
    blocks: [
      {
        type: "p",
        text: "Alphabet reported Google Search and other revenue of $63,350 million for Q3 2026, against $56,567 million a year earlier (SEC 8-K exhibit 99.1, 28 Oct 2026). [1] That is about 12% growth, by my own arithmetic. The release does not mention AI Mode at all.",
      },
      {
        type: "p",
        text: "The AI Mode comments come from coverage of the earnings call. Marketing Dive (Peter Adams, 29 Oct) reports that Philipp Schindler, asked about the gap between search activity and revenue, pointed to strong growth in AI Mode queries and \"the lower monetization we were seeing in AI Mode\". The same article says AI Mode is expanding its ads offering internationally, that Google plans a multiturn ad format for follow-up queries in the US, and that Search has fallen short of analyst estimates for a second straight quarter. [2]",
      },
      {
        type: "p",
        text: "Note what is missing. No percentage, no click-through rate, no cost-per-click comparison. I found no independent data that sizes the gap.",
      },
      {
        type: "callout",
        kind: "opinion",
        title: "My view (opinion)",
        paragraphs: [
          "Do not set a budget or a forecast from Google's averages about AI Mode, in either direction. Schindler tied the effect to strong growth in AI Mode queries. That is a statement about Google's mix of queries and Google's revenue. It says nothing about your conversion rate or your cost per acquisition. [2]",
        ],
      },
    ],
  },
  {
    id: "what-search-console-shows",
    heading: "What Search Console does show",
    blocks: [
      {
        type: "p",
        text: "This part is documented by Google. The Search Console help page says that clicking a link to an external page in AI Mode counts as a click, and that position in AI Mode follows the same methodology as a normal results page (page undated). [3] Google's Search Central page on AI features says this traffic is included in overall search traffic and reported in the Performance report under the \"Web\" search type (last updated 10 Dec 2025). [4]",
      },
      {
        type: "p",
        text: "Read that carefully. AI Mode is counted. On the strength of those two pages, it is not split out, so you cannot filter the Performance report to \"AI Mode only\". The help page also says data from Search Labs experiments is excluded. [3]",
      },
    ],
  },
  {
    id: "what-ga4-does",
    heading: "What GA4 does with AI Mode clicks: unresolved",
    blocks: [
      {
        type: "p",
        text: "I looked for Google documentation on how GA4 labels a click from AI Mode. I did not find any. Google's AI features page says only that you \"could also track conversions and time spent on your site in other tools, such as Google Analytics\". It says nothing about referrers. [4]",
      },
      {
        type: "callout",
        kind: "limits",
        title: "What this does not show",
        paragraphs: [
          "I did not review third-party reports on this, so I cannot tell you what they say or whether they agree. The honest position: unresolved from official sources, and the answer may differ by browser, app and date.",
        ],
      },
      {
        type: "p",
        text: "That uncertainty matters. If AI Mode visits sit inside Direct, your Direct line grows for no reason you can see. If they sit inside google / organic, your organic line mixes two different kinds of visit.",
      },
    ],
  },
  {
    id: "a-test-you-can-run",
    heading: "A test you can run on your own property",
    blocks: [
      { type: "p", text: "You need a browser, a phone and some patience. No numbers are assumed here. You produce your own." },
      {
        type: "ol",
        items: [
          "Pick a page on your site that appears as a link in AI Mode for an ordinary query. If you cannot find one, ask AI Mode a question about your brand name, or test with any site you own and can measure.",
          "Run that query in AI Mode and click through to your page. Do it on desktop Chrome, on a phone, and in a second browser. Write down the time and the landing page of each visit.",
          "In GA4, open the Realtime report straight away. Later, open the Traffic acquisition and Landing page reports and record the session source / medium of each test visit. I have not verified how long standard reports take to fill, and Google's GA4 help page for the Traffic acquisition report states no delay, so check again later and note when the rows appeared. [5]",
          "If you export GA4 to BigQuery, query the events for that landing page and time window, and record the traffic source fields on those sessions.",
          "In Search Console, look at the same page and date in the Performance report. A click should count under \"Web\" but will not carry an AI Mode label. I have not verified how quickly Search Console shows data, so treat it as a check over many days, not a receipt for one click. [3][4]",
        ],
      },
      {
        type: "p",
        text: "Repeat the GA4 part about ten times across browsers and devices. If every visit shows as google / organic, you have your answer for those conditions. If some show as direct, you have found a leak, and you know which browser or device causes it. Record the result and the date. Google can change this at any time.",
      },
      {
        type: "callout",
        kind: "limits",
        title: "What this does not show",
        paragraphs: [
          "One visit proves almost nothing. A pattern across devices tells you something. And it is evidence about your setup only, not about the web in general.",
        ],
      },
    ],
  },
  {
    id: "what-to-do",
    heading: "What to do with this",
    blocks: [
      { type: "p", text: "Run the test above this week and re-run it in a quarter. Keep the notes." },
      { type: "p", text: "A rising Direct line with no campaign behind it deserves a look at which landing pages it sits on. That is a lead, not proof." },
      { type: "p", text: "Use Search Console clicks as your cleanest count of Google search traffic, knowing it includes AI Mode and cannot separate it. [3][4]" },
      { type: "p", text: "If you buy AI Mode ads, judge them on your own conversions and cost per acquisition against a matched period of ordinary search. Ignore Google's averages." },
      { type: "p", text: "Finally, put a dated note in your reporting saying how you treat AI Mode traffic, so next year's reader knows what the number meant." },
    ],
  },
];

export const sources = [
  {
    n: 1,
    title: "Alphabet Q3 2026 earnings release (SEC 8-K, exhibit 99.1)",
    outlet: "Alphabet Inc. via SEC EDGAR",
    date: "2026-10-28",
    dateLabel: "28 Oct 2026",
    url: "https://www.sec.gov/Archives/edgar/data/0001652044/000165204426000080/googexhibit991q32026.htm",
    supports: "Search and other revenue of $63,350m (Q3 2026) against $56,567m (Q3 2025). The release does not mention AI Mode. The 12% is the writer's arithmetic.",
    status: "Opened by the writer, checked 2 Nov 2026",
    verified: true,
  },
  {
    n: 2,
    title: "Google's AI overhaul of search hits snags as ad revenue growth cools",
    outlet: "Marketing Dive, Peter Adams",
    date: "2026-10-29",
    dateLabel: "29 Oct 2026",
    url: "https://marketingdive.com/news/googles-ai-overhaul-of-search-hits-snags-as-ad-revenue-growth-cools/873150",
    supports: "Schindler's comment on the earnings call, AI Mode ads expanding internationally, the planned multiturn ad format, and Search missing analyst estimates a second quarter running.",
    status: "Reopened by the writer, 2 Nov 2026",
    verified: true,
  },
  {
    n: 3,
    title: "Search Console Help: performance report data",
    outlet: "Google Search Console Help",
    date: null,
    dateLabel: "Undated",
    url: "https://support.google.com/webmasters/answer/7042828",
    supports: "An AI Mode click on an external link counts as a click; position follows the normal methodology; Search Labs data is excluded.",
    status: "Reopened by the writer, 2 Nov 2026",
    verified: true,
  },
  {
    n: 4,
    title: "AI features and your website",
    outlet: "Google Search Central",
    date: "2025-12-10",
    dateLabel: "Updated 10 Dec 2025",
    url: "https://developers.google.com/search/docs/appearance/ai-features",
    supports: "AI feature traffic is included in overall Search Console traffic under \"Web\". Suggests tracking conversions in tools such as Google Analytics. No mention of referrers.",
    status: "Opened by the writer, checked 2 Nov 2026",
    verified: true,
  },
  {
    n: 5,
    title: "[GA4] Traffic acquisition report",
    outlet: "Google Analytics Help",
    date: null,
    dateLabel: "Undated",
    url: "https://support.google.com/analytics/answer/12923437",
    supports: "Names the Realtime, Traffic acquisition and Landing page reports, and states no data delay. Does not cover AI Mode labelling.",
    status: "Opened by the writer, checked 2 Nov 2026",
    verified: true,
  },
];

export const disclosure = {
  heading: "How this article was made",
  body: [
    "AI agents researched, wrote and fact-checked this article. A separate checking agent compared claims with their sources and sent the draft back for fixes before it reached me.",
    "I read it, correct it and publish it.",
    "Dates on sources are the dates the outlets give. Google's help pages are undated unless stated. The 12% growth figure is my own arithmetic from the two revenue numbers in source 1.",
  ],
};

export const related = [
  { title: "Lead Path X-Ray", href: "/apps/lead-path", note: "Follow one visit from an ad link to the CRM and see where its source gets lost." },
  { title: "Tag Health Scan", href: "/apps/tag-scanner", note: "Scan a site's Google tag and GTM setup." },
  { title: "CRO X-Ray", href: "/apps/cro-xray", note: "Conversion problems you can't see from your own desk, with the evidence." },
];
