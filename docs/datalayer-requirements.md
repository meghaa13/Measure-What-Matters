# dataLayer requirements — meghakarnwal site

Measurement plan for the landing page (`/`) and The Clean Tracking Plan builder (`/apps/clean-tracking-plan`).
All pushes go through `track()` in `app/lib/analytics.js`.

## Rules

- **No personal data in any push.** No names, emails, phone numbers or free text. Visitors type into the builder's hash lab; those values are never pushed.
- Event and parameter names are `snake_case`. Values are fixed labels, not visible text that can change.
- GA4 recommended event names are used where one fits. Everything else needs registering as a custom dimension (see the bottom of this doc).

## Business questions

| Question | Answered by |
|---|---|
| How many visitors want to talk? (the key event) | `contact_click` |
| Which CTA placement drives contact: nav, hero or the contact block? | `cta_click.cta_location` → `contact_click` |
| Which sections do people actually reach before leaving? | `section_view` |
| Do the interactive stories get used? | `funnel_step_view`, `case_study_toggle` |
| Which app draws interest, and does it convert to a download or use? | `app_select`, `app_download`, `app_open`, `builder_open` |
| What do builder users configure and take away? | `site_type_select`, `market_select`, `stack_toggle`, `code_copy`, `plan_export` |
| Is the résumé being downloaded? | `resume_download` |

## Key events (mark as key events in GA4)

1. `contact_click`: any email, email-copy or LinkedIn contact. This is the site's lead signal.
2. `resume_download`
3. `app_download` and `plan_export`: a visitor took an app away.

## Event catalogue

### Site-wide

| Event | Fires when | Parameters |
|---|---|---|
| `virtual_page_view` | Client-side navigation between pages (e.g. landing ↔ builder). The first load is the GA4 config tag's own `page_view`. | `page_path`, `page_title`, `page_type` (`home` / `app`) |
| `section_view` | 40% of a section is on screen, once per section per page load | `section_name`: `hero`, `story`, `method`, `work`, `apps`, `trust`, `point_of_view`, `contact` |

### Landing page

| Event | Fires when | Parameters |
|---|---|---|
| `navigation_click` | Nav link clicked | `link_text`: `Method` / `Work` / `Apps` |
| `cta_click` | A CTA that scrolls within the page | `cta_location`: `nav` / `hero`, `cta_text` |
| `contact_click` ★ | Email or LinkedIn link | `contact_method`: `email` / `linkedin` / `email_copy`, `link_location`: `contact_cta` / `contact_text` / `builder_cta`, `cta_text` (when a button) |
| `resume_download` ★ | Résumé downloaded | `link_location` |
| `funnel_step_view` | Visitor changes step in the "story" funnel | `step_number` 1–4, `step_name`, `method`: `tab` / `next` / `prev` |
| `case_study_toggle` | Client case opened or closed | `case_name`: `AvePoint` / `QS` / `Cordia Energy`, `action`: `open` / `close` |
| `app_select` | Visitor switches app | `app_name`: `comment_co_pilot` / `clean_tracking_plan`, `method`: `tab` / `card` |
| `app_download` ★ | Comment Co-Pilot zip downloaded | `app_name`, `file_name` |
| `install_guide_toggle` | "How to install" opened or closed | `app_name`, `action` |
| `app_open` | "Open the builder" clicked | `app_name`, `link_location`: `apps_section` |

### Builder (`/apps/clean-tracking-plan`)

| Event | Fires when | Parameters |
|---|---|---|
| `builder_open` | Builder loads | `app_name` |
| `site_type_select` | Website type changed | `selection`: `b2b` / `ecom` / `saas` / `publisher` / `booking` |
| `market_select` | Market changed | `selection`: `us` / `ca` / `au` / `eu` |
| `stack_toggle` | Stack chip toggled | `tool`: `ads` / `meta` / `crm` / `cmp`, `enabled` |
| `code_copy` | Any code copied | `snippet` (file or event name), `site_type` |
| `plan_export` ★ | CSV or JSON downloaded | `format`: `csv` / `json`, `site_type` |
| `plan_share` | "Copy link to this plan" | `site_type` |
| `hash_lab_used` | First keystroke in the hash lab (values are never sent) | — |
| `contact_click` ★ | "Book a 20-min call" or "Copy" email in the builder CTA | `contact_method`, `link_location`: `builder_cta`, `site_type`, `market` |

## Example pushes

```js
dataLayer.push({ event: 'cta_click', cta_location: 'hero', cta_text: 'Book a 20-min call' });

dataLayer.push({ event: 'contact_click', contact_method: 'email', link_location: 'contact_cta', cta_text: 'Book a 20-min call' });

dataLayer.push({ event: 'funnel_step_view', step_number: 3, step_name: 'Find the step', method: 'next' });

dataLayer.push({ event: 'app_select', app_name: 'clean_tracking_plan', method: 'tab' });

dataLayer.push({ event: 'plan_export', format: 'csv', site_type: 'saas' });
```

## How it's wired

- **Static links** carry `data-track="event_name"` plus `data-ev-*` attributes. A single click listener in `app/Analytics.js` turns `data-ev-cta-location="hero"` into `cta_location: 'hero'`. Adding tracking to a new link needs no JavaScript.
- **Interactive components** (`FunnelStory`, `WorkAccordion`, `AppsSection`, `Builder`) call `track()` directly.
- **Sections** carry `data-section="name"` for `section_view`.

## GTM setup

1. Set `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX` in Netlify (Site configuration → Environment variables) and redeploy. Without it, GTM doesn't load and pushes stay local.
2. The loader sets Consent Mode v2 defaults before GTM loads: all four signals **denied** for EEA, UK, Switzerland, Norway, Iceland and Liechtenstein; `analytics_storage` **granted** and ad signals **denied** everywhere else. The site runs no ads. Add a consent banner before targeting EEA/UK traffic, or analytics stays off there.
3. **Variables (Data Layer Variable, v2):** `cta_location`, `cta_text`, `link_text`, `link_location`, `contact_method`, `section_name`, `step_number`, `step_name`, `method`, `case_name`, `action`, `app_name`, `file_name`, `selection`, `tool`, `enabled`, `snippet`, `site_type`, `market`, `format`, `page_path`, `page_title`, `page_type`.
4. **Triggers:** one Custom Event trigger matching the regex `^(navigation_click|cta_click|contact_click|resume_download|section_view|funnel_step_view|case_study_toggle|app_select|app_download|install_guide_toggle|app_open|builder_open|site_type_select|market_select|stack_toggle|code_copy|plan_export|plan_share|hash_lab_used)$`, plus a separate one for `virtual_page_view`.
5. **Tags:**
   - Google tag (GA4 config) on Initialization – All Pages.
   - One GA4 Event tag, event name `{{Event}}`, on the regex trigger, with the variables above as event parameters.
   - A GA4 Event tag named `page_view` on `virtual_page_view`, sending `page_location` = page URL and `page_title`.
6. **GA4 enhanced measurement:** turn off **File downloads**. `resume_download` and `app_download` replace it and carry better parameters; leaving both on double-counts. Leave **Page changes based on browser history events** off too, because `virtual_page_view` covers it.

## GA4 custom definitions (event scope)

`cta_location`, `cta_text`, `link_text`, `link_location`, `contact_method`, `section_name`, `step_name`, `method`, `case_name`, `action`, `app_name`, `selection`, `tool`, `snippet`, `site_type`, `market`, `format`, `page_type`. Register `step_number` as a custom metric if you want averages, otherwise as a dimension.
