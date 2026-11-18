// Everything the post page shows. Copy of final.md (CEO-approved), split into blocks.
// Text markup: [n] becomes a link to source n, **bold** becomes <strong>, `x` becomes <code>.
// The only additions to the article's words are the [n] citation markers.
// Do not edit the wording here without editing the article first.

export const SITE_URL = "https://measure-what-matter.netlify.app";

const B = "/blog/characterai-bankruptcy-ai-vendor-terms-checklist/";

export const post = {
  slug: "characterai-bankruptcy-ai-vendor-terms-checklist",
  category: "AI tools · Data risk",
  title: "Character.ai's chat data may be sold: check AI vendor terms",
  titleA: "Character.ai's chat data may be sold:",
  titleB: "check AI vendor terms",
  description:
    "Character.ai's proposed bankruptcy sale of chat data shows the risk when a vendor fails. A checklist for AI tools that receive customer data.",
  author: "Megha Karnwal",
  // The run date is the default publish date. Megha sets the real one before publishing.
  publishedAt: "2026-11-18",
  lastChecked: "2026-11-17",
  readMinutes: 8, // final.md is about 1,750 words
  headlineStat: { value: "Proposed", label: "No chat data has been sold. The court still has to approve any sale.", cite: 1 },
  shareImage: `${B}share-card.png`,
  updates: [], // add { date: "2026-11-24", note: "..." } here; the page shows them under the byline
};

export const heroArt = `${B}hero-art.svg`;

export const disclaimer = "Not legal advice. This is a practitioner's checklist. Ask a lawyer about your own contracts and your own legal duties.";

export const lead = [
  "According to PPC Land, one bidder in the Character.ai bankruptcy was formed on 13 November. It was named as a bidder the next day. Its owners have not been disclosed. And, per the same report, its proposed bid would cover the chat content. Now ask yourself a plain question: who holds the conversations your team has had with AI tools, and what happens to them if that company fails? [1]",
  "That is the real lesson here. If your team pastes customer emails, support tickets or CRM exports into an AI tool, you are trusting that vendor's terms for as long as the data exists, including if the vendor is sold or goes bankrupt. Character.ai filed for Chapter 11 on 12 October 2026, and parts of its business, possibly including chat content, are up for sale. Nothing has been sold yet. The court has set dates for the next three weeks. [1][5]",
];

// Figure: a dates timeline, built only from the dates and "reported by" labels in the article's table.
export const timeline = {
  title: "Proposed sale of Character.ai assets. Nothing has been sold.",
  sub: "Court approval is still needed. Dates as reported; they have moved before.",
  rows: [
    { date: "18 Nov", time: "4 p.m. ET", what: "Sale objections due, excluding contract-related objections", by: "Reported by: case notice page; Blockchain.News", checked: true },
    { date: "24 Nov", time: "noon ET", what: "Bid deadline", by: "Reported by news outlets (Blockchain.News, PPC Land), docket not checked", checked: false },
    { date: "1 Dec", time: "10 a.m. ET", what: "Auction", by: "Reported by news outlets (Blockchain.News, PPC Land), docket not checked", checked: false },
    { date: "3 to 4 Dec", time: "9:30 a.m. ET, unless adjourned", what: "Sale hearing", by: "Reported by: case notice page; Blockchain.News; PPC Land", checked: true },
  ],
  caption:
    "Figure 1. Key dates of the proposed sale, from the table above. Solid markers: reported on the case notice page and by at least one outlet. Hollow markers (24 Nov and 1 Dec): reported by news outlets only, docket not checked. The table also lists a 9 p.m. ET objection deadline on 18 Nov for the Smirks and Pangs sale, reported by PPC Land only.",
  cites: [1, 4, 5],
};

