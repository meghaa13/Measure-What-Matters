// Everything the post page shows. Copy of final.md (approved), split into blocks.
// Text markup: [n] becomes a link to source n, **bold** becomes <strong>, `x` becomes <code>.
// The only additions to the article's words are the [n] citation markers.
// Do not edit the wording here without editing the article first.

import { SITE_URL } from "../../../config/seo.mjs";
export { SITE_URL };

const B = "/blog/italy-meta-805m-consent-audit/";

export const post = {
  slug: "italy-meta-805m-consent-audit",
  category: "Consent · Privacy",
  title: "Italy fined Meta EUR 805m over a permission used as consent",
  // Title split for display: the second part is set in italic purple.
  titleA: "Italy fined Meta EUR 805m over",
  titleB: "a permission used as consent",
  description:
    "Italy fined Meta EUR 805m because an Android permission was not consent for a Facebook feature. A six-step audit of what you read.",
  author: "Megha Karnwal",
  // The run date is the default publish date. Megha sets the real one before publishing.
  publishedAt: "2026-11-18",
  lastChecked: "2026-11-17",
  readMinutes: 6, // final.md is about 1,300 words
  headlineStat: { value: "EUR 805m", label: "fine decided by the Garante, 13 Nov 2026", cite: 1 },
  shareImage: `${B}share-card.png`,
  updates: [], // add { date: "2026-11-24", note: "..." } here; the page shows them under the byline
};

export const heroArt = `${B}hero-art.svg`;

// Figure: SVG built only from numbers in the decision (sources.md). Real text in the figcaption too.
export const sectionArt = {
  "why-the-user-tapped-allow-was-not-enough": {
    src: `${B}fine.svg`, width: 800, height: 380,
    alt: "Bar chart, EUR million, axis from zero to 900. Starting amount 700. Final fine 805. The extra 105 is the difference by subtraction.",
    caption:
      "Figure 1. The Garante's sanction calculation, EUR million. Raised by three aggravating factors: Meta's degree of responsibility (moderate), a 2019 prior fine (slight), poor cooperation (significant). Lowered by one mitigating factor: the v581 update (moderate, because late). The decision gives the weights, not a euro amount per factor. The 105 gap is simple subtraction.",
    cites: [1],
  },
};


// Real screenshots of the Garante decision (captured 18 Nov 2026 in Chrome, files unaltered, 1523x784).
// The page crops them with CSS only (see .bp-crop in blog.css). y = source pixel row where the crop starts.
// Italian text is verbatim from the screenshot; the English line is OUR gloss, not an official translation.
export const garanteUrl = "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10321455";
const cap = "Screenshot of the Garante's decision, captured 18 Nov 2026 (Italian original). ";
export const shots = {
  header: {
    src: `${B}garante-1-header.jpg`, width: 1523, height: 784, crop: false,
    alt: "Header of the Garante's decision of 13 November 2026, document 10321455.",
    caption: cap + "The decision page header: Provvedimento del 13 novembre 2026, doc web 10321455.",
    quote: null,
  },
  method: {
    src: `${B}garante-3-section-6-2-heading.jpg`, width: 1523, height: 784, crop: true, y: 60,
    alt: "Heading of section 6.2 of the Garante decision, on how the fine is quantified.",
    caption: cap + "Section 6.2 sets out how the fine was calculated.",
    quote: {
      it: "6.2. Quantificazione della sanzione amministrativa pecuniaria (art. 83, par. 2, del Regolamento)",
      en: "Section 6.2, quantification of the administrative fine.",
    },
  },
  start: {
    src: `${B}garante-2-starting-amount-700m.jpg`, width: 1523, height: 784, crop: true, y: 190,
    alt: "Section 6.2 of the Garante decision, giving the starting amount of EUR 700,000,000.",
    caption: cap + "Section 6.2: the starting amount, 10.2% of the cap, EUR 700,000,000.",
    quote: {
      it: "Alla luce degli elementi sopra valutati, in particolare dell'assenza di dolo, di danno concreto accertato, di trasmissioni accertate e di categorie particolari di dati, che compensano solo in parte gli elementi di segno opposto, l'importo iniziale è determinato nel 10,2% del massimale, pari a euro 700.000.000.",
      en: "The starting amount is set at 10.2% of the cap, i.e. EUR 700,000,000.",
    },
  },
  fine: {
    src: `${B}garante-4-fine-805m.jpg`, width: 1523, height: 784, crop: true, y: 300,
    alt: "The sentence of the Garante decision that sets the fine at EUR 805,000,000.",
    caption: cap + "The operative sentence: EUR 805,000,000 for breach of Article 122(1) and (2).",
    quote: {
      it: "In ragione dei suddetti elementi, valutati nel loro complesso, e in base ai principi di effettività, proporzionalità e dissuasività previsti dall'art. 83, par. 1, del Regolamento, si ritiene di determinare l'ammontare della sanzione pecuniaria nei confronti di Meta Platforms Ireland Limited nella misura di euro 805.000.000 (ottocentocinque milioni) per la violazione dell'art. 122, commi 1 e 2, del Codice.",
      en: "The fine against Meta Platforms Ireland Limited is set at EUR 805,000,000 for violating Art. 122(1) and (2) of the Code.",
    },
  },
};

