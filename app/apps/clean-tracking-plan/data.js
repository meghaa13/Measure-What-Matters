// Plan data for The Clean Tracking Plan builder.
// Every param carries a class (safe / gated / hash / never) and, for the dataLayer
// spec, an example value. Example values come from EX unless a row overrides them.

export const CLASSES = {
  safe: { label: "Safe", desc: "Non-identifying. Fine to send once analytics consent rules are met." },
  gated: { label: "Consent-gated", desc: "Identifiers that only flow when the matching consent is granted." },
  hash: { label: "Hash only", desc: "Sent to ad platforms as SHA-256 after normalising. Never raw, never to GA4." },
  never: { label: "Never collect", desc: "Stays in your CRM or order system. Never in analytics." },
};

export const TYPES = {
  b2b: { label: "B2B lead-gen", conv: "generate_lead" },
  ecom: { label: "E-commerce", conv: "purchase" },
  saas: { label: "SaaS / subscription", conv: "purchase" },
  publisher: { label: "Content / publisher", conv: "newsletter_signup" },
  booking: { label: "Bookings / services", conv: "booking_complete" },
};

export const MARKETS = {
  us: { name: "United States", currency: "USD", cc: "1", def: "Granted by default, with an opt-out.", detail: "Honour \"Do not sell or share\" choices and the Global Privacy Control signal by denying ad_user_data and ad_personalization. Several state laws apply, led by California." },
  ca: { name: "Canada", currency: "CAD", cc: "1", def: "Granted with notice, except Quebec.", detail: "Quebec's Law 25 expects tracking that can profile people to be off by default, so deny all four signals for region CA-QC until opt-in." },
  au: { name: "Australia", currency: "AUD", cc: "61", def: "Granted with notice and an opt-out.", detail: "No cookie-banner mandate today, but the Privacy Act still applies to personal data, and reforms are underway. Keep personal data out of analytics regardless." },
  eu: { name: "EEA / UK", currency: "EUR", cc: null, def: "Denied by default until opt-in.", detail: "Google requires Consent Mode v2 signals for EEA and UK traffic to use ad personalisation and measurement features. No banner means ad tags stay off. UK sites: use GBP." },
};

export const STACK = [
  ["ads", "Google Ads"],
  ["meta", "Meta Ads"],
  ["crm", "CRM / backend"],
  ["cmp", "Consent banner"],
];

// Default example values for the generated dataLayer pushes. "$CURRENCY" is swapped for the market's currency.
export const EX = {
  page_location: "https://example.com/pricing", page_referrer: "https://www.google.com/", page_title: "Pricing",
  file_name: "case-study-acme", file_extension: "pdf", link_url: "https://example.com/files/case-study-acme.pdf",
  form_id: "contact_main", form_name: "Contact", cta_location: "hero", cta_text: "book_demo",
  lead_source: "contact_form", service_interest: "analytics_audit", company_size_band: "51-200",
  value: 500, currency: "$CURRENCY", request_id: "8f14e45f-ceea-4672-9b1d-0c1f2a5e3b77",
  meeting_type: "discovery_call", booking_tool: "calendly", lead_status: "qualified", disqualified_lead_reason: "no_budget",
  client_id: "123456789.1690000000",
  item_list_id: "summer_sale", item_list_name: "Summer sale",
  items: [{ item_id: "SKU_1042", item_name: "Linen shirt", item_category: "Shirts", price: 49, quantity: 1 }],
  search_term: "linen shirt", coupon: "WELCOME10", shipping_tier: "standard", payment_type: "card",
  transaction_id: "ORD-7K2M9Q", tax: 4.9, shipping: 5, customer_type: "new",
  method: "google", user_id: "u_48213", plan_id: "pro_monthly", plan_interval: "monthly", feature_name: "report_export",
  cancel_reason: "too_expensive", seats_band: "2-10",
  content_type: "article", content_group: "analytics", article_id: "a-1042", publish_date: "2026-09-14", read_depth: 75,
  item_id: "a-1042", newsletter_id: "weekly_digest", signup_location: "article_footer", paywall_id: "metered_3",
  service_id: "svc_cut_style", service_category: "hair", days_ahead_band: "2-7", slot_daypart: "evening",
  booking_id: "BK-9F3K2X", party_size: 2, location_region: "north",
};