// Real screenshot of the claims agent's case page, cropped (header and cookie banner cut off). Transcription is verbatim.
export const shot = {
  src: `${B}stretto-case-page.png`, width: 1280, height: 706,
  alt: "Screenshot of the Stretto case page for Character Technologies, Inc., case 26-11603. A Dates card lists a Sale Objection Deadline of November 18, 2026, 04:00 PM ET. A Bidding Procedures and Sale card mentions an order dated November 4, 2026, Docket No. 106.",
  caption: "Screenshot of the claims agent's public case page, captured 18 Nov 2026. Cropped to the text and cards; the page header and a cookie banner are cut off.",
  txt: `${B}stretto-case-page.txt`,
  transcript: [
    "Dates: Final Hearing re: First Day Motions, November 17, 2026 (10:00 AM ET). Hearing re: Lease Rejection Motion, November 17, 2026 (10:00 AM ET). Sale Objection Deadline, November 18, 2026 (04:00 PM ET).",
    "Meeting of Creditors: scheduled for November 19, 2026, at 1:00 p.m. (ET) via Zoom.",
    "Bidding Procedures and Sale: By an order dated November 4, 2026 [Docket No. 106] (the \"Bidding Procedures Order\"), the Bankruptcy Court approved certain relief requested in the related motion [Docket No. 15] (the \"Bidding Procedures Motion\"), and certain procedures that govern the Sale (the \"Bidding Procedures\"). The Bidding Procedures also contain a process for designation of other Additional Stalking Horse Purchasers and related asset",
    "Intro text: On October 12, 2026 (the \"Petition Date\"), Character Technologies, Inc. filed a voluntary petition for relief under Chapter 11 of the United States Bankruptcy Code, Case No. 26-11603, before the Honorable Brendan Linehan Shannon, District of Delaware.",
  ],
};

