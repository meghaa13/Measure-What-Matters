// Everything the post page shows. Copy of final-voice.md (the conversational rewrite), split into blocks.
// Text markup: [n] becomes a link to source n, **bold** becomes <strong>, `x` becomes <code>.
// The only additions to the article's words are the [n] citation markers and the figure captions.
// Do not edit the wording here without editing the article first.

export const SITE_URL = "https://measure-what-matter.netlify.app";

const B = "/blog/ai-agent-traffic-how-much-to-plan-for/";

export const post = {
  slug: "ai-agent-traffic-how-much-to-plan-for",
  category: "AI agents · Measurement",
  // Verbatim from final-voice.md
  title: "4 Uber rides from AI agents in Halloween week: what to plan for",
  description:
    "Uber, DoorDash and Airbnb report tiny agent volumes. Measure your own AI traffic in GA4 and server logs, and set a threshold for acting.",
  author: "Megha Karnwal",
  // The run date is the default publish date. Megha sets the real one before publishing.
  publishedAt: "2026-11-18",
  lastChecked: "2026-11-17",
  readMinutes: 6,
  headlineStat: { value: "4", label: "rides fulfilled from agents in Uber's Halloween week, out of around 320 million trips", cite: 1 },
  // 1200x630 PNG exported from share-card.svg (social sites ignore SVG).
  shareImage: `${B}share-card.png`,
  updates: [],
};

// Hero illustration: a crowd of human-visit dots with four highlighted dots. Illustration only, not a data chart.
export const heroCrowd = `${B}hero-crowd.svg`;

// The method diagram (no data). Shown in the GA4 section.
export const methodFig = {
  src: `${B}sees.svg`, width: 800, height: 400,
  alt: "Two-column method diagram, no numbers. GA4's AI Assistant channel counts sessions that arrive with a referrer from a chatbot, which means people who clicked a link. It misses an agent with no referrer or one that does not run the GA4 script, which can show as direct or as a bot. That is the author's observation. Server or CDN logs count non-browser requests by user-agent and path in a known-AI bucket and an unidentified automated bucket. The log alone cannot say the unidentified bucket is an agent.",
  caption: "Figure 1. What each source can see. The Misses and Cannot tell rows are my experience, not a published rule.",
  cites: [5],
};

// Real capture of Google's help page. Sidecar: ux/sources/ga-default-channel-ai-assistant.md
export const shot = {
  src: `${B}ga-default-channel-ai-assistant.png`, width: 770, height: 150,
  alt: "Google Analytics Help table listing the AI Assistant default channel: users arriving from sources like ChatGPT, Gemini, Deepseek, Copilot or Grok, excluding Google AI Overviews and AI Mode.",
  caption: "Google Analytics Help, Default channel group (support.google.com/analytics/answer/9756891), captured 18 Nov 2026.",
  url: "https://support.google.com/analytics/answer/9756891",
  transcript: [
    "AI Assistant",
    "AI Assistant is the channel by which users arrive at your site from sources like ChatGPT, Gemini, Deepseek, Copilot, or Grok. It excludes Google's AI Overviews and AI Mode.",
  ],
};

export const lead = [
  "Halloween week at Uber. Around 320 million trips across Uber and Uber Eats. And the number of Uber rides that an outside AI agent completed? Four. Not four million. Four. [1]",
  "So how much agent traffic should you plan for on your own site? Three of the biggest consumer platforms have told investors that outside AI agents send them almost no business. [1][2][3][4] For most small and mid-size sites, my answer is very little today, but start counting it now, because counting costs an afternoon and guessing costs a budget. Below you will find the numbers each company reported, a GA4 and server-log method, and a threshold for when to act. The threshold is my opinion, and I label it as such.",
];