const P = (k, cls, note, opts = {}) => ({ k, cls, note, ...opts });
const GA = ["analytics_storage"];
const AT = (moment) => [`analytics_storage (recorded at ${moment})`];

const PV = (redact) => ({
  name: "page_view", badge: "auto", auto: true, when: "Every page load (GA4 enhanced measurement).",
  params: [P("page_location", "safe", "redacted"), P("page_referrer", "safe"), P("page_title", "safe")],
  note: redact, consent: GA,
});

export const PLAN = {
  b2b: [
    { stage: "Discover", rows: [
      PV("<strong>Redact</strong> query parameters like <code>email</code>, <code>phone</code> and <code>token</code> before sending, and keep personal names out of page titles."),
      { name: "file_download", badge: "auto", auto: true, when: "Case study or brochure downloads.",
        params: [P("file_name", "safe"), P("file_extension", "safe"), P("link_url", "safe")],
        note: "If a download sits behind a form, track the form separately with <code>generate_lead</code>.", consent: GA },
    ]},
    { stage: "Engage", rows: [
      { name: "form_start", badge: "auto", auto: true, when: "First interaction with a form field.",
        params: [P("form_id", "safe"), P("form_name", "safe")],
        note: "Compared with <code>generate_lead</code>, this shows where forms lose people.", consent: GA },
      { name: "cta_click", badge: "custom", when: "Clicks on primary calls to action.",
        params: [P("cta_location", "safe"), P("cta_text", "safe", "fixed label")],
        note: "Use a fixed label, not raw click text, on any element near a form.", consent: GA },
    ]},
    { stage: "Convert", rows: [
      { name: "generate_lead", badge: "recommended", conv: true, when: "After the server confirms the submission, not on button click.",
        params: [P("form_id", "safe"), P("lead_source", "safe"), P("service_interest", "safe", "dropdown value"), P("company_size_band", "safe", "a band like 51-200"), P("value", "safe"), P("currency", "safe"), P("request_id", "gated", "opaque join key")],
        note: "<code>request_id</code> is a random ID stored with the lead in your CRM. It links the form fill to its outcome later without a single personal field in GA4.", consent: GA },
      { name: "schedule_meeting", badge: "custom", when: "A booking is confirmed (scheduler redirect or callback).",
        params: [P("meeting_type", "safe"), P("booking_tool", "safe"), P("request_id", "gated")],
        note: "Fire it on the confirmation page, not when the scheduler opens.", consent: GA },
    ]},
    { stage: "Lead outcome", need: "crm", server: true, rows: [
      { name: "qualify_lead", badge: "recommended", srv: true, when: "Sales marks the lead as qualified in the CRM.",
        params: [P("client_id", "gated", "captured at submit"), P("request_id", "gated"), P("lead_status", "safe"), P("value", "safe"), P("currency", "safe")],
        note: "Sent through the GA4 Measurement Protocol with the consent state recorded at submit. In BigQuery, join it to <code>generate_lead</code> on <code>request_id</code>.", consent: AT("submit") },
      { name: "disqualify_lead", badge: "recommended", srv: true, when: "Lead is rejected.",
        params: [P("client_id", "gated"), P("request_id", "gated"), P("disqualified_lead_reason", "safe", "fixed list")],
        note: "Use a fixed list of reasons. Free-text sales notes often contain names.", consent: AT("submit") },
      { name: "close_convert_lead", badge: "recommended", srv: true, when: "Deal is won.",
        params: [P("client_id", "gated"), P("request_id", "gated"), P("value", "safe", "", { ex: 12000 }), P("currency", "safe")],
        note: "This is what lets you report revenue by channel instead of form fills.", consent: AT("submit") },
    ]},
    { stage: "Ad platforms", dest: true, rows: [
      { name: "Google Ads · lead conversion", need: "ads", badge: "enhanced conversions", when: "Same moment as generate_lead.",
        params: [P("sha256_email_address", "hash"), P("sha256_phone_number", "hash"), P("gclid", "gated", "auto, via ad cookies")],
        note: "Hashed user data goes only when <code>ad_user_data</code> is granted. Map it in GTM through a User-Provided Data variable.", consent: ["ad_storage", "ad_user_data"] },
      { name: "Google Ads · qualified lead upload", need: "ads+crm", srv: true, badge: "enhanced conversions for leads", when: "When the CRM marks a lead qualified.",
        params: [P("sha256_email_address", "hash"), P("conversion_action", "safe"), P("conversion_value", "safe")],
        note: "Lets Google Ads bid on qualified leads, not every form fill.", consent: ["ad_user_data (recorded at submit)"] },
      { name: "Meta · Lead", need: "meta", badge: "Pixel + Conversions API", when: "Same moment as generate_lead.",
        params: [P("em", "hash"), P("ph", "hash"), P("event_id", "safe", "dedup key"), P("fbp / fbc", "gated")],
        note: "Send the same <code>event_id</code> from the Pixel and the Conversions API so Meta counts the lead once.", consent: ["marketing category"] },
    ]},
  ],

  ecom: [
    { stage: "Browse", rows: [
      PV("<strong>Redact</strong> order-confirmation and password-reset tokens from URLs, and keep customer names out of account page titles."),
      { name: "view_item_list", badge: "recommended", ecom: true, when: "A category or search results list is shown.",
        params: [P("item_list_id", "safe"), P("item_list_name", "safe"), P("items", "safe")], consent: GA },
      { name: "view_item", badge: "recommended", ecom: true, when: "A product page loads.",
        params: [P("currency", "safe"), P("value", "safe", "", { ex: 49 }), P("items", "safe")], consent: GA },
      { name: "search", badge: "recommended", when: "Site search is used.",
        params: [P("search_term", "safe", "redacted")],
        note: "People paste emails and order numbers into search boxes. Strip anything that looks like an email or phone number before sending.", consent: GA },
    ]},
    { stage: "Account", rows: [
      { name: "sign_up", badge: "recommended", when: "Account created (server confirmed).",
        params: [P("method", "safe", "email / google / apple", { ex: "email" }), P("user_id", "gated", "opaque internal ID")],
        note: "<code>user_id</code> is your database ID for the customer, never the email.", consent: GA },
      { name: "login", badge: "recommended", when: "Successful sign-in.",
        params: [P("method", "safe"), P("user_id", "gated")], consent: GA },
    ]},
    { stage: "Cart & checkout", rows: [
      { name: "add_to_cart", badge: "recommended", ecom: true, when: "Item added.",
        params: [P("currency", "safe"), P("value", "safe", "", { ex: 49 }), P("items", "safe")], consent: GA },
      { name: "begin_checkout", badge: "recommended", ecom: true, when: "Checkout starts.",
        params: [P("currency", "safe"), P("value", "safe", "", { ex: 49 }), P("coupon", "safe", "generic codes only"), P("items", "safe")],
        note: "Personal codes like <code>JANE20</code> identify a person. Send a coupon type instead.", consent: GA },
      { name: "add_shipping_info", badge: "recommended", ecom: true, when: "Shipping method chosen.",
        params: [P("shipping_tier", "safe"), P("value", "safe", "", { ex: 49 }), P("currency", "safe"), P("items", "safe")],
        note: "The method, never the address.", consent: GA },
      { name: "add_payment_info", badge: "recommended", ecom: true, when: "Payment method chosen.",
        params: [P("payment_type", "safe"), P("value", "safe", "", { ex: 49 }), P("currency", "safe"), P("items", "safe")],
        note: "The method, never card details.", consent: GA },
    ]},
    { stage: "Purchase", rows: [
      { name: "purchase", badge: "recommended", ecom: true, conv: true, dedupe: "transaction_id", when: "Order confirmed by the server, once per order.",
        params: [P("transaction_id", "safe", "non-guessable"), P("value", "safe", "", { ex: 49 }), P("tax", "safe"), P("shipping", "safe"), P("currency", "safe"), P("coupon", "safe"), P("items", "safe"), P("customer_type", "safe", "new / returning", { top: true })],
        note: "Use a transaction ID that does not encode the customer or sequence, and dedupe on refresh.", consent: GA },
      { name: "refund", badge: "recommended", srv: true, need: "crm", when: "Refund processed in the order system.",
        params: [P("client_id", "gated"), P("transaction_id", "safe"), P("value", "safe", "", { ex: 49 }), P("currency", "safe")],
        note: "Sent server-side through the Measurement Protocol so revenue reports stay net.", consent: AT("purchase") },
    ]},
    { stage: "Ad platforms", dest: true, rows: [
      { name: "Google Ads · purchase conversion", need: "ads", badge: "enhanced conversions", when: "Same moment as purchase.",
        params: [P("sha256_email_address", "hash"), P("sha256_phone_number", "hash"), P("transaction_id", "safe"), P("value", "safe"), P("gclid", "gated", "auto")],
        note: "Hashed data goes only when <code>ad_user_data</code> is granted. Pass transaction_id so Google dedupes repeat fires.", consent: ["ad_storage", "ad_user_data"] },
      { name: "Google Ads · remarketing", need: "ads", badge: "audiences", when: "Product views and cart events.",
        params: [P("items", "safe"), P("value", "safe")],
        note: "Needs personalisation consent on top of storage consent.", consent: ["ad_storage", "ad_personalization"] },
      { name: "Meta · Purchase", need: "meta", badge: "Pixel + Conversions API", when: "Same moment as purchase.",
        params: [P("em", "hash"), P("ph", "hash"), P("value", "safe"), P("currency", "safe"), P("event_id", "safe", "= transaction_id"), P("fbp / fbc", "gated")],
        note: "Reuse the transaction ID as <code>event_id</code> on both Pixel and Conversions API to dedupe.", consent: ["marketing category"] },
    ]},
  ],

  saas: [
    { stage: "Discover", rows: [
      PV("<strong>Redact</strong> invite tokens, magic-link codes and password-reset tokens from URLs. In-app pages should send a generic title, never a workspace or document name."),
      { name: "cta_click", badge: "custom", when: "Pricing, demo and sign-up CTAs.",
        params: [P("cta_location", "safe"), P("cta_text", "safe", "fixed label", { ex: "start_trial" })], consent: GA },
      { name: "view_pricing", badge: "custom", when: "Pricing page or plan comparison viewed.",
        params: [P("plan_interval", "safe", "monthly / annual")], consent: GA },
    ]},
    { stage: "Activate", rows: [
      { name: "sign_up", badge: "recommended", when: "Account created (server confirmed).",
        params: [P("method", "safe", "email / google / sso", { ex: "google" }), P("plan_id", "safe", "", { ex: "free" }), P("user_id", "gated", "opaque internal ID")],
        note: "Set <code>user_id</code> to your own database ID so GA4 can stitch devices. Never the email, never a hash of it.", consent: GA },
      { name: "login", badge: "recommended", when: "Successful sign-in.",
        params: [P("method", "safe"), P("user_id", "gated")], consent: GA },
      { name: "tutorial_complete", badge: "recommended", when: "Onboarding checklist finished.",
        params: [P("user_id", "gated")],
        note: "Pair with <code>tutorial_begin</code> to measure onboarding drop-off.", consent: GA },
      { name: "key_action", badge: "custom", when: "The action that predicts retention (your activation moment).",
        params: [P("feature_name", "safe", "fixed list"), P("user_id", "gated")],
        note: "Send the feature name only. Never the content a user created, typed or uploaded.", consent: GA },
    ]},
    { stage: "Monetise", rows: [
      { name: "trial_start", badge: "custom", when: "Trial begins on a paid plan.",
        params: [P("plan_id", "safe"), P("plan_interval", "safe"), P("seats_band", "safe", "a band like 2-10"), P("value", "safe", "", { ex: 0 }), P("currency", "safe"), P("user_id", "gated")], consent: GA },
      { name: "purchase", badge: "recommended", ecom: true, conv: true, dedupe: "transaction_id", when: "First successful payment, confirmed by the billing system.",
        params: [P("transaction_id", "safe", "invoice ID, non-guessable", { ex: "in_1Q8ZtA" }), P("value", "safe", "", { ex: 49 }), P("currency", "safe"), P("items", "safe", "the plan", { ex: [{ item_id: "pro_monthly", item_name: "Pro", item_category: "subscription", price: 49, quantity: 1 }] }), P("plan_interval", "safe", "", { top: true }), P("user_id", "gated", "", { top: true })],
        note: "Renewals come from billing, server-side, so a closed browser tab never loses revenue.", consent: GA },
    ]},
    { stage: "Lifecycle", need: "crm", server: true, rows: [
      { name: "subscription_renewed", badge: "custom", srv: true, when: "Billing system renews a subscription.",
        params: [P("client_id", "gated", "captured at sign-up"), P("user_id", "gated"), P("transaction_id", "safe", "", { ex: "in_1R2aBc" }), P("value", "safe", "", { ex: 49 }), P("currency", "safe")],
        consent: AT("sign-up") },
      { name: "subscription_cancelled", badge: "custom", srv: true, when: "Customer cancels.",
        params: [P("client_id", "gated"), P("user_id", "gated"), P("plan_id", "safe"), P("cancel_reason", "safe", "fixed list")],
        note: "Use the fixed reasons from your cancel flow. Free-text feedback goes to your CRM, not analytics.", consent: AT("sign-up") },
      { name: "refund", badge: "recommended", srv: true, when: "Refund issued.",
        params: [P("client_id", "gated"), P("transaction_id", "safe", "", { ex: "in_1Q8ZtA" }), P("value", "safe", "", { ex: 49 }), P("currency", "safe")], consent: AT("sign-up") },
    ]},
    { stage: "Ad platforms", dest: true, rows: [
      { name: "Google Ads · sign-up & purchase", need: "ads", badge: "enhanced conversions", when: "Same moments as sign_up and purchase.",
        params: [P("sha256_email_address", "hash"), P("transaction_id", "safe"), P("value", "safe"), P("gclid", "gated", "auto")],
        note: "Optimise bids on <code>purchase</code> or a qualified trial, not raw sign-ups, once you have volume.", consent: ["ad_storage", "ad_user_data"] },
      { name: "Meta · CompleteRegistration / Subscribe", need: "meta", badge: "Pixel + Conversions API", when: "Same moments as sign_up and purchase.",
        params: [P("em", "hash"), P("external_id", "hash", "hashed user_id"), P("value", "safe"), P("event_id", "safe", "dedup key"), P("fbp / fbc", "gated")],
        note: "Send renewals through the Conversions API only. There is no browser to fire a Pixel from.", consent: ["marketing category"] },
    ]},
  ],

  publisher: [
    { stage: "Read", rows: [
      { ...PV("<strong>Redact</strong> newsletter tracking tokens and email parameters (<code>?email=</code>, <code>?e=</code>) that email tools append to links."),
        auto: false, badge: "recommended", when: "Every page load, with content metadata pushed before the GA4 config tag fires.",
        params: [P("page_location", "safe", "redacted"), P("page_title", "safe"), P("content_type", "safe"), P("content_group", "safe", "section"), P("article_id", "safe"), P("publish_date", "safe")],
        note: "Push the content metadata to the dataLayer on page load so GTM can attach it to <code>page_view</code>. Set <code>content_group</code> as GA4's content group." },
      { name: "article_read", badge: "custom", when: "Reader reaches 25 / 50 / 75 / 100% of the article body.",
        params: [P("article_id", "safe"), P("content_group", "safe"), P("read_depth", "safe", "25 / 50 / 75 / 100")],
        note: "Measure the article body, not the whole page. GA4's built-in scroll event only fires at 90% of the page.", consent: GA },
      { name: "video_start / video_complete", badge: "auto", auto: true, when: "Embedded YouTube videos (enhanced measurement).",
        params: [P("video_title", "safe"), P("video_percent", "safe")], consent: GA },
    ]},
    { stage: "Engage", rows: [
      { name: "search", badge: "recommended", when: "Site search is used.",
        params: [P("search_term", "safe", "redacted", { ex: "attribution models" })],
        note: "Strip emails and phone numbers from search terms before sending.", consent: GA },
      { name: "share", badge: "recommended", when: "Share button used.",
        params: [P("method", "safe", "", { ex: "linkedin" }), P("content_type", "safe"), P("item_id", "safe")], consent: GA },
      { name: "newsletter_signup", badge: "custom", conv: true, when: "Signup confirmed by your email platform (after double opt-in if you use it).",
        params: [P("newsletter_id", "safe"), P("signup_location", "safe"), P("article_id", "safe", "article it happened on")],
        note: "The email goes to your email platform directly. The analytics event only knows that a signup happened, and where.", consent: GA },
    ]},
    { stage: "Monetise", rows: [
      { name: "paywall_view", badge: "custom", when: "Paywall or registration wall shown.",
        params: [P("paywall_id", "safe"), P("article_id", "safe"), P("content_group", "safe")], consent: GA },
      { name: "purchase", badge: "recommended", ecom: true, dedupe: "transaction_id", when: "Subscription payment confirmed.",
        params: [P("transaction_id", "safe", "non-guessable", { ex: "SUB-4QX81" }), P("value", "safe", "", { ex: 9 }), P("currency", "safe"), P("items", "safe", "the plan", { ex: [{ item_id: "digital_monthly", item_name: "Digital", item_category: "subscription", price: 9, quantity: 1 }] }), P("paywall_id", "safe", "wall that converted", { top: true })],
        consent: GA },
    ]},
    { stage: "Subscriber lifecycle", need: "crm", server: true, rows: [
      { name: "subscription_cancelled", badge: "custom", srv: true, when: "Subscriber cancels.",
        params: [P("client_id", "gated", "captured at purchase"), P("plan_id", "safe", "", { ex: "digital_monthly" }), P("cancel_reason", "safe", "fixed list")],
        consent: AT("purchase") },
    ]},
    { stage: "Ad platforms", dest: true, rows: [
      { name: "Google Ads · subscription", need: "ads", badge: "enhanced conversions", when: "Same moment as purchase.",
        params: [P("sha256_email_address", "hash"), P("transaction_id", "safe"), P("value", "safe"), P("gclid", "gated", "auto")],
        consent: ["ad_storage", "ad_user_data"] },
      { name: "Meta · Subscribe / Lead", need: "meta", badge: "Pixel + Conversions API", when: "Same moments as purchase and newsletter_signup.",
        params: [P("em", "hash"), P("event_id", "safe", "dedup key"), P("fbp / fbc", "gated")],
        note: "Do not build audiences from article topics that reveal health, politics, religion or sexuality.", consent: ["marketing category"] },
    ]},
  ],

  booking: [
    { stage: "Discover", rows: [
      PV("<strong>Redact</strong> booking references, names and appointment tokens from confirmation and manage-booking URLs."),
      { name: "view_item", badge: "recommended", ecom: true, when: "A service or location page loads.",
        params: [P("currency", "safe"), P("value", "safe", "", { ex: 60 }), P("items", "safe", "the service", { ex: [{ item_id: "svc_cut_style", item_name: "Cut & style", item_category: "hair", price: 60, quantity: 1 }] })],
        note: "Use generic service categories. In health, wellness or legal services, the service name itself can be sensitive.", consent: GA },
      { name: "search", badge: "recommended", when: "Location or service search.",
        params: [P("search_term", "safe", "redacted", { ex: "haircut" }), P("location_region", "safe", "coarse area only")],
        note: "Coarse region only. Never a street address or postcode a person typed.", consent: GA },
    ]},
    { stage: "Book", rows: [
      { name: "booking_start", badge: "custom", when: "Booking flow opened.",
        params: [P("service_id", "safe"), P("service_category", "safe")], consent: GA },
      { name: "select_slot", badge: "custom", when: "A time slot is chosen.",
        params: [P("service_id", "safe"), P("days_ahead_band", "safe", "0-1 / 2-7 / 8+"), P("slot_daypart", "safe", "morning / afternoon / evening")],
        note: "Bands, not the exact date and time. An exact appointment time plus a location can identify one person.", consent: GA },
      { name: "booking_complete", badge: "custom", conv: true, dedupe: "booking_id", when: "Booking confirmed by the server.",
        params: [P("booking_id", "safe", "non-guessable"), P("service_id", "safe"), P("service_category", "safe"), P("party_size", "safe"), P("value", "safe", "", { ex: 60 }), P("currency", "safe")],
        note: "If customers pay online, send <code>purchase</code> with the booking ID as <code>transaction_id</code> instead.", consent: GA },
    ]},
    { stage: "After the visit", need: "crm", server: true, rows: [
      { name: "booking_cancelled", badge: "custom", srv: true, when: "Booking cancelled or no-show recorded.",
        params: [P("client_id", "gated", "captured at booking"), P("booking_id", "safe"), P("cancel_reason", "safe", "fixed list", { ex: "customer_cancelled" })],
        consent: AT("booking") },
    ]},
    { stage: "Ad platforms", dest: true, rows: [
      { name: "Google Ads · booking conversion", need: "ads", badge: "enhanced conversions", when: "Same moment as booking_complete.",
        params: [P("sha256_email_address", "hash"), P("sha256_phone_number", "hash"), P("value", "safe"), P("gclid", "gated", "auto")],
        consent: ["ad_storage", "ad_user_data"] },
      { name: "Meta · Schedule", need: "meta", badge: "Pixel + Conversions API", when: "Same moment as booking_complete.",
        params: [P("em", "hash"), P("ph", "hash"), P("event_id", "safe", "= booking_id"), P("fbp / fbc", "gated")],
        note: "For health, wellness or other sensitive services, keep the service name and category off Meta entirely.", consent: ["marketing category"] },
    ]},
  ],
};

