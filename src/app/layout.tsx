import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { Footer } from "@/components/footer";
import { GoogleTagManager, GoogleTagManagerNoscript } from "@/components/gtm";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import race from "@/data/race.json";
import results from "@/data/results.json";
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
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
        url: `${siteUrl}/og-image-v2.png`,
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
    site: "@ittriathlon",
    creator: "@ittriathlon",
    title: "第11回しろさとTT200 TT Analytics",
    description:
      "第11回しろさとTT200の全372選手のリザルト・ラップタイムをBIダッシュボードで徹底分析。",
    images: [
      {
        url: `${siteUrl}/og-image-v2.png`,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "SportsEvent",
                name: race.raceName,
                startDate: race.date,
                endDate: race.date,
                url: siteUrl,
                eventStatus: "https://schema.org/EventCompletedStatusType",
                location: {
                  "@type": "Place",
                  name: race.location,
                  address: {
                    "@type": "PostalAddress",
                    addressRegion: "茨城県",
                    addressCountry: "JP",
                  },
                },
                numberOfParticipants: results.length,
                sport: "Cycling Time Trial",
                description:
                  "第11回しろさとTT200（自転車タイムトライアル）の全選手リザルト・ラップタイムをBIダッシュボードで徹底分析。",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "しろさとTT200 TT Analytics",
                url: siteUrl,
              },
            ]),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleTagManagerNoscript />
        <ThemeProvider>
          <Nav />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
