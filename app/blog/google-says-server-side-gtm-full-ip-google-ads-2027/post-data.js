// Everything the post page shows. Copy of final.md (approved), split into blocks.
// Text markup: [n] becomes a link to source n, bold becomes <strong>.
// Do not edit the wording here without editing the article first.

export const SITE_URL = "https://meghakarnwal.com";

const B = "/blog/google-says-server-side-gtm-full-ip-google-ads-2027/";

export const post = {
  slug: "google-says-server-side-gtm-full-ip-google-ads-2027",
  category: "Analytics · Server-side GTM",
  title: "Google says server-side GTM will send full IPs to Ads in 2027",
  description:
    "Google reportedly told server-side GTM users that Google Ads tags will accept full IPs from 11 Jan 2027. What is known, unknown, and what to do.",
  standfirst:
    "An email Google reportedly sent says Google Ads, DV360, SA360 and CM360 tags will accept the full visitor IP from 11 January 2027, as an opt-out. The story has one source so far. Here is what is known, what is not, and a checklist.",
  author: "Megha Karnwal",
  // The run date is the default publish date. Megha sets the real one before publishing.
  publishedAt: "2026-11-05",
  lastChecked: "2026-11-03",
  readMinutes: 7, // final.md is about 1,300 words
  headlineStat: { value: "11 Jan", label: "2027: the date in Google's email, as quoted by PPC Land.", cite: 1 },
  // Share image: PNG export of images/share-card.svg (social sites ignore SVG).
  shareImage: `${B}share-card.png`,
  updates: [], // add { date: "2026-11-12", note: "..." } here; the page shows them under the byline
};

export const heroImage = `${B}hero-bg.svg`;

export const lead =
  "From 11 January 2027, server-side Google Tag Manager will, according to an email Google reportedly sent to users, let Google Ads, Display & Video 360, Search Ads 360 and Campaign Manager 360 tags receive the visitor's full IP address [1]. The email reportedly makes this an opt-out, so if you do nothing, full IPs would flow. If you run a server container, you have about ten weeks to decide on purpose instead of by default.";

// Figures. All are diagrams built from dates and quotes in sources.md. None plots data.
export const sectionArt = {
  "what-reportedly-changes": {
    src: `${B}tag-handling.svg?v=2`, width: 800, height: 360,
    alt: "Diagram. Today the server container redacts IP addresses for every tag. From 11 January 2027 each tag decides: Google Ads, DV360, SA360 and CM360 tags accept the full IP; Google Analytics tags keep redacting; third-party tags keep independent control.",
    caption: "Figure 1. How IP handling reportedly changes, per Google's email as quoted by PPC Land. Diagram, no data plotted.",
    cites: [1],
  },
  "checklist": {
    src: `${B}decision-flow.svg?v=5`, width: 800, height: 428,
    alt: "Flow of the checklist. Step 1, do you have a server container? If not, stop. If yes: list the tags, split by country, record ratio baselines, then decide to accept or redact. Redact leads to a one-hour transformation test in preview mode. Accept goes straight to asking your vendor and watching the release notes weekly.",
    caption: "The checklist as a flow. A method, not data.",
    cites: [1, 2, 3],
  },
  "what-to-do": {
    src: `${B}timeline.svg?v=2`, width: 800, height: 320,
    alt: "Timeline drawn to scale: 2 November 2026 PPC Land report, 3 November last checked, 27 November Black Friday, 30 November Cyber Monday, 11 January 2027 the reported change date. 69 days between the last check and the change.",
    caption: "Figure 2. The ten weeks, days to scale. The 11 January date is what Google's email reportedly says.",
    cites: [1],
  },
};

// Phone versions of the figures: real HTML text, same facts as the SVGs.
export const cardsFor = {
  "what-reportedly-changes": {
    eyebrow: "Figure 1",
    heading: "Redaction moves from the container to each tag",
    lead: { title: "Today", text: "The server container redacts the IP for every tag, as one setting." },
    leadNote: "From 11 Jan 2027 (reported), each tag decides:",
    cards: [
      { tone: "gap", label: "Accepts full IP", title: "Google Ads, DV360, SA360, CM360", text: "Opt-out reportedly offered." },
      { tone: "ok", label: "Keeps redacting", title: "Google Analytics", text: "\"will continue to apply IP redaction\"" },
      { tone: "page", label: "Own control", title: "Third-party tags", text: "Each keeps \"independent control\". Meta, TikTok and LinkedIn are PPC Land's examples." },
    ],
    note: "Per Google's email as quoted by PPC Land. Diagram, no data plotted.",
  },
  checklist: {
    eyebrow: "The checklist at a glance",
    heading: "Seven steps, in order",
    cards: [
      { label: "1", title: "Server container?", text: "No: stop, this is not about you." },
      { label: "2", title: "List the tags", text: "Ads, DV360, SA360, CM360 are in scope." },
      { label: "3", title: "Split by country", text: "Last 30 days. EEA, UK, Switzerland." },
      { label: "4", title: "Baseline ratios", text: "Ads conversions per backend order." },
      { tone: "early", label: "5", title: "Accept or redact?", text: "My view, not legal advice. Redact: go to 6. Accept: go to 7." },
      { label: "6", title: "Try a transformation", text: "1 hour in preview mode. IP gone? Keep it. If not, stop." },
      { label: "7", title: "Ask your vendor", text: "In writing. Then check release notes weekly." },
    ],
  },
  "what-to-do": {
    eyebrow: "Figure 2",
    heading: "About ten weeks to decide on purpose",
    cards: [
      { label: "2 Nov 2026", title: "PPC Land reports", text: "Quoting the Google email." },
      { label: "3 Nov", title: "Last checked", text: "This article." },
      { label: "27 Nov", title: "Black Friday", text: "Raw counts will be noisy." },
      { label: "30 Nov", title: "Cyber Monday", text: "Same." },
      { tone: "gap", label: "11 Jan 2027", title: "Reported change date", text: "69 days after the last check." },
    ],
    note: "Days drawn to scale in the desktop version.",
  },
};