export const sections = [
  {
    id: "what-is-happening-and-what-is-not", opener: "rule",
    heading: "What is happening, and what is not",
    blocks: [
      { type: "p", text: "Character Technologies, Inc., the company behind Character.ai, filed in the US Bankruptcy Court for the District of Delaware (case 26-11603, Judge Brendan L. Shannon). Disney Worldwide Services is the lead bidder, at $20 million for a non-exclusive licence. According to PPC Land, that offer excludes user inputs and outputs, training data and finished models. So the Disney deal, as reported, does not cover chats. [1]" },
      { type: "p", text: "The chat question sits with a second bid. On 14 November a second bidder was named, Smirks and Pangs Acquisition LLC, at $10 million plus assumed liabilities, for all assets outside Disney's licence. PPC Land, reading docket entry 164, says that covers AI models with their weights, chat content, training datasets, advertising and analytics data, and ad network accounts. It also reports that the company was formed in Delaware on 13 November and that its owners were not disclosed. My view: a buyer with no disclosed owners is a reason to read the docket closely, and nothing more than that. I found this bidder in one outlet only, so treat the detail as reported, not independently confirmed. [1]" },
      { type: "p", text: "The word to hold onto is proposed. No chat data has been sold. Both bids are stalking-horse offers, which means opening prices that others can beat. The court still has to approve any sale." },
      { type: "p", text: "Dates as reported:" },
      {
        type: "table",
        head: ["Date", "Event", "Reported by"],
        rows: [
          ["18 Nov, 4 p.m. ET", "Sale objections due, excluding contract-related objections", "Case notice page; Blockchain.News"],
          ["18 Nov, 9 p.m. ET", "Objections to the Smirks and Pangs sale", "PPC Land only"],
          ["24 Nov, noon ET", "Bid deadline", "News outlets only (Blockchain.News, PPC Land), docket not checked"],
          ["1 Dec, 10 a.m. ET", "Auction", "News outlets only (Blockchain.News, PPC Land), docket not checked"],
          ["3 to 4 Dec, 9:30 a.m. ET, unless adjourned", "Sale hearing", "Case notice page; Blockchain.News; PPC Land"],
        ],
      },
      { type: "timeline" },
      { type: "shot" },
      { type: "p", text: "Blockchain.News is a 6 November report of the court's 4 November order (docket 106), and PPC Land is secondary too. Neither is the docket. The case page run by the claims agent does not list the bid or auction dates. And these dates do wander: the debtor first proposed 20 Nov for bids, 23 Nov for the auction and 24 Nov for the hearing. Check the docket before you quote any date. [1][2][4][5]" },
    ],
  },
  {
    id: "why-regulators-are-objecting", opener: "numeral",
    heading: "Why regulators are objecting",
    blocks: [
      { type: "p", text: "On 14 October, 39 states and DC filed a notice in the case listing nine conditions for any buyer. Two matter most here. One says chat content should not be used for model training or advertising beyond what users validly consented to. Another says all consumers should get a chance to delete their data before any sale. These are conditions the states asked for. They are not court orders. [2]" },
      { type: "p", text: "Bloomberg Law reported on 12 November that Character.ai holds chat logs from more than 20 million users, including over 2 million accounts belonging to minors, and that the judge said the company should hire a privacy ombudsman. Only the opening of that paywalled article could be read for this piece. [3] User counts differ by source. PPC Land cites a January 2026 report of over 20 million monthly active users, and the chief executive's October declaration of about 12 million users. PPC Land does not say how the 12 million is counted, so these figures are not directly comparable. [1]" },
      { type: "p", text: "The Consumer Federation of America also wrote to the court on 12 November. As quoted by PPC Land, the letter says: \"This means that everyone's chatlogs are integrated into the technology offered by Character AI to continue to 'train' it.\" I have not opened the letter itself. PPC Land cites it as Docket No. 176. Per PPC Land, it is not a formal objection and it misstated the Disney deal. [1]" },
      { type: "p", text: "Those chats are people talking to companion bots, a far more intimate setting than a marketing team's data. The mechanics still apply to you. A company holding conversation data fails, a buyer appears, and the question becomes what the privacy policy allowed." },
    ],
  },
  {
    id: "the-vendor-terms-checklist", opener: "panel",
    heading: "The vendor-terms checklist",
    blocks: [
      { type: "callout", kind: "opinion", title: "My view", paragraphs: ["This checklist is my opinion, not a legal standard. Read these in the vendor's terms of service, privacy policy and data processing agreement (DPA). If an answer is missing, treat it as \"no\"."] },
      {
        type: "steps",
        items: [
          "**Training.** Does the vendor train models on your inputs by default? Is the opt-out an account-level switch or only for paid tiers? Does it cover data already sent?",
          "**Retention.** How long are chats and uploaded files kept? Is deletion real deletion, or only hidden from your view? Are backups covered?",
          "**Change of control.** Find the clause on mergers, acquisitions and asset sales. You want wording that a buyer must honour the same terms and that you get advance notice. Want to see what the opposite looks like? PPC Land quotes Character.ai's May 2025 terms, as cited in a June 2025 complaint, as allowing inputs and outputs to be used for training, new products and marketing, and as granting \"a free, perpetual, and irrevocable license\" over characters and conversations. I have not read the policy itself. Wording like that, in the hands of a buyer, is the thing to avoid. [1]",
          "**Deletion and export.** Can you delete everything yourself, in bulk, and get written confirmation? The states' eighth condition in this case was a chance to delete before any sale. [2]",
          "**Sub-processors.** Who else touches the data, and do you get notice when that list changes?",
          "**Business versus consumer terms.** The same vendor often has different terms for a free personal account and a business plan with a DPA. Make sure your team uses the plan you reviewed.",
          "**Vendor stability.** Opinion: for small AI startups, ask what happens to your data if they fold. A one-line answer in the DPA beats a policy that says nothing.",
        ],
      },
    ],
  },
  {
    id: "what-never-goes-into-a-chat-tool", opener: "rule2",
    heading: "What never goes into a chat tool",
    blocks: [
      { type: "p", text: "My position, labelled as opinion: unless a signed DPA covers it, the following should not go into any AI tool." },
      {
        type: "ul",
        items: [
          "Customer personal data in raw form: names with emails, phone numbers, addresses.",
          "Support tickets with health, payment or account details.",
          "Full CRM or ad-platform exports, even \"just for analysis\".",
          "Credentials, API keys, service-account files.",
          "Data from children, or anything collected under a consent that did not mention AI processing.",
        ],
      },
      { type: "p", text: "A safer routine: replace identifiers first, work on aggregates, and send the model a sample, not the file. Removing names does not make data anonymous, so treat it as risk reduction only." },
    ],
  },
  {
    id: "a-short-internal-ai-data-rule", opener: "numeral",
    heading: "A short internal AI-data rule",
    blocks: [
      { type: "p", text: "Copy and adapt. Four lines are enough for a small team." },
      {
        type: "rule",
        items: [
          "Only tools on the approved list may receive customer data.",
          "Each approved tool has a named owner who has read its terms against the checklist and noted the date.",
          "The \"never\" list stays out of every tool, approved or not.",
          "When a vendor is acquired, changes its terms or enters financial trouble, the owner re-reads the terms within a week.",
        ],
      },
    ],
  },
  {
    id: "what-to-do-with-this", opener: "panel",
    heading: "What to do with this",
    blocks: [
      {
        type: "ul",
        items: [
          "This week, list every AI tool your team uses, including the free personal accounts staff signed up for themselves. Yes, that one too.",
          "For each, answer checklist items 1 to 4. Mark gaps.",
          "Turn off training where you can, and delete old chats that hold customer data.",
          "Adopt the four-line rule and send it to the team.",
          "If you use Character.ai yourself, watch the docket (case 26-11603) around the 24 Nov bid deadline and the 3 to 4 Dec hearing. The states' delete condition is only a request, and whether any deletion window opens is unknown. My caution, not a sourced finding: deleting your chats may not remove what a model has already learned from them. As quoted by PPC Land, the CFA letter says chat data is \"integrated into the technology offered by Character AI to continue to 'train' it,\" though PPC Land notes that no party with standing has asked for model deletion. If you want your chats gone, do it sooner and do not count on it being complete. [1][2]",
        ],
      },
      { type: "em", text: "Updated 17 Nov: dates and bidders checked against news coverage and the case notice page. Later changes will be added here with a date." },
    ],
  },
];

