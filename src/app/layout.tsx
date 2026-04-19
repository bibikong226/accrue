import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import "@/components/trade/trade-slideover.css";
import { TradeProvider } from "@/components/trade/TradeContext";

/* § 11.2 Typography — Inter for UI, JetBrains Mono for financial numbers,
   Source Serif 4 for long-form reading (copilot responses, research explainers) */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Accrue — Accessible Investment Platform",
  description:
    "An accessibility-first mock investment platform for blind and low-vision users and novice retail investors. HCI thesis prototype.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${jetbrainsMono.variable} ${sourceSerif.variable}`}
    >
      <body className="min-h-screen bg-surface-canvas text-primary antialiased">
        {/* a11y: Global live regions for screen reader announcements.
            Mounted once at root, used by announce() utility throughout the app. */}
        <div
          id="announcer-polite"
          /* a11y: role="status" + aria-live="polite" for non-urgent updates
             (tab changes, sort changes, range selections, timer milestones) */
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        <div
          id="announcer-assertive"
          /* a11y: role="alert" + aria-live="assertive" for critical updates
             (trade confirmations, errors, login failures) */
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        />

        <TradeProvider>{children}</TradeProvider>
      </body>
    </html>
  );
}
