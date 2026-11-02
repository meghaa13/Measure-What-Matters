// Everything the post page shows. Copy of final.md, split into blocks.
// Text markup: [n] becomes a link to source n, **bold** becomes <strong>.
// Do not edit the wording here without editing the article first.

export const SITE_URL = "https://meghakarnwal.com";

export const post = {
  slug: "google-ads-review-summaries-test",
  category: "Ads measurement",
  title: "Google writes review claims into your ads. Test them.",
  description:
    "Google can now show AI-written, positive-only review summaries in Search ads, with no edit or reporting. Here is how to check and test the effect.",
  standfirst:
    "AI-written, positive-only review summaries can appear inside Search ads. You cannot edit them, and Google's help page says nothing about reporting.",
  author: "Megha Karnwal",
  // Set publishedAt to the real publish day. Megha decides; the run date is used as the default.
  publishedAt: "2026-10-30",
  lastChecked: "2026-10-30",
  readMinutes: 6, // final.md is about 1,430 words
  headlineStat: { value: "4", label: "markets named: US, UK, Australia, India", cite: 3 },
  // Share image: export images/share-card.svg to a 1200x630 PNG (social sites ignore SVG).
  shareImage: "/blog/google-ads-review-summaries-test/share-card.png",
  updates: [], // add { date: "2026-11-12", note: "..." } here; the page shows them under the byline
};

// Figures. src is the path under /public. Sizes match the SVG viewBox so nothing shifts.
export const figures = {
  timeline: {
    src: "/blog/google-ads-review-summaries-test/timeline.svg",
    width: 800,
    height: 352,
    alt: "Timeline from December 2025 to October 2026. Review excerpts in ads were reported on 3 December 2025, an AI summary with a can-make-mistakes note on 3 July 2026, and a What customers love test on 5 September 2026. The help page was reported on 24, 25 and 26 October 2026.",
    caption: "Figure 1. Earlier sightings, then the help page. PPC Land notes the help page does not say the tests became this feature.",
    cites: [1, 2],
  },
  testDesigns: {
    src: "/blog/google-ads-review-summaries-test/test-designs.svg",
    width: 800,
    height: 520,
    alt: "Diagram. Because the help page lists no review summary setting, a true A/B test is not possible. Four observational designs follow, each with its weakness: before and after with a marker, matched campaigns, GA4 landing page and quality checks, and support signals.",
    caption: "Figure 2. The four test designs in this article and the main weakness of each. No data is plotted.",
    cites: [3, 5],
  },
};

// Hero background (decorative). Section illustrations: one per major section, shown above its text.
// Every one is an SVG built from the article's own words; none plots data and none is a screenshot.
export const heroImage = "/blog/google-ads-review-summaries-test/hero-bg.svg";
const B = "/blog/google-ads-review-summaries-test/";
export const sectionArt = {
  "what-google-said": {
    src: B + "sec-said.svg", width: 800, height: 300,
    alt: "Illustration of a Search ad with a highlighted line reading Positive insights from across the web, marked as written by Google's AI and not editable by the advertiser. Markets: US, UK, Australia, India.",
    caption: "Illustration, not a screenshot: where the summary sits in the ad.", cites: [1, 3],
  },
  "what-google-has-not-said": {
    src: B + "sec-gaps.svg", width: 800, height: 312,
    alt: "Checklist of eight things the help page does not say, including an on/off setting, reporting information, review sources and how many reviews are needed.",
    caption: "Illustration: the gaps listed in the paragraph above.", cites: [1, 3],
  },
  "why-it-matters": {
    src: B + "sec-risks.svg", width: 800, height: 306,
    alt: "Three cards: accuracy, brand and legal, and murky data, each with a one-line summary of the risk.",
    caption: "Illustration of the three risks below. This is the author's opinion.", cites: [1, 4],
  },
  "how-to-check": {
    src: B + "sec-check.svg", width: 800, height: 296,
    alt: "Four-step loop: search from a clean browser, capture each ad, compare the claim with your real reviews, repeat weekly.",
    caption: "Illustration of the weekly check described below.", cites: [3],
  },
  "what-to-do": {
    src: B + "sec-todo.svg", width: 800, height: 306,
    alt: "The seven actions grouped as find out, prepare, and hold back.",
    caption: "Illustration: the checklist below, grouped by purpose.", cites: [],
  },
};