export const sections = [
  {
    id: "how-solid",
    heading: "How solid is this news?",
    blocks: [
      { type: "p", text: "Not very yet, and you should know that before you act. The story is single-sourced. PPC Land reported it on 2 November 2026, quoting an email Google sent to server-side GTM users [1]. PPC Land says Adriaan Dekker also shared the email on LinkedIn; I have not opened that post [4]. I could not find a Google Help Centre article, a Google announcement, or an independent second report. Ecommerce Paradise covers it too, but it relies on PPC Land [2]. The Tag Manager release notes have no entry for it; the newest are 8 and 12 October [3]." },
      {
        type: "callout", kind: "limits", title: "What this does not show",
        paragraphs: [
          "The email points to a \"Help Centre article for detailed opt-out instructions\" without naming or linking it [1]. So treat everything below as what Google's email reportedly says. I will update this post, with a dated note, when Google publishes the page.",
        ],
      },
    ],
  },
  {
    id: "what-reportedly-changes",
    heading: "What reportedly changes",
    blocks: [
      { type: "p", text: "Today, server containers handle IP redaction for the whole container. From 11 January, handling moves to each tag. Per the email as quoted by PPC Land [1]:" },
      {
        type: "ul",
        items: [
          "Google Ads, DV360, SA360 and CM360 tags \"will now accept the full IP address\".",
          "Google Analytics tags \"will continue to apply IP redaction\".",
          "Third-party tags \"will maintain independent control over the signals that they accept\". PPC Land, not the email, gives Meta, TikTok and LinkedIn as examples.",
        ],
      },
      { type: "p", text: "Google's stated reason is that tags can \"process standard network signals like IP address to facilitate improvements to ads measurement and personalisation\". The email also mentions privacy-enhancing technologies and spam and invalid-traffic filtering. It names no specific technology and gives no measurement data, so any claim that full IPs will improve your results is, for now, Google's claim and not a number [1]." },
    ],
  },
  {
    id: "unknowns",
    heading: "What nobody knows yet",
    blocks: [
      { type: "p", text: "PPC Land lists the gaps, and they matter for planning [1]:" },
      {
        type: "callout", kind: "limits", title: "Unknown, as of 3 Nov 2026",
        paragraphs: [],
        ul: [
          "Whether the opt-out will be a container setting, a per-tag switch, or a transformation you build yourself.",
          "Whether opting out fully restores today's container-wide redaction.",
          "What \"network signals\" covers beyond IP address. The email gives no other example.",
          "How this interacts with consent mode. The email says end-user notices and \"legally required consents\" must be in place before data collection starts, but it does not say what happens to a request from a visitor who declined.",
          "Whether unconsented Floodlight requests, sent server-to-server since 28 July 2025, will carry full IPs [3].",
        ],
      },
      { type: "p", text: "One more detail. The email names only the EEA when it cites Google's EU user consent policy. The policy itself also covers the UK and Switzerland. Read that as a reason to check, not as permission." },
    ],
  },
  {
    id: "checklist",
    heading: "Checklist before 11 January",
    blocks: [
      {
        type: "ol",
        items: [
          "Find out if you have a server container at all. If your tags all fire from the browser, this change is not about you. Ecommerce Paradise says a standard Shopify store using the Google channel without a server container is probably unaffected; that is its author's view, not Google's [2].",
          "List the tags in each server container. Mark which are Google Ads, DV360, SA360 or CM360 and which are GA or third-party. Only the first group is in scope.",
          "Split your traffic by country. Pull the last 30 days from GA4 or your server logs. Visitors from the EEA, UK and Switzerland are where the consent question is sharpest. Check that your consent banner and privacy policy say IP addresses go to Google's ad products.",
          "Record a baseline now. Black Friday is 27 November and Cyber Monday 30 November, so raw counts will be noisy. Track ratios instead, such as Google Ads conversions divided by backend orders, by country (Ecommerce Paradise suggests the same [2]). Be honest about the limit: the Black Friday window and January's usual drop in demand can both move that ratio, so a shift after 11 January is a hint, not proof that the IP change caused it.",
          "Decide: accept or redact. This is opinion, and not legal advice. If you serve mainly EEA or UK users and cannot show a measurable gain from full IPs, I would redact. Google has shown no figures, and an unquantified improvement is a poor trade for a consent question you may struggle to document. Either way, write the decision down and ask your privacy lead or lawyer.",
          "Try a transformation as a fallback, with a time limit. The email says \"transformations can redact these signals before any tag accesses the data\" [1]. Transformations have existed in server containers since 7 June 2023, per the release notes [3]. But PPC Land notes that Google's transformations documentation does not mention IP addresses, so I cannot give you a verified recipe, and a transformation may not be able to touch the IP at all [1]. Google's own opt-out may also replace it. Spend an hour in preview mode: if you can confirm in the outgoing request that the IP is gone, including on the Ads tags, keep it. If you cannot, stop and wait for the Help Centre page.",
          "Ask your vendor, then keep watching. If an agency or a managed server-side hosting provider runs your container, ask in writing how they will handle the opt-out and by when. Then check the release notes weekly until the Help Centre article appears [3].",
        ],
      },
    ],
  },
  {
    id: "how-worried",
    heading: "How worried to be",
    blocks: [
      {
        type: "callout", kind: "opinion", title: "My view (opinion)",
        paragraphs: [
          "My reading is that the headline sounds worse than the likely reality for sites without a server container, since the change reportedly applies only there. GA tags keep redacting. And nothing published so far shows what Google will do with the address beyond \"ads measurement and personalisation\" [1].",
          "The real risk, again in my view, is accidental: a team that moved to server-side partly for privacy control finds out in January that a default changed under them. The email does not say that; it is my inference from an opt-out default.",
        ],
      },
    ],
  },
  {
    id: "what-to-do",
    heading: "What to do with this",
    blocks: [
      { type: "p", text: "This week, open your server container and write down which Google ad tags it contains. By mid-December, record the baseline and make the accept-or-redact decision with whoever owns your privacy policy. Give the transformation one hour in preview, and if the IP will not come out, wait for Google's page instead of building around a guess." },
    ],
  },
];

