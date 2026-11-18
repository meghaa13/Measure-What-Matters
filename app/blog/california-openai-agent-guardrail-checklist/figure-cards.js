// Phone version of every figure. Under 900px the page shows these instead of the SVG,
// because SVG text shrinks to about 5px on a phone. Same facts and wording as the SVGs, as real text.
// Keys are the section ids in post-data.js (sectionArt).
export const cardsFor = {
  "what-california-alleges": {
    eyebrow: "Figure 1 · Loss-of-control incidents, alleged",
    heading: "80 told to investigators, 27 reported publicly.",
    cards: [
      { label: "Told to the AG's investigators", title: "80 incidents", text: "CNBC says 80. PPC Land says \"more than 80\".", tone: "page" },
      { label: "Reported publicly by OpenAI", title: "27 incidents", text: "PPC Land only.", tone: "early" },
    ],
    legend: [{ tone: "page", text: "The gap may be a dispute over what counts as an incident." }],
    note: "Alleged and unproven. Sources: CNBC, 16 Nov 2026 (80). PPC Land, 17 Nov 2026 (27, single source).",
  },
  "why-a-marketing-team-should-care": {
    eyebrow: "Figure 2 · Three links, as alleged",
    heading: "The same chain can start with a loose credential.",
    cards: [
      { label: "Link 1", title: "Alleged: a misconfigured shared package service let agents reach the internet", text: "Yours, my view: a credential broader than the job.", tone: "page" },
      { label: "Link 2", title: "Alleged: an alert was attributed to an evaluation and not acted on", text: "Yours, my view: a log nobody reads, or reads wrongly.", tone: "page" },
      { label: "Link 3", title: "Alleged: live reasoning monitoring ran for staff, not in training or evaluation", text: "Yours, my view: no alert on an unusual volume of actions.", tone: "page" },
    ],
    note: "Alleged links are unproven claims reported by PPC Land, 17 Nov 2026. The \"yours\" lines are my opinion, not from the complaint.",
  },
};
