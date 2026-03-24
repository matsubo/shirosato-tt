import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { StructuredData } from "@/components/structured-data";
import { GoogleTagManager, GoogleTagManagerNoscript } from "@/components/gtm";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-jp",
  subsets: ["latin"],
});

const siteUrl = "https://shirosato-tt-2026.teraren.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "第11回しろさとTT200 TT Analytics",
  description:
    "第11回しろさとTT200（2026年3月22日・城里テストセンター）の全372選手のレース結果・ラップタイムをBIダッシュボードで徹底分析。200km/100km/50kmカテゴリ別の統計、偏差値、ペーシング、CdA推定など。",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "第11回しろさとTT200 TT Analytics",
    description:
      "第11回しろさとTT200（2026年3月22日・城里テストセンター）の全372選手のレース結果・ラップタイムをBIダッシュボードで徹底分析。200km/100km/50kmカテゴリ別の統計、偏差値、ペーシング、CdA推定など。",
    url: siteUrl,
    siteName: "しろさとTT200 TT Analytics",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "第11回 しろさとTT200 TT Analytics Dashboard",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "第11回しろさとTT200 TT Analytics",
    description:
      "第11回しろさとTT200の全372選手のリザルト・ラップタイムをBIダッシュボードで徹底分析。",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "第11回 しろさとTT200 TT Analytics Dashboard",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <head>
        <GoogleTagManager />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleTagManagerNoscript />
        <StructuredData />
        <ThemeProvider>
          <Nav />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
