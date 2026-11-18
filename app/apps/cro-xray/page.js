import CroXray from "./CroXray";
import ToolAbout from "../ToolAbout";
import { pageMeta } from "../../lib/seo";
import "../tag-scanner/scanner.css";
import "../tag-scanner/scanner-layout.css";
import "../micro.css";

export const metadata = pageMeta("/apps/cro-xray");

export default function CroXrayPage() {
  return (
    <>
      <CroXray />
      <ToolAbout
        heading="What the CRO X-Ray looks for"
        intro="CRO X-Ray reads a public page from the outside and reports up to three conversion problems, each with its evidence. It looks for three kinds of problem that are hard to see from your own desk: promises that the next step does not keep, forms that nobody measures, and phones that wait too long for the button."
        faqs={[
          { q: "Where do the speed results come from?", a: "From Google PageSpeed Insights." },
          { q: "Does it use my analytics data?", a: "No. It reads public pages only, so it is not a substitute for your own data. Treat the findings as test ideas to check against your numbers." },
        ]}
        related={[{ href: "/blog/google-ads-review-summaries-test", label: "Google writes review claims into your ads. Test them." }]}
      />
    </>
  );
}
