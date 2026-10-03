import { Newsreader, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./apps.css";
import Analytics from "./Analytics";
import Consent from "./Consent";
import SiteFooter from "./SiteFooter";
import Ambient from "./Ambient";
import { GTM_ID } from "./lib/site";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "500"], variable: "--font-serif" });
const sans = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata = {
  title: "Megha Karnwal — Web & Data Analyst",
  description: "Web & Data Analyst working across analytics, automation and AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {/* Google Tag Manager (noscript): for browsers with JavaScript off */}
        {GTM_ID && <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} /></noscript>}
        <Ambient />
        {children}
        <SiteFooter />
        <Analytics />
        <Consent />
      </body>
    </html>
  );
}
