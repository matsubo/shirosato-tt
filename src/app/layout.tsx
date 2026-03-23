import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { StructuredData } from "@/components/structured-data";
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
  title: "第11回しろさとTT200 Race Analytics",
  description:
    "第11回しろさとTT200（2026年3月22日・城里テストセンター）の全372選手のレース結果・ラップタイムをBIダッシュボードで徹底分析。200km/100km/50kmカテゴリ別の統計、偏差値、ペーシング、CdA推定など。",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "第11回しろさとTT200 Race Analytics",
    description:
      "第11回しろさとTT200（2026年3月22日・城里テストセンター）の全372選手のレース結果・ラップタイムをBIダッシュボードで徹底分析。200km/100km/50kmカテゴリ別の統計、偏差値、ペーシング、CdA推定など。",
    url: siteUrl,
    siteName: "しろさとTT200 Race Analytics",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "第11回 しろさとTT200 Race Analytics Dashboard",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "第11回しろさとTT200 Race Analytics",
    description:
      "しろさとTT200のレースデータを可視化するBIダッシュボード。ラップタイム分析、チーム比較、走行パフォーマンスを提供します。",
    images: [`${siteUrl}/og-image.png`],
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
      <body className="min-h-full flex flex-col">
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
