// Everything the post page shows. Copy of final.md (approved), split into blocks.
// Text markup: [n] links to source n, `code` is <code>, {{text|url}} is an external link.
// Only addition to the approved wording: [n] citation markers.
// The three "My opinion" lines and the unknown list are set as callouts; their words are unchanged.

export const SITE_URL = "https://measure-what-matter.netlify.app";

const B = "/blog/google-agent-allow-then-measure/";

export const post = {
  slug: "google-agent-allow-then-measure",
  title: "Google-Agent: allow it, then measure it in analytics",
  description:
    "Google published rules for letting its Google-Agent browse your site. What Google confirms, what is still untested in GA4, and a checklist to run.",
  author: "Megha Karnwal",
  // Date it went to the stage branch. lastChecked stays 25 Nov: the sources were last read that day.
  publishedAt: "2026-11-27",
  lastChecked: "2026-11-25",
  readMinutes: 5,
  headlineStat: { value: "3 checks", label: "Google lists to verify a Google-Agent request.", cite: [1] },
  shareImage: `${B}share-card.png`,
  updates: [],
};

export const heroImage = `${B}hero-bg.svg`;

export const lead =
  "Google has published rules for recognising \"Google-Agent\", the agent that browses sites and takes actions when a person asks it to. The rules are about letting it in: put an allow rule above your broad bot and cloud blocks, and skip CAPTCHAs for verified requests. [1] They say nothing about analytics, and I have not tested how GA4 treats these visits, so that half of the job is a checklist for you to run, not a finding.";

