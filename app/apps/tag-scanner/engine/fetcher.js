// Server-side fetch for user-supplied URLs.
// The scanner fetches whatever URL a visitor types, so every request (and every
// redirect hop) is checked against private/internal addresses first (SSRF guard),
// bodies are size-capped and every request has a timeout.
import dns from "node:dns/promises";
import net from "node:net";

const UA = "Mozilla/5.0 (compatible; TagHealthScan/1.0; +https://meghakarnwal.com/apps/tag-scanner)";

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

async function assertPublic(hostname) {
  if (!hostname || /^(localhost|.*\.local|.*\.internal)$/i.test(hostname)) throw new Error("blocked_host");
  const addrs = net.isIP(hostname) ? [{ address: hostname }] : await dns.lookup(hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("blocked_host");
}

export async function safeFetch(rawUrl, { timeout = 6000, maxBytes = 3_000_000, redirects = 4, accept = "text/html,*/*" } = {}) {
  let url = new URL(rawUrl);
  for (let hop = 0; hop <= redirects; hop++) {
    if (!/^https?:$/.test(url.protocol)) throw new Error("bad_protocol");
    await assertPublic(url.hostname);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    // The timeout covers the headers and the body read.
    try {
      const res = await fetch(url, { redirect: "manual", signal: ctrl.signal, headers: { "user-agent": UA, accept, "accept-language": "en" } });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = new URL(res.headers.get("location"), url);
        continue;
      }
      // Read at most maxBytes.
      const reader = res.body?.getReader();
      const chunks = []; let size = 0;
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > maxBytes) { await reader.cancel(); break; }
          chunks.push(value);
        }
      }
      const text = new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
      return { status: res.status, url: url.toString(), text, headers: res.headers };
    } finally { clearTimeout(timer); }
  }
  throw new Error("too_many_redirects");
}