export const sources = [
  {
    n: 1, title: "PPC Land report on the Character.ai sale (17 Nov)",
    outlet: "PPC Land (trade site)", date: "2026-11-17", dateLabel: "17 Nov 2026",
    url: "https://ppc.land/what-the-therapist-bot-heard-character-ais-chats-are-on-the-block/",
    supports: "The case and judge, the Disney and Smirks and Pangs bids and what they cover, the bidder's formation date and undisclosed owners, the schedule, the CFA letter and its quote, the May 2025 terms quote, and the user counts.",
    status: "Secondary source. Opened and re-opened 17 Nov 2026.", verified: false,
  },
  {
    n: 2, title: "PPC Land report on the 39 states and DC notice (14 Oct)",
    outlet: "PPC Land (trade site)", date: "2026-10-14", dateLabel: "14 Oct 2026",
    url: "https://ppc.land/character-ai-faces-40-attorneys-general-over-who-can-buy-its-users-chats/",
    supports: "The notice from 39 states and DC, its nine conditions (including no training or ads beyond consent, and a chance to delete before sale), and the debtor's first proposed dates.",
    status: "Secondary source. Opened 17 Nov 2026.", verified: false,
  },
  {
    n: 3, title: "Bloomberg Law report on the chat data sale (12 Nov, opening only)",
    outlet: "Bloomberg Law", date: "2026-11-12", dateLabel: "12 Nov 2026",
    url: "https://news.bloomberglaw.com/ip-law/character-ais-bankruptcy-chat-data-sale-is-privacy-nightmare",
    supports: "Chat logs from more than 20 million users, over 2 million accounts of minors, and the judge's remark about a privacy ombudsman.",
    status: "Paywalled. Only the opening could be read, 17 Nov 2026.", verified: false,
  },
  {
    n: 4, title: "Blockchain.News report of the bidding-procedures order (6 Nov)",
    outlet: "Blockchain.News", date: "2026-11-06", dateLabel: "6 Nov 2026",
    url: "https://blockchain.news/news/character-technologies-chapter-11-sale-update",
    supports: "A report of the court's 4 November bidding-procedures order (docket 106): objection, bid, auction and hearing dates, and the Disney stalking-horse bid.",
    status: "Secondary source. Re-opened 17 Nov 2026. Not the docket.", verified: false,
  },
  {
    n: 5, title: "Case notice page run by the claims agent",
    outlet: "Stretto, claims agent", date: "2026-11-17", dateLabel: "Read 17 Nov 2026",
    url: "https://cases.stretto.com/chartech",
    supports: "The 12 October filing, the 4 November order, the 18 November objection deadline and the 3 to 4 December hearing. It lists no bid or auction date.",
    status: "Opened and read, 17 Nov 2026. Not the court docket.", verified: true,
  },
];

export const disclosure = {
  heading: "How this article was made",
  body: [
    "AI agents researched, wrote and fact-checked this article. A separate checking agent compared claims with their sources and sent the draft back for fixes before it reached me.",
    "I read it, correct it and publish it.",
    "Dates on sources are the dates the outlets give. I could not open the court docket, so the bid and auction dates rest on two news outlets. This is not legal advice.",
  ],
};

export const related = [
  { title: "Google says AI Mode earns less. What can you measure?", href: "/blog/track-ai-mode-traffic-ga4", note: "Another measurement question where the official answer is thin, and a test you can run." },
  { title: "A guardrail checklist for AI agents", href: "/blog/california-openai-agent-guardrail-checklist", note: "The other half: what to ask for before an agent acts on your behalf." },
];
