# SEO Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all SEO issues identified in the audit — canonical URL consistency, JSON-LD deduplication & enrichment, homepage Server Component conversion, twitter:site addition, footer image fixes, and GTM iframe accessibility.

**Architecture:** Direct edits to existing components and config. No new dependencies. Homepage split into Server Component (static HTML) + Client Component (category filter state). Structured data enriched with BreadcrumbList and WebSite schemas.

**Tech Stack:** Next.js 16 (App Router, static export), React 19, TypeScript

---

### Task 1: Fix canonical URL trailing slash consistency

**Files:**
- Modify: `scripts/generate-sitemap.ts:14-15`

The layout.tsx canonical is `https://shirosato-tt-2026.teraren.com` (no slash). The sitemap homepage entry has a trailing slash. Align the sitemap to match.

- [ ] **Step 1: Fix sitemap homepage URL**

In `scripts/generate-sitemap.ts`, change the homepage URL from `${SITE_URL}/` to `${SITE_URL}`:

```typescript
const urls = [
  `  <url>\n    <loc>${SITE_URL}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>1.0</priority>\n  </url>`,
```

- [ ] **Step 2: Rebuild and verify sitemap**

Run: `npm run build`
Then check: `head -5 out/sitemap.xml`
Expected: `<loc>https://shirosato-tt-2026.teraren.com</loc>` (no trailing slash)

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-sitemap.ts
git commit -m "fix: remove trailing slash from sitemap homepage canonical URL"
```

---

### Task 2: Fix JSON-LD duplicate output — move to metadata export

**Files:**
- Modify: `src/app/layout.tsx:22-68,82-93`
- Delete: `src/components/structured-data.tsx`

The `<StructuredData />` component renders JSON-LD in `<body>`, but Next.js also outputs it in `<head>` from metadata, causing duplication. Move structured data into layout metadata and delete the component.

- [ ] **Step 1: Add JSON-LD to layout.tsx metadata and remove StructuredData from body**

In `src/app/layout.tsx`, remove the `StructuredData` import and usage, and add JSON-LD via a `<script>` tag in `<head>`:

```typescript
import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { Footer } from "@/components/footer";
import { GoogleTagManager, GoogleTagManagerNoscript } from "@/components/gtm";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import race from "@/data/race.json";
import results from "@/data/results.json";
import "./globals.css";
```

Remove `<StructuredData />` from the body. Add a `<script>` in `<head>` instead:

```tsx
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
```

- [ ] **Step 2: Delete structured-data.tsx**

```bash
rm src/components/structured-data.tsx
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds. No `StructuredData` references remain.

Run: `grep -r "StructuredData" src/`
Expected: No output

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git rm src/components/structured-data.tsx
git commit -m "fix: deduplicate JSON-LD by moving structured data to layout head"
```

---

### Task 3: Add BreadcrumbList structured data to athlete pages

**Files:**
- Modify: `src/app/athletes/[no]/page.tsx:33-77`

Add BreadcrumbList JSON-LD to each athlete page's metadata for Google breadcrumb display.

- [ ] **Step 1: Add JSON-LD script to athlete page body**

At the top of the return in `AthletePage`, before the `<Link>` back button, add a JSON-LD script for BreadcrumbList. Add this inside the `<main>` tag, before the back link:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ダッシュボード",
          item: "https://shirosato-tt-2026.teraren.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: `${athlete.name} No.${athlete.no}`,
          item: `https://shirosato-tt-2026.teraren.com/athletes/${athlete.no}`,
        },
      ],
    }),
  }}
/>
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds. Athlete pages contain BreadcrumbList JSON-LD.

- [ ] **Step 3: Commit**

```bash
git add src/app/athletes/[no]/page.tsx
git commit -m "feat: add BreadcrumbList structured data to athlete pages"
```

---

### Task 4: Split homepage into Server Component + Client Component

**Files:**
- Modify: `src/app/page.tsx` (rewrite as Server Component)
- Create: `src/components/dashboard-client.tsx` (client-side category state)

The homepage is entirely `"use client"` which means the initial HTML has no content for Googlebot. Split it: the page itself becomes a Server Component (renders static HTML with h1, section headers, etc.), and only the category filter state lives in a client component.

- [ ] **Step 1: Create dashboard-client.tsx**