export const NEVER = {
  b2b: [
    ["email", "Hash it for ad platforms only. A raw email in GA4 breaks Google's terms and makes the property deletable."],
    ["phone", "Same rule as email: hashed for ads, absent everywhere else."],
    ["full name", "No analytics question needs a name. The CRM already has it."],
    ["message / free text", "Visitors write anything in a free-text box, including health and financial details."],
    ["job title + company name", "Together they identify one person at a small firm. Use a company size band instead."],
    ["user_id = email", "User IDs must be opaque internal IDs, never an email or anything derived from it unhashed."],
  ],
  ecom: [
    ["email", "Hashed for ad matching only, never as an event parameter or user property."],
    ["phone", "Hashed for ads only."],
    ["shipping / billing address", "Send the shipping tier or region, never the address."],
    ["card or payment details", "Payment method type only. Anything more creates a PCI problem in your analytics."],
    ["customer name", "Including inside page titles like \"Hi Jane\"."],
    ["user_id = email", "Use the internal customer ID, never the email."],
  ],
  saas: [
    ["email", "Hashed for ad platforms only. Never a GA4 parameter, user property or user_id."],
    ["full name", "The app knows who the user is. Analytics doesn't need to."],
    ["workspace / company name", "Often identifies one customer outright. Use plan, seats band or an internal account ID."],
    ["user-created content", "Document titles, messages, file names and search inside the app stay out of analytics."],
    ["card or billing details", "Billing system only. Send the plan and amount, never payment data."],
    ["user_id = email", "Opaque database IDs only."],
  ],
  publisher: [
    ["email", "Goes straight to your email platform. Never in the dataLayer, even on the signup event."],
    ["name / comment author", "Comment systems often push the author's name. Turn that off."],
    ["comment text", "Free text, so it can contain anything."],
    ["reading history tied to identity", "Topics read can reveal health, politics, religion or sexuality. Don't link them to a person in ad audiences."],
    ["precise location", "Region at most. GA4 derives coarse location itself."],
    ["user_id = email", "Use an opaque subscriber ID."],
  ],
  booking: [
    ["name, email, phone", "Booking system only. Hashed email and phone go to ad platforms, nothing raw anywhere."],
    ["reason for visit / notes", "Often health information. Never in analytics or ad platforms."],
    ["date of birth", "Use an age band only if you truly need it, and never send it to ad platforms."],
    ["exact appointment time", "Send a day-part band. The exact slot plus a location identifies one person."],
    ["home address / postcode", "Region at most."],
    ["user_id = email", "Use the booking system's internal customer ID."],
  ],
};

