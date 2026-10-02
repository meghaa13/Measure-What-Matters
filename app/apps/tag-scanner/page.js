import Scanner from "./Scanner";
import "./scanner.css";
import "./scanner-layout.css";

export const metadata = {
  title: "Tag Health Scan — Megha Karnwal",
  description: "Scan a website's Google tag and GTM setup. See what's tracked, what's broken and what's risky, with a confidence label on every finding.",
};

export default function TagScannerPage() {
  return <Scanner />;
}
