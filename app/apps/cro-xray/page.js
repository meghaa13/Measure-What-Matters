import CroXray from "./CroXray";
import "../tag-scanner/scanner.css";
import "../tag-scanner/scanner-layout.css";
import "../micro.css";

export const metadata = {
  title: "CRO X-Ray — Megha Karnwal",
  description: "Up to three conversion problems you can't see from your own desk: promises the next step doesn't keep, forms nobody measures, and phones that wait too long for the button. With the evidence.",
};

export default function CroXrayPage() {
  return <CroXray />;
}
