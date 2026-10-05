// Step 6: plain-English summary written only from the findings.
// Uses Claude only when AI is switched on on purpose (AI_FEATURES=on) and a key exists;
// otherwise a deterministic template. The explicit switch matters on Netlify: its AI
// Gateway supplies a key automatically and bills every call in credits, so the presence
// of a key alone must never turn paid AI calls on.
import Anthropic from "@anthropic-ai/sdk";

export function templateSummary({ host, snapshot, findings, score }) {
  if (!findings.length) return `${host} looks configured cleanly from the outside: none of the checks in this scan flagged an issue. That's a good sign, but the outside view can't see how data is used inside GA4, so a short audit is still the way to confirm it.`;
  const conf = findings.filter((f) => f.conf === "Confirmed").length;
  const top = findings[0];
  return `${host} scored ${score}/100. The scan found ${findings.length} issue${findings.length > 1 ? "s" : ""} in the tag configuration, ${conf} of them confirmed directly from the setup. The most important: ${top.title.replace(/`/g, "")}. ${snapshot.consent === "None detected" ? "No consent banner was detected on the page. " : ""}Items marked Verify need a look inside GA4 and GTM to confirm.`;
}

export async function aiSummary(ctx) {
  if (process.env.AI_FEATURES !== "on" || !process.env.ANTHROPIC_API_KEY || !ctx.findings.length) return null;
  const client = new Anthropic({ timeout: 9000, maxRetries: 0 });
  const facts = {
    site: ctx.host, score: ctx.score, snapshot: ctx.snapshot,
    findings: ctx.findings.map((f) => ({ title: f.title.replace(/`/g, ""), severity: f.sev, confidence: f.conf, detail: f.detail.replace(/`/g, "") })),
  };
  try {
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: "You summarise automated tag-configuration scan results for a website owner who is not an analytics specialist. Write 3 or 4 plain sentences, no headings or lists. Use only the facts in the JSON you are given; do not add causes, numbers, tools or recommendations that are not in it. Describe what the site is configured to do (\"is configured to…\"), never claim the data is wrong. Treat findings with confidence \"Verify\" as open questions, not conclusions. Mention the single most important finding first.",
      messages: [{ role: "user", content: JSON.stringify(facts) }],
    });
    if (res.stop_reason === "refusal") return null;
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return text || null;
  } catch (e) {
    if (e instanceof Anthropic.APIError) console.warn("[tag-scan] summary API error", e.status);
    else console.warn("[tag-scan] summary failed", e.message);
    return null;
  }
}
