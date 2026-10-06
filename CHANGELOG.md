# Changelog

All notable changes to meghakarnwal.com. Newest first. Branch flow: changes ship to `stage` first, and reach `main` (production) only after approval.

## [Unreleased] — on `stage`, awaiting approval for `main`

### 2026-10-06 · CRO X-Ray (tool 03)
- **Added** CRO X-Ray (`/apps/cro-xray`): a conversion audit of one page and the page its main button leads to. It reports a score ("N of M conversion basics in place"), the phone and desktop load times with screenshots, and ten areas that open on click: content and messaging, call to action, conversion journey, the form, trust and proof, questions and objections, navigation and structure, performance and loading, mobile and accessibility, data recording.
- **Added** a roadmap under the audit: quick fixes (defects, no test needed) and hypotheses to test, each tagged with its bucket (value proposition, conversion journey, engagement, conversions), test type, effort, and the goal it should move.
- **Added** links from the report to Tag Health Scan and Lead Path X-Ray.
- **How it works:** page content is read on the server; speed and accessibility come from Google PageSpeed, run in the visitor's browser for phone and desktop. Every recommendation is a written rule filled in with what was read from the page; no AI model is called.
- **Changed** AI Visibility Check from tool 03 to tool 04.
- **Not included yet:** the optional "what a stranger thinks you sell" AI read. It needs a paid AI call, so it is left out.
- **Needs before it is reliable:** a Google PageSpeed API key in `NEXT_PUBLIC_PSI_KEY`. Without one the speed half uses Google's shared free allowance, which was exhausted during testing.

### 2026-10-05 · Section names, "What I build" scene, section openings, security headers

**Site**
- **Changed** the names of two sections so the difference is clear: "Approach" is now "Finding the problem" and "Method" is now "What I build". Each has a one-line plain description above it.
- **Changed** "What I build" into its own scene: a purple panel with the text fixed on the left, while the four step cards come in from the right and settle over each other as you scroll or press the arrows. On phones the cards stack while scrolling down.
- **Added** a different opening for each section as it scrolls into view (wipes, word-by-word heading, staggered cards, 3D tilt, zoom, flip, slide, expand).
- **Added** three small effects: counting numbers in Proof, a glow that follows the pointer on cards, and a light sweep on the Book button.
- **Changed** "Finding the problem" on phones to show the chart before the text.
- **Added** auto-advance to "Finding the problem": the four step charts change every 2.5 seconds while on screen, pause under the pointer, and stop once the visitor picks a step.
- **Changed** the Proof section to open more gently: a short rise for the case cards, no tilt or wipe.
- **Removed** the slow colour drift behind the hero, and rewrote the Book button light sweep, which cut the idle load on the browser from about 45% to 17%.
- **Fixed** background dots appearing in the margins beside the hero.

**Security and upkeep**
- **Fixed** a failed Netlify build: fonts were fetched from Google Fonts during every build, and the build broke when that fetch went wrong. The three fonts are now files in `app/fonts`, so a build no longer needs Google. Same fonts, same total size.
- **Fixed** unintended AI spend: the Netlify AI Gateway supplies an AI key automatically, so every Tag Health Scan was making a paid AI call for its summary. AI calls now need `AI_FEATURES=on`; without it the scan uses the built-in summary.
- **Fixed** the security headers so they reach pages, not only files: `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` now come from `next.config.mjs`.
- **Removed** the `x-powered-by` header.
- **Added** a Dependabot config (monthly, targeting `stage`) and `docs/release-checklist.md` with the test sites and their expected results.

### 2026-10-04 · GTM container, phone menu, content accuracy, shorter page

**Measurement**
- **Added** the GTM container `GTM-PKHZLGS4` on every page (head loader after Consent Mode defaults, plus the noscript frame). `NEXT_PUBLIC_GTM_ID` can override it.

**Site**
- **Added** a phone menu: a menu button on small screens that lists every section.
- **Changed** the point-of-view notes to a 2×2 grid and the trust points to two columns (photo unchanged).
- **Removed** the KPI chips from the four case cards; each card now ends with its outcome.
- **Reverted** a trial that merged the FAQ into the Contact section; it made the closing section feel cluttered.
- **Changed** the background: drifting glows removed, dots halved.
- **Removed** the hero tool strip, the photo beside the Method heading, and the "Coming soon" tab.

**Content accuracy**
- **Changed** the Stack section to match the Method cards, and added R, Make, Apps Script and Next.js.
- **Changed** "Clarity" to "MS Clarity" everywhere.
- **Changed** the demo panels in Method to be labelled as examples.
- **Changed** the Proof header to "4 client sites" and "In-house at Intelegencia".
- **Changed** the Comment Co-Pilot sample so it no longer shows an invented client result.
- **Removed** repeated copy: Employee of the Quarter and "two years" each appear once; FAQ no longer repeats the Contact steps.
- **Removed** Clean Tracking Plan from the "Free tools" list in the footer; it sits under Side projects, as on the page.

**AI features**
- **Changed** the AI citation sample to off and hidden until a Claude API key is added (`ANTHROPIC_API_KEY` and `NEXT_PUBLIC_AI_CITATIONS=on`).

### 2026-10-04 · Universal dataLayer, logo, stack section, background dots

