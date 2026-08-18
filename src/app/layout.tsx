import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const num = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-num",
});

export const metadata: Metadata = {
  title: "OpenInvest — Public book / 公开投资账户",
  description:
    "A public Interactive Brokers snapshot. Updated after the US cash close. Not investment advice. 个人盈透账户日终快照，不构成投资建议。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${num.variable}`}>
      <body className={sans.className}>{children}</body>
    </html>
  );
}