export const TAGS = [
  { t: "GA4 (all browser events)", a: 1, s: 0, u: 0, p: 0, note: "Ad signals also gate Google signals and ads linking." },
  { t: "Google Ads conversion", a: 0, s: 1, u: 1, p: 0, need: "ads", note: "ad_user_data covers enhanced conversions." },
  { t: "Google Ads remarketing", a: 0, s: 1, u: 1, p: 1, need: "ads", note: "Needs all three ad signals." },
  { t: "Measurement Protocol (server)", a: 1, s: 0, u: 1, p: 1, need: "crm", note: "No cookies, but pass the consent recorded at submit in the request body." },
  { t: "Meta Pixel + Conversions API", a: "—", s: "—", u: "—", p: "—", need: "meta", note: "Not Consent Mode. Gate on your banner's marketing category, both browser and server side." },
];

export const LEAKS = [
  { t: "Emails in URLs", check: "In a GA4 exploration, filter page_location for \"@\" or \"%40\".", fix: "Submit forms with POST, turn on GA4 data redaction for email and query parameters in the web stream, and strip parameters in GTM." },
  { t: "Form values captured by GTM", check: "Look for Form Text, Click Text or Form Element variables on tags that fire near forms.", fix: "Send form_id and a fixed label only. Never read field values in the browser for analytics." },
  { t: "User ID set to an email", check: "Inspect the user_id in GTM preview or the user_id column in BigQuery.", fix: "Use the opaque internal ID from your database." },
  { t: "Names in page titles", check: "Run a page_title report for account, dashboard and order pages.", fix: "Override page_title on logged-in pages with a generic title." },
  { t: "Personal data in site search", check: "Scan search_term values for emails, phone numbers and order numbers.", fix: "Redact matching patterns before the event is sent." },
  { t: "Error messages as parameters", check: "Look for events like form_error with text such as \"jane@x.com is already registered\".", fix: "Send an error code, never the message." },
  { t: "Form plugins pushing the whole submission", check: "Submit a test form and read the dataLayer in GTM preview.", fix: "Turn off the plugin's dataLayer output, or push your own clean event instead." },
  { t: "Meta automatic advanced matching", need: "meta", check: "In Events Manager, check whether automatic advanced matching is on.", fix: "Turn it off, or load the Pixel only after marketing consent." },
];
