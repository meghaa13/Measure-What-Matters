// Phone version of every figure. Under 900px the page shows these instead of the SVG,
// because SVG text shrinks to about 5px on a phone. Same facts and wording as the SVGs, as real text.
// Keys are the section ids in post-data.js (sectionArt).
export const cardsFor = {
  "what-google-said": {
    eyebrow: "Figure 1 · Google Search and other revenue, Q3",
    heading: "Revenue grew. The release does not say what AI Mode earned.",
    cards: [
      { label: "Q3 2025", title: "$56,567 million", tone: "early" },
      { label: "Q3 2026", title: "$63,350 million", tone: "page" },
    ],
    legend: [{ tone: "page", text: "About 12% growth, by the writer's arithmetic. Not split by AI Mode." }],
    note: "Source: Alphabet Q3 2026 earnings release, SEC 8-K exhibit 99.1, 28 Oct 2026.",
  },
  "what-search-console-shows": {
    eyebrow: "Figure 2 · What Search Console does",
    heading: "AI Mode is counted, but not split out.",
    cards: [
      { label: "1 · The click", title: "Click an external link in AI Mode" },
      { label: "2 · The count", title: "Counts as a click", text: "Position uses the same method as normal results." },
      { label: "3 · The report", title: "Performance report, search type \"Web\"" },
      { label: "Not available", title: "No \"AI Mode only\" filter", text: "Search Labs experiment data is excluded.", tone: "stop" },
    ],
  },
  "what-ga4-does": {
    eyebrow: "Figure 3 · What GA4 does: unresolved",
    heading: "Two possible outcomes. Neither is confirmed.",
    lead: { title: "An AI Mode visit reaches your site", text: "Label in GA4: not documented." },
    leadNote: "Possible outcomes",
    cards: [
      { label: "Possible A", title: "Inside Direct", text: "Your Direct line grows for no reason you can see." },
      { label: "Possible B", title: "Inside google / organic", text: "Your organic line mixes two kinds of visit." },
    ],
    note: "The answer may differ by browser, app and date.",
  },
  "a-test-you-can-run": {
    eyebrow: "Figure 4 · The test",
    heading: "Five steps, run on your own property.",
    cards: [
      { label: "Step 1", title: "Pick a page", text: "A page AI Mode links to, or a site you own." },
      { label: "Step 2", title: "Click through", text: "Desktop Chrome, a phone, a second browser. Note time and landing page." },
      { label: "Step 3", title: "Read GA4", text: "Realtime now. Later: Traffic acquisition and Landing page." },
      { label: "Step 4", title: "BigQuery", text: "If you export, check the traffic source fields." },
      { label: "Step 5", title: "Search Console", text: "Same page and date. Counts under \"Web\". Check over many days." },
    ],
    note: "Repeat the GA4 part about ten times across browsers and devices. Record the result and the date.",
  },
  "what-to-do": {
    eyebrow: "Figure 5 · What to do",
    heading: "Four moves, none of them waiting for Google.",
    cards: [
      { label: "This week", title: "Run the test", text: "Re-run it in a quarter. Keep the notes.", tone: "page" },
      { label: "Reporting", title: "Count with Search Console", text: "Cleanest count of Google search traffic. Includes AI Mode, cannot split it." },
      { label: "If you buy ads", title: "Use your numbers", text: "Your conversions and cost per acquisition against a matched period of ordinary search." },
      { label: "Document it", title: "Add a dated note", text: "Say how you treat AI Mode traffic, so next year's reader knows." },
    ],
  },
};
