// Turns the crawler check into plain-English verdicts, per AI assistant.
export const ASSISTANTS = [
  { key: "chatgpt", name: "ChatGPT search", search: "OAI-SearchBot", user: "ChatGPT-User" },
  { key: "claude", name: "Claude", search: "Claude-SearchBot", user: "Claude-User" },
  { key: "perplexity", name: "Perplexity", search: "PerplexityBot", user: "Perplexity-User" },
  { key: "google", name: "Google AI Overviews", search: "Googlebot", snippets: true },
  { key: "copilot", name: "Microsoft Copilot", search: "Bingbot" },
  { key: "siri", name: "Siri & Apple", search: "Applebot" },
];

// status: "visible" | "blocked" | "no_quote" | "verify"
export function verdicts(data) {
  const bot = (t) => data.bots.find((b) => b.token === t);
  const snippetBlocked = data.checks.some((c) => c.id === "AG4" && c.status === "fail");
  const cloudflare = data.cdn === "Cloudflare";
  const broken = data.robotsState === "unreachable" || data.robotsState === "error";
  const list = ASSISTANTS.map((a) => {
    const s = bot(a.search), u = a.user ? bot(a.user) : null;
    let status, why;
    if (broken) { status = "blocked"; why = "robots.txt is erroring, so crawlers back off the whole site."; }
    else if (!s?.allowed) { status = "blocked"; why = `${a.search} is blocked${s?.rule ? ` (${s.rule})` : ""}, so it can't add your pages to its index.`; }
    else if (a.snippets && snippetBlocked) { status = "no_quote"; why = "It can crawl you, but nosnippet / noindex stops it quoting you in AI answers."; }
    else if (cloudflare && a.key !== "google" && a.key !== "copilot") { status = "verify"; why = "Allowed in robots.txt, but Cloudflare may block AI crawlers at the network level."; }
    else { status = "visible"; why = u && !u.allowed ? `Indexed, but ${a.user} is blocked, so it can't open your page when someone asks about it.` : "Allowed to find and read your pages."; }
    return { ...a, status, why };
  });
  const visible = list.filter((x) => x.status === "visible").length;
  const training = data.bots.filter((b) => b.purpose === "training");
  const trainAllowed = training.filter((b) => b.allowed).length;

  let headline;
  if (broken) headline = "AI assistants are being turned away: robots.txt isn't working.";
  else if (visible === list.length) headline = cloudflare ? `All ${list.length} AI assistants are allowed, if Cloudflare isn't blocking them.` : `All ${list.length} AI assistants can find and quote you.`;
  else if (visible === 0) headline = "None of the major AI assistants can find and quote you.";
  else headline = `${visible} of ${list.length} AI assistants can find and quote you.`;

  const blocked = list.filter((x) => x.status === "blocked" || x.status === "no_quote").map((x) => x.name);
  const cost = blocked.length
    ? `When someone asks ${blocked.slice(0, 3).join(", ")}${blocked.length > 3 ? " and others" : ""} for what you offer, your pages can't be read, so they can't be recommended or linked.`
    : cloudflare ? "Check the Cloudflare setting below: it can silently override everything here." : "Your pages can be read, so whether you're recommended now depends on content and authority, not access.";
  return { list, visible, headline, cost, trainAllowed, trainTotal: training.length, cloudflare };
}