// opener = how the heading is drawn: rule (hairline), numeral (big number beside), panel (tinted), rule2 (heavy rule)
export const sections = [
  {
    id: "what-the-three-companies-said",
    heading: "What the three companies said",
    opener: "rule",
    blocks: [
      {
        type: "p",
        text: "Each figure covers a different period and a different kind of business. I list them one by one and do not compare or rank them.",
      },
      {
        // One card per company, no shared scale, no ranking, no combined chart.
        type: "companies",
        items: [
          {
            name: "Uber",
            period: "Q3 2026 call, 4 Nov 2026",
            figure: "4 rides",
            figureNote: "in the Halloween week, out of around 320 million trips on Uber and Uber Eats; about 500 Uber Eats orders",
            text: "On its Q3 2026 call on 4 Nov 2026, CFO Balaji Krishnamurthy said the week that included Halloween was one of Uber's largest, with \"just around 320 million trips on Uber and Uber Eats\". Then the number that makes the headline: \"for our Rides business, it was a grand total of 4 trips that we have fulfilled from agents\". For Uber Eats the transcript reads \"around 500. 500 orders total\", so about 500 orders. CEO Dara Khosrowshahi called it \"very, very early and very limited traction\" and said Uber is building its own AI experiences and negotiating terms of trade with outside AI companies. The CFO framed the 4 and the 500 as last week's figures, so read them as a snapshot, not a quarterly total. [1]",
          },
          {
            name: "DoorDash",
            period: "Q3 call, 29 Oct 2026",
            figure: "Several hundred orders",
            figureNote: "in total; no start date and no exact number given",
            text: "On its Q3 call on 29 Oct 2026, CEO Tony Xu said \"we're seeing maybe several hundred orders in total from some of these third-party agents\". In another answer he said agents had generated several hundred orders \"across the time that they've been up and running\". That wording points to a running total since launch. Xu gave no start date and no exact number. [2]",
          },
          {
            name: "Airbnb",
            period: "Q3 call, 5 Nov 2026",
            figure: "\"Very nonmaterial\"",
            figureNote: "number of bookings on Muse and Instinct; no count given",
            text: "On its Q3 call on 5 Nov 2026, CEO Brian Chesky said: \"We do have nearly 0.5 million bookings a day and a very nonmaterial number of bookings happen on Muse and Instinct.\" Both are outside AI agents. Fortune identifies Muse as Meta's agent, launched in September. As for Instinct, neither Fortune nor the transcript says what it is. Chesky also said \"we're not seeing a lot of traffic today and it's not really increased over the last 4 weeks\". [3][4]",
          },
        ],
      },
      {
        type: "p",
        text: "Fortune ran all three together on 10 Nov 2026, but I did not take its word for the quotes. I checked each one against the company's own call transcript. One catch: Motley Fool, which publishes the transcripts, warns they may contain errors, so treat exact wording as close, not certified. [1][2][3][4]",
      },
    ],
  },
  {
    id: "what-these-numbers-do-and-do-not-tell-you",
    heading: "What these numbers do and do not tell you",
    opener: "panel",
    blocks: [
      {
        type: "p",
        text: "They tell you that on these platforms, in these weeks, agent-completed orders were close to zero.",
      },
      {
        type: "callout",
        kind: "limits",
        title: "What this does not show",
        paragraphs: [
          "What they do not tell you is how many agent visits never convert. An agent can read your pages, check a price and leave. None of these figures count that.",
        ],
      },
      {
        type: "p",
        text: "They also say little about your site. Uber, DoorDash and Airbnb are large apps with their own assistants and partner deals. A product-comparison site or a B2B lead-gen site may see a different mix. That is the argument for measuring.",
      },
    ],
  },
  {
    id: "what-ga4-can-and-cannot-see",
    heading: "What GA4 can and cannot see",
    opener: "numeral",
    blocks: [
      {
        type: "p",
        text: "Start with what GA4 is not. GA4 does not detect agents. It records sessions that arrive with a referrer.",
      },
      {
        type: "p",
        text: "Google's Default Channel Group now has an \"AI Assistant\" channel. Google describes it as the channel by which users arrive \"from sources like ChatGPT, Gemini, Deepseek, Copilot, or Grok\", and defines it by the medium exactly matching \"ai-assistant\". It excludes Google's AI Overviews and AI Mode. Google's page names those five as examples and does not publish the full referrer list, so do not assume other assistants are included. [5] Search Engine Journal reported the new channel on 14 May 2026, noting that until then all AI chatbot traffic landed in the Referral bucket by default. [6]",
      },
      { type: "shot" },
      {
        type: "p",
        text: "So this channel counts people who clicked a link in a chatbot. An agent that browses your site on someone's behalf is a different animal. In my experience, it often carries no referrer, and can show up as direct traffic or as a bot. That is my observation, not a published rule. Treat the GA4 number as a floor for \"AI-influenced human visits\", not as agent traffic.",
      },
      { type: "method" },
    ],
  },
  {
    id: "a-measurement-method-you-can-run-this-week",
    heading: "A measurement method you can run this week",
    opener: "rule2",
    blocks: [
      {
        type: "steps",
        items: [
          "**Count AI-assistant sessions in GA4.** The Default Channel Group dimension is available in the Acquisition reports. Google's help page does not give an exact menu path, and menu names change. Set the primary dimension to Session default channel group and note the AI Assistant row. Then check Session source / medium for medium `ai-assistant`, and look in Referral for chatbot domains, since traffic before the channel existed was reported in Referral by default. If the channel is empty, that is an answer too. [5][6]",
          "**Compare conversions.** For the same period, record sessions, key events and revenue for AI Assistant against all traffic. Small counts are noisy, so look at three months, not three days.",
          "**Check your server or CDN logs for non-browser requests.** GA4 relies on a script running in the browser, and in my experience many agents and crawlers never run it, so they do not appear. Count requests per day by user-agent and path from your host, CDN or web server logs. Group the known AI user-agents that vendors publish, and keep a separate bucket for requests that look automated but do not identify themselves. The log alone cannot tell you the second bucket is an agent. Treat it as a lead to investigate.",
          "**Look at what they request.** Agents that fetch product, price or checkout pages matter more to you than crawlers reading blog posts. Record the top 20 paths for each bucket.",
          "**Write three numbers in one row per month.** AI Assistant sessions as a share of all sessions, AI Assistant conversions as a share of all conversions, and automated log requests as a share of all requests. Keep the row. The trend is the finding.",
        ],
      },
      {
        type: "p",
        text: "If you use BigQuery export for GA4, the same count is a query on session source and medium. If you do not, the UI steps above are enough.",
      },
    ],
  },
  {
    id: "when-to-act",
    heading: "When to act (my opinion)",
    opener: "panel",
    blocks: [
      {
        type: "callout",
        kind: "opinion",
        title: "My view",
        paragraphs: [
          "This is my rule of thumb, not a standard. I have no data from your site, and the platforms above give no basis for a universal number. The 1% and 5% lines are judgement calls.",
        ],
      },
      {
        type: "ul",
        items: [
          "**Under 1% of sessions and conversions:** do nothing to your checkout or product feeds for agents. Keep logging. A single agent order, as Uber's four rides show, is a reason to inspect the pages involved, not to build anything. [1]",
          "**1% to 5%, or rising for three months in a row:** inspect the pages agents request, check they load without JavaScript, and make sure price, stock and policy text is in plain HTML.",
          "**Over 5% of sessions or conversions:** agent-specific work, such as feeds, structured data and access rules, has a measured case.",
        ],
      },
      {
        type: "p",
        text: "Two risks cut the other way. Spending on \"agent-ready\" checkout before you have a single agent order is a guess. Blocking everything automated before you know what it is can also cut you off from a channel that grows later. Count first.",
      },
    ],
  },
  {
    id: "what-to-do",
    heading: "What to do with this",
    opener: "numeral",
    blocks: [
      {
        type: "ul",
        items: [
          "This week: pull the AI Assistant row from GA4 for the last 90 days and write down the number, even if it is zero.",
          "Ask whoever hosts your site or CDN for one week of raw access logs, and run the user-agent count from step 3.",
          "Put the monthly three-number row in your reporting sheet, and set a calendar reminder to apply the thresholds in three months.",
          "Revisit when a platform you sell on announces agent checkout, not when a headline says agents are coming.",
        ],
      },
    ],
  },
];

