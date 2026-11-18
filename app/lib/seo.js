// One place for the site address and the per-page search tags.
// When a real domain is bought, change SITE_URL here (and the SITE_URL in each blog post-data.js).
export const SITE_URL = "https://measure-what-matter.netlify.app";

// Returns the metadata for a page: its own title and description, a canonical address
// (so Google knows which URL is the real one) and the tags used when the page is shared.
// `path` is the page's path, e.g. "/apps/tag-scanner" ("/" for the home page).
export function pageMeta({ title, description, path }) {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: "Megha Karnwal", title, description, url },
    twitter: { card: "summary", title, description },
  };
}
