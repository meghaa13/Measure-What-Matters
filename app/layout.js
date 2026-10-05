import localFont from "next/font/local";
import "./globals.css";
import "./apps.css";
import Analytics from "./Analytics";
import Consent from "./Consent";
import SiteFooter from "./SiteFooter";
import Ambient from "./Ambient";
import { GTM_ID } from "./lib/site";

// Fonts are files in app/fonts, not fetched from Google while building. A build can no
// longer fail because Google Fonts was unreachable or answered differently.
const serif = localFont({
  src: [
    { path: "./fonts/Newsreader.woff2", weight: "400 500", style: "normal" },
    { path: "./fonts/Newsreader-Italic.woff2", weight: "400 500", style: "italic" },
  ],
  variable: "--font-serif", display: "swap", fallback: ["Georgia", "serif"],
});
const sans = localFont({ src: "./fonts/HankenGrotesk.woff2", weight: "400 600", variable: "--font-sans", display: "swap", fallback: ["system-ui", "sans-serif"] });
const mono = localFont({ src: "./fonts/JetBrainsMono.woff2", weight: "400 500", variable: "--font-mono", display: "swap", fallback: ["ui-monospace", "monospace"] });

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
