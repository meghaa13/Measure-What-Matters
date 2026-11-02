// Phone version of every figure. Under 900px the page shows these instead of the SVG,
// because SVG text shrinks to 4 to 6px on a phone. Same facts and wording as the SVGs, as real text.
// Shape: eyebrow + heading, optional lead (dark box), cards [{ label, title, text, weak, foot, tone, items }],
// chips, legend, note. Keys are the figure ids in post-data.js (figures) or section ids (sectionArt).
export const cardsFor = {
  timeline: {
    eyebrow: "Figure 1 · What was seen, and when",
    heading: "Sightings came first. The help page was reported last.",
    cards: [
      { title: "3 Dec 2025", text: "Review excerpts in ads", tone: "early" },
      { title: "3 Jul 2026", text: "AI summary with a \"can make mistakes\" note", tone: "early" },
      { title: "5 Sep 2026", text: "\"What customers love\" test", tone: "early" },
      { title: "24 to 26 Oct 2026", text: "Help page reported by PPC News Feed (24), PPC Land (25), Search Engine Roundtable (26)", tone: "page" },
    ],
    legend: [
      { tone: "early", text: "Earlier sighting. PPC Land says the help page does not confirm these became this feature." },
      { tone: "page", text: "Coverage of the \"About Review summaries\" help page. The page itself is undated." },
    ],
  },
  testDesigns: {
    eyebrow: "Figure 2 · How to test without a switch",
    heading: "No control to flip, so every design is a hint, not proof.",
    lead: { title: "Can you switch review summaries off for a control group?", text: "As far as the help page shows, no setting exists. A custom experiment needs a setting to change." },
    leadNote: "So use observational designs",
    cards: [
      { label: "1 · Before / after with a marker", text: "Compare CTR, conversion rate and cost per conversion for 4 to 6 weeks each side of the date summaries first appear.", weak: "Seasonality and Google changes share the window." },
      { label: "2 · Matched campaigns", text: "Compare similar pairs, such as brand against brand in two regions, where summaries show on one and not the other.", weak: "Google chooses where to show it, so it is biased." },
      { label: "3 · GA4 landing page and quality", text: "Compare engagement rate, conversion rate and revenue per session by campaign, before and after.", weak: "Shows who clicked, not why they clicked." },
      { label: "4 · Support signals", text: "Count support tickets or sales-call mentions of claims you never made.", weak: "Anecdotal, but the fastest warning." },
    ],
  },
  "what-google-said": {
    eyebrow: "What Google has said",
    heading: "A line you did not write, inside your ad.",
    lead: { title: "\"Positive insights from across the web\"", text: "Added by Google's AI" },
    cards: [
      { title: "Written by Google's AI", text: "Drawn from online reviews" },
      { title: "You cannot edit it", text: "Page: cannot directly edit or customize" },
      { title: "Shown when Google predicts a gain", text: "Search campaigns, in English" },
    ],
    chipsLabel: "Markets",
    chips: ["US", "UK", "Australia", "India"],
  },
  "what-google-has-not-said": {
    eyebrow: "What Google has not said",
    heading: "Eight things the help page leaves out.",
    cards: [
      "An on/off setting",
      "If account-level controls cover it",
      "Any reporting information",
      "What happens if reviews are negative",
      "Which review sources are used",
      "Whether the ad labels it AI-written",
      "How many reviews are needed",
      "Which metric \"performance\" means",
    ].map((text) => ({ text, tone: "gap" })),
  },
  "why-it-matters": {
    eyebrow: "Why it matters",
    heading: "Their claim reads as your claim. Three risks.",
    cards: [
      { label: "1", title: "Accuracy", text: "An AI paraphrase of reviews can be wrong, or pull from a similarly named business.", foot: "Open question, PPC Land [1]" },
      { label: "2", title: "Brand and legal", text: "Positive-only text sits oddly next to the FTC fake-review rule (final rule, 14 Aug 2024).", foot: "Platform summaries: not addressed [1][3][4]" },
      { label: "3", title: "Your data gets murky", text: "If CTR or conversion rate moves, you cannot tell if the summary, your copy or something else caused it.", foot: "The author's opinion" },
    ],
  },
  "how-to-check": {
    eyebrow: "How to check what is shown",
    heading: "Look at the ad the way a customer does.",
    cards: [
      { label: "1", title: "Search", text: "Brand and main non-brand terms, desktop and mobile, from a clean browser." },
      { label: "2", title: "Capture", text: "Screenshot every ad with review text. Note date, query, location." },
      { label: "3", title: "Compare", text: "Check each claim with your real reviews. Note wrong, outdated or off-brand wording." },
      { label: "4", title: "Repeat", text: "Weekly. Add shots to a shared log. Ask sales and support to flag anything odd." },
    ],
    note: "Results are personalised, so one missing summary proves nothing. That is why you repeat.",
  },
  "what-to-do": {
    eyebrow: "What to do with this",
    heading: "Find out, prepare, and do not rush.",
    cards: [
      { label: "Find out", items: ["Do you run Search in the US, UK, Australia, India?", "Run the manual check and keep a screenshot log.", "Ask your rep: opt-out? Sources? Reporting?"] },
      { label: "Prepare", items: ["Write a baseline: CTR, conv. rate, cost per conversion, GA4 by campaign, 6+ weeks.", "Review your own reviews. Fix listings, answer common complaints.", "Brief your team."] },
      { label: "Hold back", tone: "stop", items: ["Do not rewrite campaigns in a rush.", "No data yet shows it helps or harms."] },
    ],
  },
};
