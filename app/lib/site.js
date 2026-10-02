// Site-wide settings. Edit here; every section reads from this file.

export const CTA = "Book a 20-min call";
// Calendly / Cal.com link. Empty = "Book" buttons scroll to the contact section,
// and the contact button opens an email instead.
export const BOOKING_URL = "";
export const SHOW_PROMPTS = true;

export const EMAIL = "meghakarnwal13@gmail.com";
export const LINKEDIN = "https://linkedin.com/in/megha-karnwal-453889251";
export const RESUME = "/uploads/MeghaKarnwal-%20web%20analytics%20resume.pdf";

export const bookHref = BOOKING_URL || "#contact";
export const bookTarget = BOOKING_URL ? "_blank" : undefined;
export const contactHref = BOOKING_URL || `mailto:${EMAIL}?subject=Let's%20talk%20analytics`;

// Message match for ads: append ?aud=hiring or ?aud=clients to the final URL.
// The H1 stays constant; the eyebrow and subhead swap.
export const AUDIENCES = {
  general: { eyebrow: "Analytics · Automation · AI", sub: "I'm Megha Karnwal. I build the measurement that makes data trustworthy, automate the reporting nobody should do by hand, and use AI only where the data can carry it. Two years of live delivery on sensitive production data." },
  hiring: { eyebrow: "Analyst · Analytics · Automation · AI", sub: "I'm Megha Karnwal. Two years of live delivery on sensitive production data: GA4 and GTM built from scratch, BigQuery, experimentation, and AI pipelines shipped. If your team needs an analyst who owns measurement end to end and pushes it toward automation and AI, let's talk." },
  clients: { eyebrow: "Tracking · Reporting · AI-ready data", sub: "I'm Megha Karnwal. If leads are coming in but nobody can say which channel, page or campaign produced them, that's the first thing I fix. Then I automate the reporting and get your data ready for AI. Two years of live delivery on sensitive production data." },
};

export function audienceKey() {
  if (typeof window === "undefined") return "general";
  const a = new URLSearchParams(window.location.search).get("aud");
  return AUDIENCES[a] ? a : "general";
}