// Numbers match the inline [n] markers. "verified: false" shows an amber status.
export const sources = [
  {
    n: 1,
    title: "Google ad tags gain full visitor IP addresses in server-side GTM in 2027",
    outlet: "PPC Land (Luis Rijo)", date: "2026-11-02", dateLabel: "2 Nov 2026",
    url: "https://ppc.land/google-ad-tags-gain-full-visitor-ip-addresses-in-server-side-gtm-in-2027/",
    supports: "The 11 Jan 2027 date, the quoted Google email, which tags are affected, and the list of open questions. The only source for the email.",
    status: "Single source for the email", verified: false,
  },
  {
    n: 2,
    title: "Google Ads Tags Get Full Visitor IPs in sGTM Jan. 11",
    outlet: "Ecommerce Paradise", date: "", dateLabel: "Undated; author checked sources on 3 Nov 2026",
    url: "https://ecommerceparadise.com/google-server-side-gtm-full-ip-addresses/",
    supports: "The Shopify view and the ratio-baseline suggestion. It repeats PPC Land, so it is not an independent confirmation.",
    status: "Not independent", verified: false,
  },
  {
    n: 3,
    title: "Tag Manager release notes",
    outlet: "Google", date: "2026-10-12", dateLabel: "Newest entry 12 Oct 2026; checked 3 Nov 2026",
    url: "https://support.google.com/tagmanager/answer/4620708?hl=en",
    supports: "No entry yet on this change. Transformations in server containers since 7 Jun 2023. Unconsented Floodlight server-to-server requests since 28 Jul 2025.",
    status: "Checked by us on 3 Nov 2026", verified: true,
  },
  {
    n: 4,
    title: "LinkedIn post sharing the email",
    outlet: "Adriaan Dekker", date: "2026-11-02", dateLabel: "2 Nov 2026 (date per PPC Land)",
    url: "https://www.linkedin.com/posts/adriaan-dekker-google-ads-freelancer-rotterdam_news-share-7523060635039891456-SjM6/",
    supports: "Only that the email was shared on LinkedIn, according to PPC Land. I have not opened it.",
    status: "Not opened by me", verified: false,
  },
];

export const disclosure = {
  heading: "How this was made",
  body: [
    "AI agents research and write these posts. I read the sources behind the claims, review the draft, and publish it. I do not claim any legal or privacy credential: this is a practitioner's reading, not legal advice.",
    "If something here is wrong or out of date, tell me. Changes are added as dated notes at the top of the post, never made silently.",
  ],
};

export const related = [
  { href: "/blog/track-ai-mode-traffic-ga4", title: "Google says AI Mode earns less. What can you measure?", note: "Another post on what Google has and has not said." },
  { href: "/blog/google-ads-review-summaries-test", title: "Google writes review claims into your ads. Test them.", note: "Another Google Ads change, read with its limits stated." },
  { href: "/blog", title: "All posts", note: "The blog index." },
];
