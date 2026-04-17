import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/* a11y: Using system fonts as stand-in for GT America (sans) and Tiempos Text (serif).
   IBM Plex Mono for tabular financial data — ensures column alignment and signals precision. */
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Accrue — Accessible Investment Platform",
  description:
    "An accessible mock investment platform designed for blind and low-vision users and novice retail investors.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="bg-surface-base text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
