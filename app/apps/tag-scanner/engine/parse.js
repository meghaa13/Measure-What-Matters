// Steps 2–3: fetch each container's configuration from Google and read it as data.
// The container is JavaScript. It is parsed into an AST with acorn and only literal
// values are copied out. It is never eval'd or executed.
import { parseExpressionAt } from "acorn";
import { safeFetch } from "./fetcher";

function toValue(node) {
  switch (node?.type) {
    case "ObjectExpression": {
      const o = {};
      for (const p of node.properties) {
        if (p.type !== "Property" || p.computed) continue;
        const k = p.key.type === "Identifier" ? p.key.name : p.key.value;
        o[k] = toValue(p.value);
      }
      return o;
    }
    case "ArrayExpression": return node.elements.map((e) => (e ? toValue(e) : null));
    case "Literal": return node.value;
    case "TemplateLiteral": return node.expressions.length ? null : node.quasis.map((q) => q.value.cooked).join("");
    case "UnaryExpression":
      if (node.operator === "-") { const v = toValue(node.argument); return typeof v === "number" ? -v : null; }
      if (node.operator === "!") { const v = toValue(node.argument); return typeof v === "number" ? !v : null; }
      return null;
    default: return null; // functions, calls, identifiers: not data, ignored
  }
}

export function extractConfig(js) {
  const i = js.indexOf("var data = {");
  if (i < 0) return null;
  const start = js.indexOf("{", i);
  const node = parseExpressionAt(js, start, { ecmaVersion: "latest" });
  return toValue(node);
}

export async function fetchContainer(id) {
  const path = id.startsWith("GTM-") ? `gtm.js?id=${id}` : `gtag/js?id=${id}`;
  try {
    const r = await safeFetch(`https://www.googletagmanager.com/${path}`, { timeout: 6000, maxBytes: 4_000_000, accept: "application/javascript,*/*" });
    if (r.status === 404) return { id, status: 404 };
    if (r.status !== 200) return { id, status: r.status };
    const data = extractConfig(r.text);
    return { id, status: 200, resource: data?.resource || null, bytes: r.text.length };
  } catch (e) {
    return { id, status: 0, error: e.message };
  }
}

// GTM's internal encoding helpers: ["list", a, b], ["map", k1, v1, k2, v2], ["macro", n].
export const listOf = (x) => (Array.isArray(x) && x[0] === "list" ? x.slice(1) : []);
export const mapOf = (x) => {
  if (!Array.isArray(x) || x[0] !== "map") return {};
  const o = {};
  for (let i = 1; i < x.length; i += 2) o[x[i]] = x[i + 1];
  return o;
};
