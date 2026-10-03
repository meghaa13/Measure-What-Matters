# dataLayer requirements — meghakarnwal site (v5: universal context + categories)

Measurement plan for every page: the landing page (`/`), the four micro tools (`/apps/*`), `/privacy` and the 404 page. Every push goes through `track()` in `app/lib/analytics.js`. Click, form, page and engagement listeners live in `app/Analytics.js`.

## How it is built

1. **Universal context** rides on *every* push. One set of GTM variables serves all tags.
2. **Categories** decide the event. A small, fixed list of events, each with its own parameters. New buttons or sections add *values*, never new events.

## 1. Universal context (on every push)

| Parameter | Value | How it is set |
|---|---|---|
| `session_id` | Random 20-character ID | New after 30 minutes of inactivity or a new tab session |
| `visitor_id` | Random 20-character ID | Kept in the browser across visits |
| `visitor_type` | `new` / `returning` / `unknown` | `returning` from the second session on; `unknown` when IDs may not be stored |
| `page_path` | e.g. `/apps/lead-path` | Current path |
| `previous_page_path` | Path, or `(entry)` | Previous page on this site; `(entry)` on the first page of a visit |
| `device_type` | `mobile` (<768px) / `tablet` (<1024px) / `desktop` | **Window width**, not the user agent |

**Consent rule for IDs.** In consent-required countries (EEA, UK, Switzerland), nothing is stored until analytics is accepted: IDs live in memory for that page only and `visitor_type` is `unknown`. On "Reject", stored IDs are deleted. Elsewhere IDs are stored from the first page.

## 2. Event categories

### Page

| Event | Fires when | Parameters |
|---|---|---|
| `page_view` | Page load and every client-side navigation | `page_title`, `page_type` (`home` / `tool` / `legal` / `other`), `navigation_type` (`load` / `route_change`), `lp_audience`, `lp_version`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `has_gclid` |

### Rule: every click on something clickable is tracked

- Tagged elements fire their category event.
- Untagged links: another website → `outbound_click`; this site → `nav_click`.
- Untagged buttons, tabs, checkboxes and other controls → `ui_interaction` (`ui_kind` = the control type, `ui_label` = its text, `ui_state`), unless the control already pushed its own event for that click.
- Clicks on non-clickable areas (dead clicks) and disabled controls are not tracked.
- `click_surface` is resolved in this order: `data-loc`, then `footer` / `header`, then the nearest `data-section`, then `page`.

### Navigation clicks — `nav_click`

Moving around the site: logo, menu links, "See how I work", 404 links, and **every link in the footer** (site sections, tools, email, LinkedIn, résumé, Privacy, Cookie settings) with `click_surface: footer`. The one exception is the footer "Book a 20-min call", which stays the primary `cta_click` with `click_surface: footer`.

| Parameter | Values |
|---|---|
| `click_surface` | `header`, `footer`, `hero`, `not_found`, `side_hustle_tabs` (the app tabs: Comment Co-Pilot / The Clean Tracking Plan) |
| `click_text` | Visible text, max 60 characters |
| `click_url` | Link target |

### CTA clicks — `cta_click` (primary) and `secondary_cta_click`

`cta_click` is the primary call to action only: **Book a 20-min call** (`cta_intent: book_call`), wherever it appears, including the header button and the floating button. Every other call to action fires `secondary_cta_click` with the same parameters: open a tool, email, copy email, résumé, download.

| Parameter | Values |
|---|---|
| `click_surface` | `header`, `floating`, `hero`, `pov`, `contact`, `footer`, `micro_tools`, `side_hustle`, `tag_scan`, `lead_path`, `ai_gate`, `builder_cta` |
| `click_text` | Visible text |
| `click_url` | Link target (`mailto` for email links, never the address) |
| `cta_intent` | `cta_click`: `book_call`. `secondary_cta_click`: `open_tool`, `email`, `email_copy`, `resume_download`, `download` |
| `app_name` | Set when the CTA belongs to a tool or app |

### Outbound clicks — `outbound_click`

Any link to another website. Untagged external links are picked up automatically.

| Parameter | Values |
|---|---|
| `click_surface`, `click_text`, `click_url` | As above |
| `link_domain` | e.g. `linkedin.com` |

### FAQ — `faq_interaction`

| Parameter | Values |
|---|---|
| `faq_question` | The question text |
| `faq_state` | `opened` / `closed` |
| `faq_position` | 1-based position in the list |
| `click_surface` | `faq` |

The page it sits on and the page the visitor came from are in the universal context.

### Other UI controls — `ui_interaction`

| `ui_kind` | `ui_label` | `ui_state` | Extra |
|---|---|---|---|
| `story_step` | Step name | `selected` | `step_number`, `method` (`tab` / `next` / `prev`) |
| `app_step` | Step title | `selected` | `app_name`, `step_number` (the four steps under each app) |
| `install_guide` | `comment_co_pilot` | `opened` / `closed` | — |

All carry `click_surface`.

### Forms

`form_type`: `tag_scan_report`, `lead_path_monitoring`, `ai_citations`. `form_location`: where on the page (`report_gate`, `report_monitoring`, `report_citations`).

