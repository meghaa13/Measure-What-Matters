# Release checklist

How a change gets from your laptop to the live site, and what to check on the way.

## The flow (always the same)

1. **Build locally.** Make the change, run `npm run build`, look at it on `http://localhost:3000`.
2. **Push to `stage`.** Netlify deploys it to `https://stage--measure-what-matter.netlify.app` in a minute or two.
3. **Check on stage.** Run the checks below.
4. **Merge `stage` into `main`.** Only after you approve. Netlify deploys the live site.

Never edit the live site directly, and never push to `main` without going through stage.

## Test sites for the tools

Run these on stage before every merge. If a result changes and you did not change the scanner on purpose, something broke.

| Input | Tool | Expected (recorded 4 Oct 2026) |
|---|---|---|
| `intelegencia.com` | Tag Health Scan | Score 67. Live homepage. `GTM-MSSTNZHZ`, `G-LDEZ35T0VJ`. 24 tags, 3 findings. |
| `hotjar.com` | Tag Health Scan | Score 31. Live homepage. `GTM-NLLSLH3`, 7 GA4 properties. About 290 tags, 8 findings. A large container: checks the scanner copes with size. |
| `futurismtechnologies.com` | Tag Health Scan | Score 3. Read from an archive.org copy, because the live site blocks automated visits. Checks the archive fallback. |
| `GTM-MSSTNZHZ` | Tag Health Scan | Score 55. Source "Tag IDs you pasted". Checks pasted-ID mode. |
| `http://127.0.0.1/`, `http://10.0.0.5/`, `http://169.254.169.254/` | Tag Health Scan | "That address can't be scanned." Checks internal addresses stay blocked. |
| `intelegencia.com` | Lead Path X-Ray | A verdict with all four stages filled in. |
| `intelegencia.com` | AI Visibility Check | A verdict and a robots.txt fix. |

Other sites change their tags, so scores drift over time. A small drift is normal; a crash, an empty report or a blocked-address check that stops blocking is not.

## Page checks on stage

- Home, each tool page, `/privacy` and a wrong address (404) all load.
- Consent banner: `/?consent=test`, then Accept, Reject and Choose.
- Phone width: the menu opens and every section is reachable.
- Console: type `dataLayer` and confirm `page_view` and a click event appear, with no `site_error`.
- GTM Preview connects to the stage address.

## Monthly

- Merge the Dependabot pull requests into `stage`, run the checks above, then merge to `main`.
- Update Next.js and the Netlify Next.js runtime the same way.
- Look at Netlify usage: bandwidth, function calls, edge function calls.

## Netlify credits

What uses credits, largest first, and how to keep each low.

| What | Cost | How to keep it low |
|---|---|---|
| Production deploys | About 15 credits each | Collect changes and deploy once. Do not push small fixes one at a time. |
| AI inference (AI Gateway) | Per AI call | Netlify supplies an AI key by itself and bills each call. The site makes **no** AI calls unless `AI_FEATURES=on` is set. Leave it unset. |
| AI inference (Agent Runners) | Per use | This is the AI agent inside the Netlify dashboard. It only costs when you use it. |
| Bandwidth | By data sent | Images are WebP and cached. Test on localhost, not on stage. |
| Functions compute | By running time | Each tool run is a few seconds. Scan results are cached for an hour. |
| Web requests | By request count | Tiny. No action needed. |

Run the test sites on localhost first. Use stage only for the final check before a merge.

## Rules

- `package-lock.json` stays committed, so every build installs the same versions.
- Secrets (API keys, service account keys) live only in Netlify environment variables, never in the code.
