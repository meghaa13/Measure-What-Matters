import CroXray from "./CroXray";
import "../tag-scanner/scanner.css";
import "../tag-scanner/scanner-layout.css";
import "../micro.css";
import "./cro.css";

export const metadata = {
  title: "CRO X-Ray — Megha Karnwal",
  description: "Paste a page and see what a first-time visitor meets: headline, calls to action, forms, trust, speed and accessibility, turned into test ideas.",
};

export default function CroXrayPage() {
  return <CroXray />;
}
