import Builder from "./Builder";
import ToolAbout from "../ToolAbout";
import { pageMeta } from "../../lib/seo";
import "./builder.css";

export const metadata = pageMeta("/apps/clean-tracking-plan");

export default function CleanTrackingPlanPage() {
  return (
    <>
      <Builder />
      <ToolAbout
        heading="What the Clean Tracking Plan gives you"
        intro="A tracking plan lists what your website should send to analytics and ad platforms. This builder produces the dataLayer requirements for your type of website, and classifies every field before anything is collected: safe, consent-gated, hash only, or never collect. That way privacy decisions are made in the plan, not after the data has already been sent."
        faqs={[
          { q: "What do the four labels mean?", a: "Safe fields can be collected as normal. Consent-gated fields only after the visitor agrees. Hash-only fields, such as an email or phone number, are sent only in hashed form. Never-collect fields should not be sent at all." },
          { q: "Does it check the data I type in?", a: "It flags common problems. For example, a phone number without a country code is flagged, because the hash will not match the ad platform's records." },
          { q: "Who is it for?", a: "Marketers, analysts and developers who need to agree what the dataLayer should contain before building or auditing a tracking setup." },
        ]}
      />
    </>
  );
}
