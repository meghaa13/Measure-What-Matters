# dataLayer requirements — meghakarnwal site (v4)

Measurement plan for every page: the landing page (`/`) and all micro tools — Tag Health Scan (`/apps/tag-scanner`), Lead Path X-Ray (`/apps/lead-path`), AI Visibility Check (`/apps/ai-crawler-gate`) and The Clean Tracking Plan builder (`/apps/clean-tracking-plan`). Every push goes through `track()` / `toolEvent()` in `app/lib/analytics.js`. Click tracking and page-level events live in `app/Analytics.js`.

## Rules

- **No personal data in any push.** No names, emails, phone numbers or free text. The scanner's email capture goes to Netlify Forms, never to the dataLayer.
- Event and parameter names are `snake_case`. Values are fixed labels.
- Google tag ID, booking URL and audience copy are set in `app/lib/site.js` and the `NEXT_PUBLIC_GTM_ID` environment variable.

## Key events (mark as key events in GA4)

| Event | Why | Use in ads? |
|---|---|---|
| `call_booked` | Booking tool redirects back with `?booked=1` | **Primary conversion** |
| `generate_lead` | Email given anywhere. `lead_source`: `tag_scan`, `lead_path_monitoring`, `ai_citations`, `contact_form` | Secondary |
| `tool_complete` | A tool produced a result (filter by `tool_name`) | No (audience building) |
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
| `consent_update` | Visitor chooses in the cookie banner (EEA/UK/CH only) | `analytics_consent`, `ads_consent` (`granted`/`denied`), `method` (`accept_all`/`reject_all`/`save_choices`) |
| `engaged_30s` / `engaged_60s` | Tab visible at 30s / 60s | none |

### Clicks (declarative: `data-track` + `data-loc` + `data-app`)

Every click event carries: `cta_location` (from `data-loc`), `cta_text` (visible text, max 60 chars), `app_name` (from `data-app`), `link_url`.

| Event | Where (`cta_location`) |
|---|---|
| `cta_click` | `nav`, `floating`, `hero`, `after_work`, `after_trust`, `pov`, `contact`, `tag_scan`, `builder_cta` |
| `anchor_click` | `nav` (Approach / Method / Proof / Tools), `hero` ("See how I work") |
| `email_click` | `contact`, `tag_scan`, `builder_cta` (`method: copy`) |
| `resume_download` | `contact` |
| `outbound_click` | `footer` (LinkedIn) |
| `tool_open` | `micro_tools` (`app_name`: `tag_health_scan` / `lead_path_xray` / `ai_visibility`) |
| `app_open` | `side_hustle` (`app_name: clean_tracking_plan`) |

### Landing page interactions

| Event | Fires when | Parameters |
|---|---|---|
| `story_step` | Story tab or arrow | `step_number` 1–4, `step_name`, `method` (`tab` / `next` / `prev`) |
| `faq_open` | FAQ item opened | `item_name` |
| `app_select` | Side-hustle app tab | `app_name`, `method` |
| `app_download` | Comment Co-Pilot zip | `app_name`, `file_name` |
| `install_guide_toggle` | "How to install" | `app_name`, `action` |

### Micro tools — one schema for all four

Every tool pushes the same four events, so one GA4 event tag plus a `tool_name` custom dimension covers them all. `tool_name`: `tag_health_scan`, `lead_path_xray`, `ai_visibility`, `clean_tracking_plan`.

| Event | Fires when | Common parameters |
|---|---|---|
| `tool_start` | Check submitted / builder opened | `tool_name`, `input_source` (`typed` / `example` / `recent`; builder: `direct` / `shared_link`) |
| `tool_complete` | Result shown / plan exported | `tool_name`, `input_source`, plus tool-specific below |
| `tool_error` | Check failed or nothing found | `tool_name`, `error_type` (`request_failed`, `rate_limited`, `network`, `no_tags_found`, `archive_timeout`) |
| `tool_action` | Interaction inside a result | `tool_name`, `action`, plus detail below |

Tool-specific parameters:

| Tool | `tool_complete` extras | `tool_action` values (`action`) |
|---|---|---|
| Tag Health Scan | `input_type` (`url`/`tag_id`), `tracking_health` 0–100, `findings`, `tags_found`, `not_tracked`, `id_source` (`live`/`archive`/`pasted`) | `report_nav` (`section`), `expand_tag_group` (`group`) |
| Lead Path X-Ray | `mode` (`single`/`bulk`); single: `click_pass`, `forms`, `broken_stage` (`arrives`/`landing_page`/`form`/`crm`/`none`), `page_source` (`live`/`archive`); bulk: `links`, `broken`, `with_spend` | `open_bulk`, `show_fix_snippet`, `open_crm_test_link` |
| AI Visibility Check | `assistants_visible`, `crawlers_blocked`, `cdn`, `robots` | `show_technical_details`, `choose_robots_preset` / `copy_robots` / `download_robots` (`preset`), `copy_ai_channel_regex`, `citation_free_question`, `citation_sample_complete` |
| Clean Tracking Plan | `format` (`csv`/`json`), `site_type`, `market` | `select_site_type` / `select_market` (`selection`), `toggle_stack` (`stack_item`, `enabled`), `copy_code` (`snippet`), `share_plan`, `use_hash_lab` |

Email captures inside tools fire `generate_lead` (see Key events). The URL, domain or tag ID a visitor types is **never** pushed.

### Sections (`section_view` → `section_name`)

- Tool pages: `tool_hero`, `how_it_works` (scanner), then report sections as they appear: `report_snapshot`, `report_tracked`, `report_coverage`, `report_issues`, `report_next_step` (scanner); `report_verdict`, `report_click_survival`, `report_forms`, `report_crm_test`, `report_bulk` (lead path); `report_verdict`, `report_citations`, `report_robots_fix` (AI visibility).
- Sections that render after load (reports) are picked up automatically.

### Retired event names

`tag_scan_*`, `lead_path_*`, `ai_gate_*`, `ai_citations_complete`, `ai_regex_copy`, `robots_*`, `builder_open`, `site_type_select`, `market_select`, `stack_toggle`, `code_copy`, `plan_export`, `plan_share`, `hash_lab_used`, `crm_test_open`, `lead_path_monitoring_signup` → all replaced by the tool events above. Remove their GTM triggers.

## Ads message match

Append `?aud=hiring` or `?aud=clients` to each ad group's final URL. The hero eyebrow and subhead swap, the H1 stays constant, and `lp_audience` records which version was seen.

## GTM setup

1. Set `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX` in Netlify → Environment variables, then redeploy. Without it GTM doesn't load.
2. Consent Mode v2 defaults are set before GTM loads: all signals denied for EEA, UK, CH, NO, IS, LI; analytics granted and ads denied elsewhere. Add a consent banner before targeting EEA/UK traffic.
3. Data Layer Variables: `cta_location`, `cta_text`, `app_name`, `link_url`, `section_name`, `percent_scrolled`, `step_number`, `step_name`, `method`, `item_name`, `lp_audience`, `lp_version`, `page_type`, `utm_*`, `has_gclid`, `tracking_health`, `findings`, `id_source`, `input_type`, `lead_source`, `file_name`, `action`, `page_path`, `page_title`.
4. One GA4 Event tag with event name `{{Event}}` on a Custom Event trigger matching the event names above (regex), plus a `page_view` tag on `virtual_page_view`.
5. In GA4 enhanced measurement, turn off **File downloads** (replaced by `resume_download` / `app_download`) and **page changes based on browser history** (replaced by `virtual_page_view`).