Create `src/components/dashboard-client.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { AthleteSearch } from "@/components/athlete-search";
import type { CategoryFilter } from "@/components/category-filter";
import { CategoryFilterBar } from "@/components/category-filter";
import { CourseMap } from "@/components/course-map";
import { KpiCards } from "@/components/kpi-cards";
import { LapHeatmap } from "@/components/lap-heatmap";
import { PaceScatter } from "@/components/pace-scatter";
import { RankProgression } from "@/components/rank-progression";
import { SpeedGauge } from "@/components/speed-gauge";
import { StabilityRanking } from "@/components/stability-ranking";
import { StatsCharts } from "@/components/stats-charts";
import { TimeBoxplot } from "@/components/time-boxplot";
import { TimeDistribution } from "@/components/time-distribution";
import { Top10WithLap } from "@/components/top10-with-lap";

const VALID_CATEGORIES: CategoryFilter[] = ["200km", "100km", "50km"];

function readCategoryFromURL(): CategoryFilter {
  if (typeof window === "undefined") return "200km";
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  if (cat && VALID_CATEGORIES.includes(cat as CategoryFilter)) {
    return cat as CategoryFilter;
  }
  return "200km";
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold tracking-tight">{children}</h2>;
}

export function DashboardClient() {
  const [category, setCategory] = useState<CategoryFilter>("200km");

  useEffect(() => {
    setCategory(readCategoryFromURL());
  }, []);

  const handleCategoryChange = (value: CategoryFilter) => {
    setCategory(value);
    const url = new URL(window.location.href);
    url.searchParams.set("category", value);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <>
      {/* Category Filter */}
      <CategoryFilterBar value={category} onChange={handleCategoryChange} />

      {/* KPI Cards + Speed Gauge */}
      <section>
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <KpiCards category={category} />
          <SpeedGauge category={category} />
        </div>
      </section>

      {/* Time Distribution */}
      <section className="space-y-3">
        <SectionHeader>タイム分布</SectionHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          <TimeDistribution category={category} />
          <TimeBoxplot category={category} />
        </div>
      </section>

      {/* TOP10 + Lap Chart */}
      <section className="space-y-3">
        <SectionHeader>TOP10 &amp; ラップタイム推移</SectionHeader>
        <Top10WithLap category={category} />
      </section>

      {/* Rank Progression */}
      <section className="space-y-3">
        <SectionHeader>順位推移</SectionHeader>
        <RankProgression category={category} />
      </section>

      {/* Lap Heatmap */}
      <section className="space-y-3">
        <SectionHeader>ラップタイム ヒートマップ</SectionHeader>
        <LapHeatmap category={category} />
      </section>

      {/* Statistics */}
      <section className="space-y-3">
        <SectionHeader>統計データ</SectionHeader>
        <StatsCharts category={category} />
      </section>

      {/* Pace & Stability */}
      <section className="space-y-3">
        <SectionHeader>ペース分析 &amp; 安定性</SectionHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          <PaceScatter category={category} />
          <StabilityRanking category={category} />
        </div>
      </section>

      {/* Athlete Search */}
      <section className="space-y-3">
        <SectionHeader>選手一覧</SectionHeader>
        <AthleteSearch category={category} />
      </section>

      {/* Course Map */}
      <section className="space-y-3">
        <SectionHeader>コースマップ</SectionHeader>
        <CourseMap />
      </section>
    </>
  );
}
```

- [ ] **Step 2: Rewrite page.tsx as Server Component**

Replace `src/app/page.tsx` entirely:

```tsx
import race from "@/data/race.json";
import type { RaceMetadata } from "@/lib/types";
import { DashboardClient } from "@/components/dashboard-client";

export default function Home() {
  const raceData = race as unknown as RaceMetadata;

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      {/* Header — rendered as static HTML for SEO */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{raceData.raceName}</h1>
        <p className="mt-1 text-muted-foreground">
          {raceData.date} {raceData.location} / {raceData.weather.condition}{" "}
          {raceData.weather.temperature}&#8451; 湿度{raceData.weather.humidity}%{" "}
          {raceData.weather.wind}
        </p>
      </div>

      {/* Interactive dashboard */}
      <DashboardClient />
    </main>
  );
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds. The homepage HTML output (`out/index.html`) should contain the `<h1>` text and race metadata as static HTML.

Run: `grep "第11回" out/index.html | head -1`
Expected: Contains the h1 text in the static HTML.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/dashboard-client.tsx
git commit -m "perf: split homepage into Server + Client components for SEO"
```

---

### Task 5: Add twitter:site to metadata

**Files:**
- Modify: `src/app/layout.tsx:55-68`

Add `twitter:site` and `twitter:creator` to the global Twitter card metadata.

- [ ] **Step 1: Add site/creator to twitter metadata**