export const sources = [
  {
    n: 1,
    title: "Uber Q3 2026 earnings call transcript",
    outlet: "Motley Fool transcript, hosted on Yahoo Finance",
    date: "2026-11-04",
    dateLabel: "Call of 4 Nov 2026",
    url: "https://finance.yahoo.com/markets/stocks/articles/uber-uber-q3-2026-earnings-191625118.html",
    supports: "The CFO's 320 million trips, 4 rides and about 500 Uber Eats orders, and the CEO's \"very limited traction\" remark. A transcript, not Uber's own release.",
    status: "Opened by the writer and the critic",
    verified: true,
  },
  {
    n: 2,
    title: "DoorDash Q3 2026 earnings call transcript",
    outlet: "Motley Fool",
    date: "2026-10-29",
    dateLabel: "Call of 29 Oct 2026",
    url: "https://www.fool.com/earnings/call-transcripts/2026/10/29/doordash-dash-q3-2026-earnings-call-transcript/",
    supports: "Tony Xu's \"several hundred orders\" from third-party agents. That this is a running total since launch is the writer's reading.",
    status: "Opened and checked",
    verified: true,
  },
  {
    n: 3,
    title: "Airbnb Q3 2026 earnings call transcript",
    outlet: "Motley Fool",
    date: "2026-11-05",
    dateLabel: "Call of 5 Nov 2026, transcript published 6 Nov",
    url: "https://www.fool.com/earnings/call-transcripts/2026/11/06/airbnb-abnb-q3-2026-earnings-call-transcript/",
    supports: "Brian Chesky on bookings a day, the \"very nonmaterial\" number on Muse and Instinct, and traffic not rising over 4 weeks. The transcript does not say what Muse or Instinct is.",
    status: "Opened and checked",
    verified: true,
  },
  {
    n: 4,
    title: "AI agents at Uber, DoorDash and Airbnb: limited traction",
    outlet: "Fortune",
    date: "2026-11-10",
    dateLabel: "10 Nov 2026",
    url: "https://fortune.com/2026/11/10/ai-agents-uber-doordash-airbnb-limited-traction/",
    supports: "Ran the three calls together. Identifies Muse as Meta's agent, launched in September. Says nothing further on Instinct.",
    status: "Muse as Meta's agent rests on this one source",
    verified: false,
  },
  {
    n: 5,
    title: "Default Channel Group",
    outlet: "Google Analytics Help",
    date: null,
    dateLabel: "No date on page",
    url: "https://support.google.com/analytics/answer/9756891",
    supports: "The \"AI Assistant\" channel, its named examples, the medium match, and the exclusion of AI Overviews and AI Mode. Google does not publish the full referrer list or an exact report path.",
    status: "Opened and checked",
    verified: true,
  },
  {
    n: 6,
    title: "Report of the GA4 AI Assistant default channel group",
    outlet: "Search Engine Journal",
    date: "2026-05-14",
    dateLabel: "14 May 2026",
    url: "https://www.searchenginejournal.com/google-analytics-adds-ai-assistant-as-default-channel-group/574974/",
    supports: "That the channel is new, and that until then all AI chatbot traffic landed in the Referral bucket by default. It does not say whether history is reclassified.",
    status: "Opened by the critic",
    verified: true,
  },
];

// Printed under the list.
export const alsoCovered =
  "The 1%, 5% and three-month thresholds, and the points marked \"in my experience\", are my opinion and are not sourced.";

export const disclosure = {
  heading: "How this article was made",
  body: [
    "AI agents researched, wrote and fact-checked this article. A separate checking agent compared claims with their sources and sent the draft back for fixes before it reached me.",
    "I read it, correct it and publish it.",
    "Company quotes come from earnings call transcripts, which may contain transcription errors. Muse as Meta's agent comes from one source, Fortune.",
  ],
};

export const related = [
  { title: "Google says AI Mode earns less. What can you measure?", href: "/blog/track-ai-mode-traffic-ga4", note: "Another measurement question where the official answer is thin, and a test you can run." },
  { title: "A $805M consent audit, step by step", href: "/blog/italy-meta-805m-consent-audit", note: "If bots and agents are in your numbers, check the consent layer that feeds them." },
  { title: "Lead Path X-Ray", href: "/apps/lead-path", note: "Follow one visit from an ad link to the CRM and see where its source gets lost." },
  { title: "Tag Health Scan", href: "/apps/tag-scanner", note: "Scan a site's Google tag and GTM setup." },
];