export const sections = [
  {
    id: "what-google-confirms",
    heading: "What Google confirms",
    blocks: [
      { type: "p", text: "Google's page \"Allow Google-Agent traffic\" was read on 25 Nov 2026. [1] The page shows no date. PPC Land reports it was published on 17 Nov 2026, so treat 17 Nov as PPC Land's date, not Google's. [3]" },
      { type: "p", text: "From the page itself:" },
      {
        type: "ul",
        items: [
          "Google-Agent is the name for agents hosted on Google infrastructure that browse the web and act when a user asks. [1]",
          "A request carries a User-Agent header containing \"Google-Agent\" and comes from an IP address listed in a file called user-triggered-agents.json. [1][2]",
          "If your CDN, firewall or bot service does not verify these requests for you, Google gives three checks: the User-Agent contains \"Google-Agent\", the IP is in that file, and, if present, the Web Bot Auth signature headers are valid. [1]",
          "Web Bot Auth is marked experimental on Google's page. Google is testing it with the identity https://agent.bot.goog, using HTTP Message Signatures. Not every request will be signed, per PPC Land, so do not make the signature a requirement. [1][3]",
          "Verified requests should skip bot challenges, including CAPTCHAs and JavaScript challenges, and including the small CAPTCHA widgets that fire on site search or form submission. [1]",
        ],
      },
      {
        type: "flow",
        title: "The three checks Google lists",
        start: "A request says it is Google-Agent",
        checks: [
          "The User-Agent contains \"Google-Agent\".",
          "The IP address is in user-triggered-agents.json.",
          "If present, the Web Bot Auth signature headers are valid. Experimental, and not every request is signed.",
        ],
        result: "Verified. Skip bot challenges, including CAPTCHAs and JavaScript challenges.",
        caption: "The layout is mine. The checks come from Google's page and PPC Land's summary of it. The figure shows no order for the three checks, because this article states none.",
        cites: [1, 3],
      },
      { type: "p", text: "Search Engine Journal covered it on 23 Nov 2026. It adds that Google lists actions the agent can take: searching within a site, filtering results, adding items to a cart, making bookings, and calling site APIs. SEJ also links the guidance to Google's expansion of Personal Intelligence. That link is SEJ's reading. SEJ itself says Google has not connected the two. [4]" },
    ],
  },
  {
    id: "why-allowed-is-harder-than-it-sounds",
    heading: "Why \"allowed\" is harder than it sounds",
    blocks: [
      { type: "p", text: "Google's troubleshooting section, which PPC Land condenses into six points, describes how a site can think it has allowed the agent and still block it. [1][3]" },
      { type: "p", text: "The allow rule must be evaluated before cloud or data-centre ASN blocks, managed bot rules and category blocks on AI agents. Otherwise those rules win. The allowance has to cover the whole journey, not the homepage: on-site search, filtering, detail pages, add-to-cart, booking, and XHR, GraphQL or api.* calls. Per-IP rate limits can trip because many users share the same egress addresses. IP rules go out of date unless they follow the published file. And proxies or load balancers that strip the client IP, User-Agent or signature headers break verification before it starts. [1][3]" },
      {
        type: "stack",
        title: "Where the allow rule goes",
        top: "Allow rule for verified Google-Agent requests",
        below: ["Cloud and data-centre ASN blocks", "Managed bot rules", "Category blocks on AI agents"],
        caption: "Otherwise those win. The layout is mine, and no order is claimed among the three blocks. The allow rule's place comes from Google's page and PPC Land.",
        cites: [1, 3],
      },
      { type: "callout", kind: "opinion", title: "My opinion", paragraphs: ["My opinion: the journey point is the one most teams will miss. A rule that lets the agent load a product page but challenges the add-to-cart call is worse than a clean block, because it fails halfway through someone's task and you never hear about it."] },
    ],
  },
  {
    id: "what-was-checked-and-what-was-not",
    heading: "What was checked, and what was not",
    blocks: [
      { type: "p", text: "This section is short on purpose." },
      { type: "p", text: "How the team checked on 25 Nov 2026: a request for Google's user-triggered-agents.json with an Origin header returned HTTP 200 and no Access-Control-Allow-Origin header. That is one request from one machine. It is not a test of every browser. [2]" },
      { type: "callout", kind: "opinion", title: "My opinion", paragraphs: ["My opinion, not a finding: I would not build a page that fetches the file live from a visitor's browser."] },
      { type: "p", text: "The file carries a `creationTime` field. On 25 Nov 2026 it read 2026-11-23T15:46:09. [2] I am not copying any IP ranges into this post, because a stale copy in a firewall context gives wrong answers. Fetch the file fresh from Google, read its `creationTime`, and rebuild your rules from it." },
      { type: "p", text: "What was not done: nobody has run Google-Agent against a GA4 property, a GTM container or a server log. Nobody has searched my server logs for it, so this post makes no claim that Google-Agent visits my site." },
    ],
  },
  {
    id: "what-is-unknown-not-tested",
    heading: "What is unknown, not tested",
    blocks: [
      {
        type: "callout",
        kind: "unknown",
        title: "Unknown, not tested",
        paragraphs: ["These are open questions, and I have not answered them:"],
        items: [
          "Whether GA4 records a Google-Agent visit at all. Unknown, not tested.",
          "Whether it runs your page JavaScript, and so whether a GA4 or GTM tag fires. Unknown, not tested. Google's page mentions JavaScript only in the context of challenges. [1]",
          "Whether GA4 filters it as a known bot, or whether it lands in Direct or another channel. Unknown, not tested.",
          "Whether a purchase made through the agent reports to your analytics at all. Unknown, not tested.",
        ],
        after: ["Neither Google's page, PPC Land nor SEJ addresses analytics. If someone gives you a confident answer to these, ask where they tested it and when. [1][3][4]"],
      },
    ],
  },
  {
    id: "what-to-do-with-this",
    heading: "What to do with this",
    blocks: [
      { type: "p", text: "First, allow it properly. In your CDN or firewall, add a rule that matches the User-Agent and the IP list, place it above the broad blocks, and exempt it from CAPTCHAs and JavaScript challenges on search, filter, cart and booking steps. Check the rate limits and check that your proxy passes the client IP and headers through. Then use your own test traffic to confirm the add-to-cart call still works." },
      { type: "p", text: "Second, find out whether you have been seeing it. Search your raw server or CDN logs for \"Google-Agent\" over the last two weeks. Count the requests, note which paths they hit, and note whether they were challenged or blocked. A log is the only evidence that counts here, and it tells you how much of this matters to you before you spend more time." },
      { type: "p", text: "Third, if the log shows visits, tag them before you analyse them. In server-side GTM or at the log layer, add a field such as `agent_type = google_agent` when the User-Agent matches. Do not rely on the User-Agent alone for anything that matters, since anyone can send that header. Pair it with the IP check." },
      { type: "callout", kind: "opinion", title: "My opinion", paragraphs: ["Fourth, my opinion on counting: keep agent sessions out of your conversion rate and your A/B test results until you know what they are. Report them as a separate segment. A person asking an agent to buy is a real customer, but their journey does not behave like a browsing visitor, and mixing the two will move your averages for reasons you cannot explain."] },
      { type: "p", text: "Last, if you want an answer for your own stack, run the test I have not run: after the allow rule is live, watch a GA4 realtime view and your server logs together when a verified request arrives, and write down what you see and the date. Then you will have a finding instead of a guess." },
    ],
  },
];