export const sections = [
  {
    id: "what-google-said",
    heading: "What Google has said",
    blocks: [
      {
        type: "p",
        text: 'The help page is titled "About Review summaries". PPC News Feed reported it on 24 October 2026, as cited by PPC Land (25 October) and Search Engine Roundtable (26 October). The page itself carries no date, so those outlet dates are the best timing we have. [1][2]',
      },
      { type: "p", text: "What the page says: [1][2][3]" },
      {
        type: "ul",
        items: [
          "The AI gathers online reviews and writes short commentary that appears as part of your Search ad.",
          'It highlights "positive insights from across the web".',
          'You "cannot directly edit or customize the generated text".',
          "It runs on Search campaigns, in English, in the US, UK, Australia and India, in all positions on Google.com and on all supported devices.",
          "All verticals qualify except sensitive categories. Pharmaceuticals is the example named.",
          "It shows only when Google predicts it will benefit your ad performance.",
        ],
      },
      {
        type: "p",
        text: "Google lists four benefits: customer trust, click quality, ad performance and brand trust. The page offers no test results to back them. [1]",
      },
    ],
  },
  {
    id: "what-google-has-not-said",
    heading: "What Google has not said",
    blocks: [
      {
        type: "p",
        text: 'This is the important part for anyone who measures. The page gives no setting to turn the feature on or off. It links to account-level automated assets controls but does not say whether they cover review summaries. It has no reporting information. It does not name the review sources, how many reviews are needed, or what happens when a business\'s reviews are mostly negative. It also does not say whether the ad labels the text as AI-written, or which metric "performance" means. [1][3]',
      },
      {
        type: "p",
        text: 'Google also uses "strong grounding requirements", which means the AI is tied to source material. How strong that is in practice is not shown. [1]',
      },
      {
        type: "p",
        text: 'Earlier sightings suggest this has been tested for some time. Review excerpts in ads were reported in December 2025, an AI summary with a "can make mistakes" note in July 2026, and a "What customers love" test on 5 September 2026. PPC Land notes the help page does not say those tests became this feature. [1]',
      },
      { type: "figure", id: "timeline" },
    ],
  },
  {
    id: "why-it-matters",
    heading: "Why it matters",
    blocks: [
      {
        type: "callout",
        kind: "opinion",
        title: "My read (opinion)",
        paragraphs: [
          "A claim in your ad is your claim in the eyes of the customer, even when you did not write it. Three risks follow.",
        ],
        ol: [
          "**Accuracy.** An AI paraphrase of reviews can be wrong, or pull from reviews of a similarly named business. PPC Land lists this as an open question. [1]",
          "**Brand and legal.** Positive-only text sits oddly next to the US FTC rule on fake reviews. The FTC announced its final rule on 14 August 2024. It bans fake reviews, including AI-generated ones, and bans claiming a review display represents all or most reviews when negatives were suppressed. [4] I am not a lawyer, and the rule targets businesses that create or disseminate fake reviews. Whether it applies to a platform's summary of real reviews is not addressed by Google's page, and PPC Land says the same. [1][3] Ask your legal adviser if you work in a regulated area.",
          "**Your data goes murky.** If CTR or conversion rate moves, you cannot tell whether the cause was the summary, your copy, or something else.",
        ],
        after: [
          "There may also be upside. In my opinion, social proof in an ad can lift clicks, and Google says it serves the text only when it expects a gain. But that is Google's prediction on its own metric, not a result you have seen. The sensible position is neither panic nor trust. Check, then test.",
        ],
      },
    ],
  },
  {
    id: "how-to-check",
    heading: "How to check what is shown",
    blocks: [
      {
        type: "p",
        text: "Per the help page, there is no reporting information for the feature. [3] I have not confirmed that any Google Ads report shows the summary text, so do not count on finding it there. Instead, look at the ad as a user does.",
      },
      {
        type: "ol",
        items: [
          "Search your own brand and your main non-brand terms on Google.com in the supported markets, on desktop and mobile. Do it from a clean browser, not a logged-in one.",
          "Screenshot every ad that shows review text, with the date, query and location.",
          "Check each claim against your real reviews. Note wrong, outdated or off-brand wording.",
          "Repeat weekly. Add the screenshots to a shared log, and ask the sales and support teams to report anything odd.",
        ],
      },
      {
        type: "p",
        text: "Search results are personalised and vary, so a missing summary in one check proves nothing. That is why you repeat it.",
      },
      {
        type: "p",
        text: "If you find a wrong claim, I could not find a documented way to report or remove a single summary. Do not assume one exists. Contact your Google Ads rep or support and ask directly, and keep the screenshots.",
      },
    ],
  },
  {
    id: "how-to-test",
    heading: "How to test the effect",
    blocks: [
      {
        type: "p",
        text: "A clean test needs a switch you control. Here the switch is Google's. Google's custom experiments split a campaign into a control and a trial, with options for cookie-based or search-based splits on Search. You can choose to apply a result on directional data, or only when it reaches statistical significance. [5] But an experiment compares the settings you change, and as far as the help page shows, there is no review summary setting to change. [3] So you cannot run a true A/B test unless Google adds a control. An account-level automated asset opt-out might apply, but I have not checked it and Google does not confirm it. Check your account before you build any plan on it.",
      },
      { type: "p", text: "Without a switch, here are weaker designs. All are observational, so treat results as hints." },
      {
        type: "p",
        text: "**Before/after with a marker.** Record the date you first see summaries in your ads. Compare CTR, conversion rate and cost per conversion for the 4 to 6 weeks before and after, at campaign level. Hold bids, budget and copy steady. Add a Google Ads change annotation and a GA4 annotation. The weakness: seasonality and Google's own changes sit inside the same window. Compare the same weeks last year if you have them.",
      },
      {
        type: "p",
        text: "**Matched campaigns.** If the summaries show on some campaigns and not others (Google decides, so you will see this by checking), compare similar pairs, such as brand against brand in two regions. The weakness: Google chooses where to show them, probably where it expects a gain, so the comparison is biased toward the summary.",
      },
      {
        type: "p",
        text: '**GA4 landing-page and quality checks.** Click-through is only half the question. In GA4, use the Traffic acquisition report with session campaign (or session source / medium) as the dimension. Compare engagement rate, conversion rate and revenue per session for the affected campaigns before and after. If CTR rises but conversion rate falls, the claim may be attracting the wrong clicks, which is what "click quality" would mean in practice. Use auto-tagging or UTMs so campaigns split cleanly, and keep the Google Ads and GA4 conversion definitions aligned.',
      },
      {
        type: "p",
        text: "**Support signals.** Count support tickets or sales-call mentions of claims you never made. Anecdotal, but it is the fastest warning of a wrong summary.",
      },
      { type: "figure", id: "testDesigns" },
      {
        type: "p",
        text: "Be honest in the write-up. Say it is an observational estimate, state the window, and say what else changed.",
      },
      {
        type: "callout",
        kind: "limits",
        title: "What this does not show",
        paragraphs: [
          "No data here says review summaries help or harm. Google's page gives no test results, and I have none. The GA4 report suggestions are practitioner advice, not sourced. I have not confirmed whether any Google Ads report shows the summary text, or whether account-level automated asset controls cover this feature. I could not find a documented way to report or remove a summary, which reflects my search, not a Google statement.",
        ],
      },
    ],
  },
  {
    id: "what-to-do",
    heading: "What to do with this",
    blocks: [
      {
        type: "ul",
        items: [
          "**This week:** check whether you run Search campaigns in the US, UK, Australia or India. If not, this does not affect you yet.",
          "**Today:** run the manual check and start a screenshot log.",
          "**Write down a baseline** now: CTR, conversion rate, cost per conversion, and GA4 engagement by campaign, for at least the past 6 weeks.",
          "**Review your own reviews.** The summary can only reflect what is online. Fix listings and respond to common complaints.",
          "**Ask Google.** Ask your rep three things: is there an opt-out, which sources are used, and will it be reported. Record the answers with dates.",
          "**Brief your team** so no one reads a metric change as a copy win or loss without checking.",
          "**Do not rewrite campaigns in a rush.** There is no data yet showing it helps or harms.",
        ],
      },
      { type: "p", text: "I will update this post if Google adds an opt-out or reporting." },
    ],
  },
];