In `src/app/layout.tsx`, update the `twitter` section of `metadata`:

```typescript
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
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Run: `grep "twitter:site" out/index.html`
Expected: `<meta name="twitter:site" content="@ittriathlon" />`

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add twitter:site and twitter:creator to metadata"
```

---

### Task 6: Fix footer — localize CC images, add alt text, remove stale eslint comments

**Files:**
- Modify: `src/components/footer.tsx`
- Create: `public/cc.svg`, `public/by.svg`, `public/sa.svg` (download from CC)

External image dependencies are fragile and add latency. Download CC icons to `public/` and add meaningful alt text.

- [ ] **Step 1: Download CC icons**

```bash
curl -sL https://mirrors.creativecommons.org/presskit/icons/cc.svg -o public/cc.svg
curl -sL https://mirrors.creativecommons.org/presskit/icons/by.svg -o public/by.svg
curl -sL https://mirrors.creativecommons.org/presskit/icons/sa.svg -o public/sa.svg
```

- [ ] **Step 2: Update footer.tsx**

Replace the CC image section in `src/components/footer.tsx`:

```tsx
export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
      <div className="mx-auto max-w-7xl space-y-1.5">
        <p>
          Powered by AI TRI+{" "}
          <a
            href="https://x.com/ittriathlon"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            @ittriathlon
          </a>
        </p>
        <p>
          公式サイト:{" "}
          <a
            href="https://shirosato-tt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            shirosato-tt.com
          </a>
        </p>
        <p>
          <a
            href="https://github.com/sponsors/matsubo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            <span className="text-pink-400">&#9829;</span> Sponsor
          </a>
        </p>
        <p className="inline-flex items-center gap-1">
          This work is licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            CC BY-SA 4.0
          </a>
          <img
            src="/cc.svg"
            alt="Creative Commons"
            className="inline-block ml-0.5"
            style={{ maxWidth: "1em", maxHeight: "1em" }}
          />
          <img
            src="/by.svg"
            alt="Attribution"
            className="inline-block ml-0.5"
            style={{ maxWidth: "1em", maxHeight: "1em" }}
          />
          <img
            src="/sa.svg"
            alt="Share Alike"
            className="inline-block ml-0.5"
            style={{ maxWidth: "1em", maxHeight: "1em" }}
          />
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds. No eslint-disable comments remain.

Run: `grep "eslint-disable" src/components/footer.tsx`
Expected: No output.

- [ ] **Step 4: Commit**

```bash
git add public/cc.svg public/by.svg public/sa.svg src/components/footer.tsx
git commit -m "fix: localize CC icons, add alt text, remove stale eslint comments"
```

---

### Task 7: Add title to GTM noscript iframe

**Files:**
- Modify: `src/components/gtm.tsx:27-32`

The GTM noscript iframe is missing a `title` attribute (accessibility + Biome warning).

- [ ] **Step 1: Add title attribute**

In `src/components/gtm.tsx`, add a `title` attribute to the iframe:

```tsx
export function GoogleTagManagerNoscript() {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        title="Google Tag Manager"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
```

- [ ] **Step 2: Verify Biome warning resolved**

Run: `npx biome check src/components/gtm.tsx`
Expected: No `useIframeTitle` warning.

- [ ] **Step 3: Commit**

```bash
git add src/components/gtm.tsx
git commit -m "fix: add title attribute to GTM noscript iframe for accessibility"
```

---

### Task 8: Add button type to category filter

**Files:**
- Modify: `src/components/category-filter.tsx:23`

Missing `type="button"` on category filter buttons (Biome a11y warning).

- [ ] **Step 1: Add type attribute**

In `src/components/category-filter.tsx`, add `type="button"` to the button element:

```tsx
            <button
              type="button"
              key={opt.value}
              onClick={() => onChange(opt.value)}
```

- [ ] **Step 2: Verify Biome warning resolved**

Run: `npx biome check src/components/category-filter.tsx`
Expected: No `useButtonType` warning.

- [ ] **Step 3: Commit**

```bash
git add src/components/category-filter.tsx
git commit -m "fix: add type=button to category filter for accessibility"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 3: Run Biome**

Run: `npx biome check .`
Expected: No errors (warnings are acceptable).

- [ ] **Step 4: Verify static HTML contains SEO content**

Run: `grep "<h1" out/index.html`
Expected: Contains `<h1>` with race name in static HTML.

Run: `grep "application/ld+json" out/index.html`
Expected: Contains JSON-LD script (exactly once).

Run: `grep "twitter:site" out/index.html`
Expected: Contains `@ittriathlon`.
