// Builds the search tags for a page. The words themselves (titles, descriptions) live in
// config/seo.mjs, and the live address too: edit them there, not here.
import { SITE_URL, SITE, PAGES, POST_OVERRIDES } from "../../config/seo.mjs";

export { SITE_URL, SITE };

// Metadata for a normal page, looked up by its path, e.g. pageMeta("/apps/tag-scanner").
// Gives the page its title and description, a canonical address (so Google knows which URL
// is the real one) and the tags used when the page is shared.
export function pageMeta(path) {
  const entry = PAGES[path];
  if (!entry) throw new Error(`No SEO entry for "${path}". Add it to config/seo.mjs.`);
  const { title, description } = entry;
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE.name, title, description, url },
    twitter: { card: "summary", title, description },
  };
}

// The title and description to use for a blog post: its own, unless config/seo.mjs overrides them.
export function postSeo(post) {
  const o = POST_OVERRIDES[post.slug] || {};
  return { title: o.title || post.title, description: o.description || post.description };
}