export const sources = [
  {
    n: 1,
    title: "Allow Google-Agent traffic",
    outlet: "Google",
    date: null,
    dateLabel: "No date shown, read 25 Nov 2026",
    url: "https://developers.google.com/crawling/docs/crawlers-fetchers/allow-google-agent",
    supports: "What Google-Agent is, the User-Agent and IP checks, the experimental Web Bot Auth signature, skipping bot challenges, the allow-rule order and the troubleshooting causes. The page does not mention analytics. 17 Nov 2026 is its publication date per PPC Land, not shown by Google.",
    status: "Opened and read, 25 Nov 2026",
    verified: true,
  },
  {
    n: 2,
    title: "user-triggered-agents.json",
    outlet: "Google",
    date: "2026-11-23",
    dateLabel: "creationTime 2026-11-23T15:46:09, as observed 25 Nov 2026",
    url: "https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json",
    supports: "That the file exists and has a creationTime field. No IP ranges are copied. Fetch it fresh. The no-CORS-header result is one request from one machine on 25 Nov 2026.",
    status: "Observed by the team on 25 Nov 2026, not re-fetched by the writer",
    verified: false,
  },
  {
    n: 3,
    title: "Google lists six ways sites still block its AI agent after allowing it",
    outlet: "PPC Land (Luís Rijo)",
    date: "2026-11-17",
    dateLabel: "17 Nov 2026",
    url: "https://ppc.land/google-lists-six-ways-sites-still-block-its-ai-agent-after-allowing-it/",
    supports: "Google's publication date (PPC Land's report), the six blocking causes, and that not every request is signed. Does not mention analytics.",
    status: "Opened and read, 25 Nov 2026",
    verified: true,
  },
  {
    n: 4,
    title: "Google publishes guidance for Google-Agent crawler",
    outlet: "Search Engine Journal (Roger Montti)",
    date: "2026-11-23",
    dateLabel: "23 Nov 2026",
    url: "https://www.searchenginejournal.com/google-publishes-guidance-for-google-agent-crawler/598526/",
    supports: "The list of actions the agent can take. The Personal Intelligence link is SEJ's reading, and SEJ says Google has not connected the two. Does not discuss analytics.",
    status: "Opened and read, 25 Nov 2026",
    verified: true,
  },
];

export const disclosure = {
  heading: "How this was made",
  body: [
    "AI agents researched and wrote this article, and a second agent checked it against the sources. I reviewed it and chose to publish it. There is no calculator or tool on this page.",
    "If you find a mistake, tell me and I will fix it and add a dated note at the top. I will not edit it silently.",
  ],
};

export const related = [
  { href: "/blog/ai-agent-traffic-how-much-to-plan-for", title: "4 Uber rides from AI agents in Halloween week: what to plan for", note: "Sizing an AI change before you spend on it." },
  { href: "/blog/track-ai-mode-traffic-ga4", title: "Google says AI Mode earns less. What can you measure?", note: "A test you can run on your own GA4 property." },
];