export const lead =
  "You tap \"Allow\" on a photo permission once, months ago. Then an app uses it for something you never saw coming. Was that consent? On 13 November 2026 the Italian data protection authority, the Garante, said no, and decided that Meta Platforms Ireland must pay EUR 805 million. The feature: Facebook for Android suggested photos from the phone's gallery, and the Garante found the user's system permission was not valid consent for it. This was a ruling on an app feature, not on websites, and nothing here is legal advice. It still hands you a question worth asking about your own setup: what do you read from the device, and what did the person actually agree to? [1]";

export const sections = [
  {
    id: "what-the-garante-decided", opener: "rule",
    heading: "What the Garante decided",
    blocks: [
      {
        type: "p",
        text: "I opened the decision itself (Garante doc web 10321455, Register no. 815, dated 13 November 2026; the press release is dated 14 November). Everything below comes from that text unless I say otherwise. [1]",
      },
      {
        type: "ul",
        items: [
          "**Who and what:** Meta Platforms Ireland Limited, and the feature \"Ottieni suggerimenti dalla galleria quando navighi su Facebook\" (\"get suggestions from your gallery while browsing Facebook\"). It offers photos and videos from the device as things to post. [1]",
          "**The rule:** Article 122 of Italy's Privacy Code, the Italian version of the ePrivacy Directive, which governs access to information stored on a user's device. GDPR Articles 6, 7, 12 and 13 show up only as the yardstick for valid consent. The Garante did not find standalone GDPR violations, and PPC Land reads it the same way. [1][2]",
          "**The fine:** EUR 805,000,000, payable within 60 days of notification. Meta may instead pay half within the appeal period (Article 166(8) of the Code), but only if it also complies with the orders below. Half is EUR 402.5 million, which is PPC Land's arithmetic, not a figure the Garante announced. [1][2]",
          "**The orders:** within 60 days of notification, ask for a separate, specific consent for gallery access, not bundled with posting photos or other functions. Keep the feature off by default, including for people who already granted the Android permission. If Meta misses the deadline, the Garante bans it under Article 58(2)(f) from switching the feature on for Italian Android users without valid consent, and from processing information already collected through the feature without it. [1]",
          "**Reports:** Meta reports what it has started within 30 days, and what it has implemented, with technical documentation, within 90 days. The 90-day report must include the number of Italian Android users who consented under the new flow. [1]",
          "**Appeal:** an appeal to the ordinary court is open within 30 days of communication of the decision (60 days if the appellant lives abroad). [1]",
        ],
      },
      {
        type: "p",
        text: "**The clocks do not match, and none can be calendared yet.** Payment, the orders and the 90-day report run from notification. The appeal runs from communication. The decision text does not give the notification date, and PPC Land says the same. So nobody outside the case can say when the 60 and 90 day deadlines fall. [1][2]",
      },
      {
        type: "p",
        text: "Watch the currency, too. Al Jazeera's headline says $880m while its body says EUR 805m (about $887m). The regulator's figure is in euros, so this article uses euros. [3]",
      },
    ],
  },
  {
    id: "why-the-user-tapped-allow-was-not-enough", opener: "numeral",
    heading: "Why \"the user tapped Allow\" was not enough",
    blocks: [
      {
        type: "p",
        text: "Meta's argument, as the decision records it and PPC Land summarises it, went like this: the feature runs entirely on the phone, nothing is sent over the network, and consent came through the Android system permission. The Garante rejected all three. It found Meta's technical claims unproven and the notice inadequate, and it held that reading the gallery for this feature needed its own consent. [1][2]",
      },
      {
        type: "p",
        text: "Two things stand out. Nothing had to leave the device for Article 122 to apply: reading is enough. And a system permission such as \"allow Facebook to access photos\" does not cover every purpose you later attach to it.",
      },
      {
        type: "p",
        text: "Be careful with the numbers around this case. The decision says \"about 20 million\" people and gives its own estimate of 18 to 22 million. Meta did not supply a count, so the Garante built the estimate from AGCOM, DataReportal and Statcounter figures, including a 63% Android share. That is an estimate, not a count. [1]",
      },
      {
        type: "p",
        text: "What has Meta said since? Not much. Al Jazeera reported on 14 November that Meta had not commented, and noted that Meta has the right to appeal. PPC Land records no response from Meta after its 12 October defence brief. In that brief, Meta said a later app version (v581) corrected the settings display; the decision records the same claim in its summary of Meta's defence (section 2.2). The Garante said such changes came too late and do not cure earlier access (section 3.7), and in its sanction calculation (section 6.2) it treated the update as a mitigating factor of \"moderate weight, because late\". [1][2][3]",
      },
      {
        type: "p",
        text: "Does that mean the update bought Meta a discount? Not on net. The Garante set a starting amount of EUR 700 million and raised it to EUR 805 million: it found the update a moderate mitigating factor, but outweighed by three aggravating ones, namely Meta's degree of responsibility (moderate), a 2019 prior fine (slight) and poor cooperation (significant). Whether Meta will appeal is unknown. [1]",
      },
    ],
  },
  {
    id: "what-this-does-not-say", opener: "panel",
    heading: "What this does not say",
    blocks: [
      {
        type: "callout",
        kind: "limits",
        title: "Limits",
        paragraphs: [
          "The decision is about one app feature on Android. It does not rule on websites, Google Tag Manager, Consent Mode or analytics tags. The Garante did not say that any particular tag setup is unlawful, and a decision by Italy's authority does not bind regulators elsewhere. A court appeal is also still possible. [1]",
        ],
      },
      {
        type: "callout",
        kind: "opinion",
        title: "My view",
        paragraphs: [
          "Now my reading, which is opinion. Article 122 implements the same ePrivacy provision (Article 5(3)) that sits behind cookie banners, so the logic travels. Consent has to be specific to a purpose, and one button press does not stretch to every use. Picture a single \"Accept all\" that covers analytics, ad measurement, personalisation and an app permission. Could each of those purposes stand on its own? This case is a good reason to find out. [2]",
        ],
      },
    ],
  },
  {
    id: "a-six-step-audit", opener: "rule",
    heading: "A six-step audit of what you read from the device (my method, not Garante guidance)",
    blocks: [
      {
        type: "callout",
        kind: "opinion",
        title: "My method",
        paragraphs: [
          "The Garante published no audit procedure. These steps are my own way to ask the question the decision raises. Run them for your site and any app you control. Use a spreadsheet, one row per item.",
        ],
      },
      {
        type: "steps",
        items: [
          "**List every read.** Cookies, local storage, device identifiers, advertising IDs and, in an app, every SDK permission (photos, contacts, location, microphone). In GTM, export the container and list every tag, noting what it sets or reads. In Chrome DevTools, the Application tab shows what is stored on a fresh visit.",
          "**Name the purpose of each.** \"Measure traffic\", \"attribute ads\", \"personalise\", \"fraud prevention\", \"a feature the user asked for\". If one item serves two purposes, split the row.",
          "**Mark which need consent.** Items strictly needed to deliver something the person asked for generally do not. Most of the rest probably do. This step is a judgement call, so take the unclear cases to privacy counsel.",
          "**Map each row to a consent choice.** Is there a separate control for that purpose, or is it bundled under \"Accept all\" or a vague \"improve your experience\"? In my reading, bundled rows are the ones the Italian reasoning puts at risk.",
          "**Test the default.** Open the site in a clean browser profile, decline everything, and see what still loads. In GTM Preview, check which tags fire before any choice. In an app, check what is enabled before the user opens settings. Anything on by default that needs consent is a finding.",
          "**Test the old users.** Meta was told to re-ask people who had already granted permission. If you changed purposes or added a vendor after people consented, did you ever ask again? [1]",
        ],
      },
      {
        type: "p",
        text: "If you use Google's Consent Mode, the sheet also shows which consent signals (analytics storage, ad storage and the others) each tag should wait for. Whether your setup meets Italian or any other law is not something this audit proves.",
      },
    ],
  },
  {
    id: "what-to-do-with-this", opener: "numeral",
    heading: "What to do with this",
    blocks: [
      {
        type: "ul",
        items: [
          "This week: run steps 1, 2 and 5. Step 5 is quick and finds the most.",
          "Keep the sheet, with a date. If a regulator or client asks, a dated record beats memory.",
          "If you run an Android or iOS app, review each permission against the screen where you ask for it. A single system prompt may not be your only consent step.",
          "Take uncertain rows to a lawyer in the country that matters to you. This article is not legal advice.",
          "Watch three things: the notification date once it surfaces, whether Meta appeals, and whether other regulators cite the decision.",
        ],
      },
    ],
  },
];

