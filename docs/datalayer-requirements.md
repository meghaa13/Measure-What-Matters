# dataLayer requirements — meghakarnwal site (v4)

Measurement plan for the landing page (`/`), the Tag Health Scan (`/apps/tag-scanner`) and The Clean Tracking Plan builder (`/apps/clean-tracking-plan`). Every push goes through `track()` in `app/lib/analytics.js`. Click tracking and page-level events live in `app/Analytics.js`.

## Rules

- **No personal data in any push.** No names, emails, phone numbers or free text. The scanner's email capture goes to Netlify Forms, never to the dataLayer.
- Event and parameter names are `snake_case`. Values are fixed labels.
- Google tag ID, booking URL and audience copy are set in `app/lib/site.js` and the `NEXT_PUBLIC_GTM_ID` environment variable.

## Key events (mark as key events in GA4)

| Event | Why | Use in ads? |
|---|---|---|
| `call_booked` | Booking tool redirects back with `?booked=1` | **Primary conversion** |
| `generate_lead` | Email given to unlock the full Tag Health Scan report (`lead_source: tag_scan`) | Secondary |
| `cta_click` | Any "Book" button | Secondary (micro) |
| `email_click` | Email link | Secondary |
| `resume_download` | Résumé PDF | Secondary (hiring campaigns) |

`call_booked` needs `BOOKING_URL` set in `app/lib/site.js` and the booking tool's redirect pointing at `https://<site>/?booked=1`.

## Event catalogue

### Every page

| Event | Fires when | Parameters |
|---|---|---|
| `lp_context` | Page load | `lp_audience` (`general` / `hiring` / `clients`), `lp_version`, `page_type`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `has_gclid` |
| `call_booked` | Page loads with `?booked=1` | `lp_audience` |
| `virtual_page_view` | Client-side navigation between pages | `page_path`, `page_title`, `page_type` |
| `section_view` | 40% of a section on screen, once each | `section_name` |
| `scroll_depth` | 25 / 50 / 75 / 90% of the page | `percent_scrolled` |
| `engaged_30s` / `engaged_60s` | Tab visible at 30s / 60s | none |

### Clicks (declarative: `data-track` + `data-loc` + `data-app`)

Every click event carries: `cta_location` (from `data-loc`), `cta_text` (visible text, max 60 chars), `app_name` (from `data-app`), `link_url`.

| Event | Where (`cta_location`) |
|---|---|
| `cta_click` | `nav`, `floating`, `hero`, `after_work`, `after_trust`, `pov`, `contact`, `tag_scan` |
| `anchor_click` | `nav` (Approach / Method / Proof / Tools), `hero` ("See how I work") |
| `email_click` | `contact`, `tag_scan` |
| `resume_download` | `contact` |
| `outbound_click` | `footer` (LinkedIn) |
| `tool_open` | `micro_tools` (`app_name: tag_health_scan`) |
| `app_open` | `side_hustle` (`app_name: clean_tracking_plan`) |

### Landing page interactions

| Event | Fires when | Parameters |
|---|---|---|
| `story_step` | Story tab or arrow | `step_number` 1–4, `step_name`, `method` (`tab` / `next` / `prev`) |
| `faq_open` | FAQ item opened | `item_name` |
| `app_select` | Side-hustle app tab | `app_name`, `method` |
| `app_download` | Comment Co-Pilot zip | `app_name`, `file_name` |
| `install_guide_toggle` | "How to install" | `app_name`, `action` |

### Tag Health Scan

| Event | Fires when | Parameters |
|---|---|---|
| `tag_scan_start` | Scan submitted | `input_type` (`url` / `tag_id`) |
| `tag_scan_complete` | Report shown | `tracking_health` (0–100), `findings`, `id_source` (`live` / `archive` / `pasted`) |
| `tag_scan_need_ids` | No tags found; visitor asked to paste an ID | none |
| `generate_lead` ★ | Email given for the full report | `lead_source: tag_scan`, `tracking_health` |

The scanned domain is never pushed.

### Builder (`/apps/clean-tracking-plan`)

`builder_open`, `site_type_select`, `market_select`, `stack_toggle`, `code_copy`, `plan_export`, `plan_share`, `hash_lab_used`, and `contact_click` (`link_location: builder_cta`). Parameters as in the builder source.

## Ads message match

Append `?aud=hiring` or `?aud=clients` to each ad group's final URL. The hero eyebrow and subhead swap, the H1 stays constant, and `lp_audience` records which version was seen.

## GTM setup

1. Set `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX` in Netlify → Environment variables, then redeploy. Without it GTM doesn't load.
2. Consent Mode v2 defaults are set before GTM loads: all signals denied for EEA, UK, CH, NO, IS, LI; analytics granted and ads denied elsewhere. Add a consent banner before targeting EEA/UK traffic.
3. Data Layer Variables: `cta_location`, `cta_text`, `app_name`, `link_url`, `section_name`, `percent_scrolled`, `step_number`, `step_name`, `method`, `item_name`, `lp_audience`, `lp_version`, `page_type`, `utm_*`, `has_gclid`, `tracking_health`, `findings`, `id_source`, `input_type`, `lead_source`, `file_name`, `action`, `page_path`, `page_title`.
4. One GA4 Event tag with event name `{{Event}}` on a Custom Event trigger matching the event names above (regex), plus a `page_view` tag on `virtual_page_view`.
5. In GA4 enhanced measurement, turn off **File downloads** (replaced by `resume_download` / `app_download`) and **page changes based on browser history** (replaced by `virtual_page_view`).
