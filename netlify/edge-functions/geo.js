// Tags each page view with the visitor's country (from Netlify's IP geolocation)
// in a short-lived cookie, so the consent banner can show for EEA/UK/CH visitors
// even when their device time zone says otherwise (VPNs, travellers).
// Only the two-letter country code is stored; no IP address.
export default async (req, context) => {
  const res = await context.next();
  const cc = (context.geo?.country?.code || "").toUpperCase();
  const current = /(?:^|;\s*)mk_cc=([A-Z]{0,2})/.exec(req.headers.get("cookie") || "")?.[1];
  if (cc && cc !== current) res.headers.append("set-cookie", `mk_cc=${cc}; Path=/; Max-Age=86400; SameSite=Lax; Secure`);
  return res;
};

export const config = {
  path: "/*",
  excludedPath: ["/_next/*", "/api/*", "/uploads/*", "/downloads/*", "/favicon.ico", "/robots.txt", "/sitemap.xml", "/__forms.html"],
};