export const sources = [
  {
    n: 1,
    title: "Decision doc web 10321455, Meta Platforms Ireland Limited (Register no. 815)",
    outlet: "Garante per la protezione dei dati personali",
    date: "2026-11-13",
    dateLabel: "13 Nov 2026",
    url: "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10321455",
    supports:
      "The primary decision: the feature, Article 122 of the Privacy Code with GDPR articles as the yardstick only, the EUR 805,000,000 fine, the 700 to 805 sanction calculation and its factors, the orders, the 30 and 90 day reports, the 18 to 22 million estimate, and the appeal period. The notification date is not stated in it.",
    status: "Opened and read by the writer and the checking agent, 17 Nov 2026",
    verified: true,
  },
  {
    n: 2,
    title: "Meta can halve Italy's EUR 805m Facebook fine by complying, decision shows",
    outlet: "PPC Land (trade site)",
    date: "2026-11-17",
    dateLabel: "17 Nov 2026",
    url: "https://ppc.land/meta-can-halve-italys-eur805m-facebook-fine-by-complying-decision-shows/",
    supports:
      "A secondary reading: Meta's on-device and system-permission arguments and their rejection, the EUR 402.5 million half-fine figure (its own calculation), Meta's 12 October defence brief and the v581 claim, no Meta response recorded since, and that Article 122 transposes Article 5(3) ePrivacy.",
    status: "Secondary source. The v581 claim in the brief rests on this site and the decision.",
    verified: false,
  },
  {
    n: 3,
    title: "Italy fines Meta $880m over photo privacy",
    outlet: "Al Jazeera",
    date: "2026-11-14",
    dateLabel: "14 Nov 2026",
    url: "https://aljazeera.com/news/2026/11/14/italy-fines-meta-880m-over-photo-privacy",
    supports:
      "The headline says $880m while the body says EUR 805m (about $887m). Meta had not commented on 14 November, and has the right to appeal.",
    status: "Checked 17 Nov 2026. Used only for the currency note and Meta's lack of comment.",
    verified: true,
  },
];

export const disclosure = {
  heading: "How this article was made",
  body: [
    "AI agents researched, wrote and fact-checked this article. A separate checking agent compared claims with their sources and sent the draft back for fixes before it reached me.",
    "I read it, correct it and publish it.",
    "Dates on sources are the dates the outlets give. The decision's notification date is not public, so no deadline here is calendared. This is not legal advice.",
  ],
};

export const related = [
  { title: "Google says AI Mode earns less. What can you measure?", href: "/blog/track-ai-mode-traffic-ga4", note: "Another measurement question where the official answer is thin, and a test you can run." },
  { title: "How much AI agent traffic to plan for", href: "/blog/ai-agent-traffic-how-much-to-plan-for", note: "Another measurement gap: what the traffic in your reports actually is." },
  { title: "Tag Health Scan", href: "/apps/tag-scanner", note: "Scan a site's Google tag and GTM setup, a quick first look for audit step 1." },
];