**Measurement**
- **Changed** the dataLayer to a universal context on every push (`session_id`, `visitor_id`, `visitor_type`, `page_path`, `previous_page_path`, `device_type` from window width) plus a fixed set of category events: `page_view`, `nav_click`, `cta_click`, `secondary_cta_click`, `outbound_click`, `faq_interaction`, `ui_interaction`, `form_start` / `form_details_entered` / `form_submit`, `tool_*`, `engaged_time`.
- **Added** tracking for every click on a clickable element; dead clicks are ignored. All footer links fire `nav_click` with `click_surface: footer`.
- **Added** `site_error`: script errors, failed promises, files that fail to load, failed tool API calls and the 404 page.
- **Changed** forms to send only the email domain. Visitor and session IDs are not stored before consent in consent-required countries, and are deleted on reject.
- **Removed** the old event names; the list is in `docs/datalayer-requirements.md`.

**Site**
- **Added** the animated logo in the header and consent banner, and as the browser tab icon.
- **Added** a tech stack section and a "Stack" link in the header and footer.
- **Added** background dots that fade in and out on empty background across the site, never over text, boxes or the hero.
- **Changed** the section order: Hero, Approach, Method, Proof, Stack, Free tools, Trust, Certificates, Side hustle, Point of view, FAQ, Contact.
- **Changed** the hero to a full-width tinted backdrop.
- **Removed** the two chat-style CTA blocks after sections.
- **Fixed** large empty gaps caused by a style-name clash, and trimmed section padding.

### 2026-10-03 · Consent by country (`6bd2af3`)
- **Added** a Netlify edge function (`netlify/edge-functions/geo.js`) that reads the visitor's country from IP geolocation and stores only the two-letter code in a one-day `mk_cc` cookie.
- **Changed** the consent banner to show for EEA, UK and Swiss visitors by country, with browser time zone as the fallback. Fixes the banner not appearing for VPN users and travellers.
- **Changed** the privacy notice to mention the country-code cookie.

### 2026-10-03 · Tools, privacy, consent and performance (`5c9c5d5`)

**New micro tools**
- **Lead Path X-Ray** (`/apps/lead-path`): follows a campaign link through redirects, tags and forms to show where its source gets lost before the CRM. Includes a bulk mode for many links, a form preview, a CRM self-test link, and an archive.org fallback for sites that block automated visits.
- **AI Visibility Check** (`/apps/ai-crawler-gate`): checks which AI assistants and crawlers can read a site (robots.txt, CDN, page content), generates a robots.txt fix, and offers a sampled AI citation check.
- **Tag Health Scan**: rebuilt report with tracked/not-tracked coverage, tag inventory grouped by purpose, report navigation, a "How it works" walkthrough and recent searches.

**Measurement**
- **Changed** every tool to the same four events: `tool_start`, `tool_complete`, `tool_error` and `tool_action`, with `tool_name` and `input_source`. Errors are now tracked.
- **Changed** every email capture to fire `generate_lead` with `lead_source`.
- **Added** `section_view` coverage for tool pages and report sections, including sections that appear after load.
- **Added** a `consent_update` event.
- **Removed** the old tool-specific event names (`tag_scan_*`, `lead_path_*`, `ai_gate_*`, `robots_*`, `builder_open`, `plan_export`, and others). The full list is in `docs/datalayer-requirements.md`. Their GTM triggers need replacing.

**Privacy and consent**
- **Added** a consent banner with Reject all, Choose and Accept all. The page is blurred until a choice is made, the banner steps aside on the privacy page, and "Cookie settings" reopens it from any footer. The choice is applied through Google Consent Mode.
- **Added** a privacy notice (`/privacy`) covering analytics, the tools, AI features, Netlify Forms and data rights (GDPR/UK, India DPDP Act 2023).
- **Added** a scanner disclaimer: reads only publicly available tag configuration.

**Site**
- **Added** a shared footer on every page with site sections, the free tools, contact details, Privacy and Cookie settings.
- **Added** a 404 page that links to the tools and home.
- **Added** `robots.txt` (blocks `/api/` and AI training crawlers, allows citing assistants) and `sitemap.xml`.
- **Changed** the hero to a full-width backdrop with a soft tint, glows and a dot grid.
- **Changed** the café photo in the point-of-view section to a new image, so photos no longer repeat.

**Performance and cost**
- **Changed** the photos from PNG to resized WebP: 8.4 MB down to about 0.4 MB. Images below the fold load lazily.
- **Added** cache headers: build assets cached for a year, uploads and downloads for a week, API responses never.
- **Added** a one-hour per-site cache for Tag Health Scan results, and kept rate-limit memory bounded.

**Security**
- **Added** security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS.
- **Fixed** gaps in the scanner's block on internal addresses: bracketed IPv6 literals and NAT64/6to4 ranges.

## 2026-10-02 · v4 landing page (`d105081`)
- **Added** the v4 landing page design.
- **Added** the Tag Health Scan micro app.
- **Added** the Comment Co-Pilot v0.2.0 download with install guide.

## 2026-10-01 · Launch
- **Added** dataLayer tracking for the main events, plus the requirements doc (`4e596ba`).
- **Changed** the hero headline (`d291a5f`).
- **Fixed** `netlify.toml` encoding by removing the BOM (`8a181c1`).
- **Added** the initial site for Netlify deploy (`1d97904`).

## Open items
- Set `BOOKING_URL` in `app/lib/site.js` to a scheduling link that redirects to `/?booked=1`. Until then, `call_booked` can't fire.
- Add `ANTHROPIC_API_KEY` and `NEXT_PUBLIC_GTM_ID` in the Netlify environment variables.
- Move GTM triggers to the new `tool_*` and `consent_update` events.
- Turn on Netlify Firewall Traffic Rules for site-wide rate limiting.
- Compress the résumé PDF (currently 2.5 MB).
- Add a Content-Security-Policy header once the GTM setup is final.
