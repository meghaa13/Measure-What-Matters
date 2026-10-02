import LeadPath from "./LeadPath";
import "../tag-scanner/scanner.css";
import "../tag-scanner/scanner-layout.css";
import "../micro.css";

export const metadata = {
  title: "Lead Path X-Ray — Megha Karnwal",
  description: "Follow one visit from an ad, email, social or partner link through redirects, tags and forms, and see where its source gets lost before the CRM.",
};

export default function LeadPathPage() {
  return <LeadPath />;
}
