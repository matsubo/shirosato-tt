import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-jp",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "第11回しろさとTT200 Race Analytics",
  description:
    "しろさとTT200のレースデータを可視化するBIダッシュボード。ラップタイム分析、チーム比較、走行パフォーマンスを提供します。",
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
        <ThemeProvider>
          <Nav />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