| Event | Fires when | Parameters |
|---|---|---|
| `form_start` | First focus inside the form | `form_type`, `form_location` |
| `form_details_entered` | A valid email is left in the field | `form_type`, `form_location`, `entered_fields`, `email_domain` |
| `form_submit` | Submit handled | `form_type`, `form_location`, `submit_status` (`success` / `failed`), `failure_reason`, `email_domain` |

Only the **domain** of the email is pushed (`company.com`), never the address.

### Tools

`tool_name`: `tag_health_scan`, `lead_path_xray`, `ai_visibility`, `clean_tracking_plan`.

| Event | Fires when | Parameters |
|---|---|---|
| `tool_start` | Check submitted / builder opened | `input_source` (`typed` / `example` / `recent`; builder: `direct` / `shared_link`) |
| `tool_complete` | Result shown / plan exported | Tool-specific results (below) |
| `tool_error` | Check failed or nothing found | `error_type` (`request_failed`, `rate_limited`, `network`, `no_tags_found`, `archive_timeout`) |
| `tool_action` | Interaction inside a result | `action` plus detail |

| Tool | `tool_complete` extras | `tool_action` → `action` |
|---|---|---|
| Tag Health Scan | `input_type`, `tracking_health`, `findings`, `tags_found`, `not_tracked`, `id_source` | `report_nav` (`section`), `expand_tag_group` (`group`) |
| Lead Path X-Ray | `mode`; single: `click_pass`, `forms`, `broken_stage`, `page_source`; bulk: `links`, `broken`, `with_spend` | `open_bulk`, `show_fix_snippet`, `open_crm_test_link` |
| AI Visibility Check | `assistants_visible`, `crawlers_blocked`, `cdn`, `robots` | `show_technical_details`, `choose_robots_preset` / `copy_robots` / `download_robots` (`preset`), `copy_ai_channel_regex`, `citation_free_question`, `citation_sample_complete` |
| Clean Tracking Plan | `format`, `site_type`, `market` | `select_site_type` / `select_market` (`selection`), `toggle_stack` (`stack_item`, `enabled`), `copy_code` (`snippet`), `share_plan`, `use_hash_lab` |

The URL, domain or tag ID a visitor types into a tool is never pushed.

### Engagement

| Event | Fires when | Parameters |
|---|---|---|
| `section_view` | 40% of a section on screen, once each | `section_name` |
| `scroll_depth` | 25 / 50 / 75 / 90% | `percent_scrolled` |
| `engaged_time` | Tab visible at 30s and 60s | `engaged_seconds` |

### Errors — `site_error`

One event for anything that goes wrong for a visitor. Capped at 10 per page view, and identical errors are sent once.

| `error_type` | Fires when | `error_source` |
|---|---|---|
| `javascript` | A script throws | file and line |
| `unhandled_promise` | A promise fails with no handler | — |
| `resource_load` | A script, image, stylesheet or font fails to load | file path |
| `api_request` / `api_rate_limited` / `api_server` | A tool's API answers 4xx / 429 / 5xx | API path |
| `api_network` | A tool's API can't be reached | API path |
| `page_not_found` | The 404 page is shown | the missing path |

Other parameters: `error_message` (max 150 characters), `error_status` (HTTP status when there is one), `error_fatal`.

`tool_error` still fires alongside for tool failures: it says what the visitor experienced; `site_error` says what technically failed.

### Consent and conversion

| Event | Fires when | Parameters |
|---|---|---|
| `consent_update` | Choice made in the banner | `consent_choice` (`accept_all` / `reject_all` / `save_choices`), `analytics_consent`, `ads_consent` |
| `call_booked` | Page loads with `?booked=1` | `lp_audience` |

## Key events (mark in GA4)

| Key event | Condition | Use in ads? |
|---|---|---|
| `call_booked` | — | **Primary** |
| `form_submit` | `submit_status = success` only | Secondary |
| `cta_click` | — (primary CTA only) | Secondary (micro) |

Do **not** mark failed submits, `form_start` or `form_details_entered` as key events.

## GTM setup

- **Data Layer Variables** for the six universal keys, used on every GA4 event tag.
- **One GA4 event tag per category**: `page_view`, `nav_click`, `cta_click`, `secondary_cta_click`, `outbound_click`, `faq_interaction`, `ui_interaction`, `form_.*`, `tool_.*`, engagement, `consent_update`, `call_booked`.
- Turn off GA4's automatic page views if `page_view` is sent from GTM, or you will count twice.
- All tags require `analytics_storage`.

## Retired event names

`lp_context`, `virtual_page_view`, `anchor_click`, `email_click`, `resume_download`, `tool_open`, `app_open`, `app_select`, `app_download`, `install_guide_toggle`, `story_step`, `faq_open`, `generate_lead`, `engaged_30s`, `engaged_60s`, and the parameters `cta_location` / `cta_text` / `link_url` (now `click_surface` / `click_text` / `click_url`).

## Ads message match

Append `?aud=hiring` or `?aud=clients` to each ad group's final URL. The hero eyebrow and subhead swap, the H1 stays constant, and `lp_audience` on `page_view` records which version was seen.