// Lead summary under the metadata bar. Citations match sources.md.
export const lead =
  "Google has published a help page describing AI-written review summaries that appear inside Search ads. The summaries are positive only, you cannot edit them, and the page says nothing about reporting. [1][3] If you run Search ads in the US, UK, Australia or India, Google may already be putting claims about your business in your ad. [3] You should find out what it says and whether it helps.";

// status text comes from sources.md notes (what was opened, who verified). Megha: confirm [2].
export const sources = [
  {
    n: 1,
    title: "Google AI writes positive-only review summaries into Search ads in 4 markets",
    outlet: "PPC Land, Luis Rijo",
    date: "2026-10-25",
    dateLabel: "25 Oct 2026",
    url: "https://ppc.land/google-ai-writes-positive-only-review-summaries-into-search-ads-in-4-markets/",
    supports:
      "Feature description, quotes, markets, pharma exclusion, the missing on/off and reporting details, the four claimed benefits and the earlier sightings.",
    status: "Page opened 30 Oct 2026",
    verified: true,
  },
  {
    n: 2,
    title: "Google Ads AI review summaries doc",
    outlet: "Search Engine Roundtable, Barry Schwartz",
    date: "2026-10-26",
    dateLabel: "26 Oct 2026",
    url: "https://seroundtable.com/google-ads-ai-review-summaries-doc-42370.html",
    supports: "Summaries appear as part of Search ads; markets, devices, positions, verticals; the 24 Oct report.",
    status: "Secondary report; not marked as opened in the source log",
    verified: false,
  },
  {
    n: 3,
    title: "About Review summaries",
    outlet: "Google Ads Help",
    date: null,
    dateLabel: "Undated",
    url: "https://support.google.com/google-ads/answer/18760807",
    supports:
      "Eligibility, no editing, positive only, shown when predicted to improve performance; no on/off setting and no reporting information on the page.",
    status: "Page opened 30 Oct 2026; checked by the critic agent in rounds 1 and 2",
    verified: true,
  },
  {
    n: 4,
    title: "FTC announces final rule banning fake reviews and testimonials",
    outlet: "US Federal Trade Commission",
    date: "2024-08-14",
    dateLabel: "14 Aug 2024",
    url: "https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials",
    supports:
      "The final rule's date and scope: bans fake and AI-generated reviews and misleading review displays. It does not say how the rule applies to platform summaries.",
    status: "Page opened; date confirmed by the critic agent",
    verified: true,
  },
  {
    n: 5,
    title: "Set up a custom experiment",
    outlet: "Google Ads Help",
    date: null,
    dateLabel: "Undated",
    url: "https://support.google.com/google-ads/answer/6261395",
    supports:
      "Custom experiments on Search, cookie-based and search-based splits, and applying results on directional data or at statistical significance.",
    status: "Page opened; checked by the critic agent in round 1",
    verified: true,
  },
];

export const disclosure = {
  heading: "How this entry was made",
  body: [
    "AI agents researched, wrote and fact-checked this entry. A separate checking agent compared each claim with its source and sent the draft back for fixes before it reached me.",
    "I read it, correct it and publish it. I am not a lawyer, and nothing here is legal advice.",
    "Dates on sources are the dates the outlets give. Google's help pages are undated.",
  ],
};

export const related = [
  { title: "Lead Path X-Ray", href: "/apps/lead-path", note: "Follow one visit from an ad link to the CRM and see where its source gets lost." },
  { title: "Tag Health Scan", href: "/apps/tag-scanner", note: "Scan a site's Google tag and GTM setup." },
  { title: "CRO X-Ray", href: "/apps/cro-xray", note: "Conversion problems you can't see from your own desk, with the evidence." },
];
