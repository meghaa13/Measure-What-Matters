// ONE place for every redirect on the site. Do not put redirects in netlify.toml,
// a _redirects file, or page code: add them here and next.config.mjs picks them up.
//
// Each entry: { source: "/old-path", destination: "/new-path", permanent: true }
//   permanent: true  -> 308 (tells Google the page moved for good; passes ranking to the new address)
//   permanent: false -> 307 (temporary; use for short-lived moves)
//
// Rules of thumb:
// - Redirect straight to the final address (no chains: /a -> /b -> /c).
// - When a post or page is renamed or removed, add its old path here first.
// - Query strings (like ?utm_source=...) are kept by default; do not strip them.
//
// There are no redirects yet. Example, for when a post slug changes:
//   { source: "/blog/old-slug", destination: "/blog/new-slug", permanent: true },

export const redirects = [];
