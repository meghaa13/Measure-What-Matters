import LeadPath from "./LeadPath";
import ToolAbout from "../ToolAbout";
import { pageMeta } from "../../lib/seo";
import "../tag-scanner/scanner.css";
import "../tag-scanner/scanner-layout.css";
import "../micro.css";

export const metadata = pageMeta("/apps/lead-path");

export default function LeadPathPage() {
  return (
    <>
      <LeadPath />
      <ToolAbout
        heading="What the Lead Path X-Ray checks"
        intro="Leads often arrive without a usable source: the campaign tag disappears in a redirect, or the form does not pass it on. This tool follows one visit from a link you choose (an ad, email, social or partner link) through redirects, tags and forms, and shows where the source gets lost before the lead reaches your CRM."
        faqs={[
          { q: "Does it submit my forms?", a: "No. It uses fake test IDs only, and forms are read, never submitted. Nothing reaches your CRM." },
          { q: "What counts as the source getting lost?", a: "Any point on the path where the campaign information on the link, such as UTM parameters, is dropped or not carried into the form." },
          { q: "Who is it for?", a: "Marketers and analysts who can see leads in their CRM but cannot say which channel, page or campaign produced them." },
        ]}
      />
    </>
  );
}
