import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "南京慧言能策科技有限公司 — OpenInvest",
  description:
    "Nanjing Huiyan Nengce Technology Co., Ltd. A public Interactive Brokers snapshot. Updated after the US cash close. Not investment advice. 个人盈透账户日终快照，不构成投资建议。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000814",
};

const localeBoot = `(function(){try{var q=new URLSearchParams(location.search).get("lang");var s=localStorage.getItem("openinvest.locale");var zh=q==="zh"||(q!=="en"&&(s==="zh"||(!s&&/^zh/i.test(navigator.language))));var r=document.documentElement;r.lang=zh?"zh-CN":"en";r.dataset.locale=zh?"zh":"en"}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-locale="en"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: localeBoot }} />
        {children}
      </body>
    </html>
  );
}
