// Phone version of the method diagram. Under 900px the page shows these instead of the SVG,
// because SVG text shrinks to about 5px on a phone. Same facts and wording as the SVG, as real text.
export const cardsFor = {
  "what-ga4-can-and-cannot-see": {
    eyebrow: "Figure 1 · What each source can see",
    heading: "GA4 counts clicks from chatbots. Logs count requests.",
    cards: [
      { label: "GA4, AI Assistant channel", title: "Counts", text: "Sessions that arrive with a referrer from a chatbot: people who clicked a link.", tone: "page", weak: "An agent with no referrer, or one that never runs GA4's script. It can show as direct or as a bot (my observation)." },
      { label: "Server or CDN logs", title: "Counts", text: "Non-browser requests per day, by user-agent and path: a known-AI bucket and an unidentified automated bucket.", tone: "page", weak: "Whether the unidentified bucket is an agent. It is a lead to investigate, not a finding." },
    ],
    note: "Method diagram, no data. Source: Google Analytics Help. The weakness lines are my experience, not a published rule.",
  },
};
