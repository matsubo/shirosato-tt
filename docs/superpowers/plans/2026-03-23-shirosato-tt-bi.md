# しろさとTT200 BI Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a BI dashboard web service analyzing the 11th Shirosato TT200 cycling time trial results, with macro (race-wide) and micro (per-athlete) analysis, CdA estimation, and AI-generated comments.

**Architecture:** Next.js 15 App Router with SSG (`output: 'export'`). Race data parsed from PDFs into JSON at dev time, embedded in source. All statistics computed client-side. Dark/light theme toggle. Deployed as static site on Coolify.

**Tech Stack:** Next.js 15, TypeScript, shadcn/ui, Tailwind CSS v4, Recharts, next-themes, pdf-parse, Dockerfile + nginx

**Spec:** `docs/superpowers/specs/2026-03-23-shirosato-tt-bi-design.md`

---

## File Structure

```
shirosato-tt/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── Dockerfile
├── .dockerignore
├── scripts/
│   └── parse-pdf.ts              # PDF → JSON converter
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (fonts, theme provider, nav)
│   │   ├── page.tsx              # Top page: macro dashboard
│   │   ├── globals.css           # Tailwind imports + custom styles
│   │   └── athletes/
│   │       └── [no]/
│   │           └── page.tsx      # Athlete detail: micro analysis
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (card, table, badge, etc.)
│   │   ├── theme-provider.tsx    # next-themes provider
│   │   ├── theme-toggle.tsx      # Dark/light toggle button
│   │   ├── nav.tsx               # Site navigation header
│   │   ├── kpi-cards.tsx         # KPI summary cards
│   │   ├── time-distribution.tsx # Histogram per category
│   │   ├── top10-table.tsx       # TOP10 table with sortable columns
│   │   ├── lap-chart.tsx         # Lap time progression line chart
│   │   ├── stats-charts.tsx      # Age/prefecture/gender distribution charts
│   │   ├── pace-scatter.tsx      # First half vs second half scatter plot
│   │   ├── stability-ranking.tsx # CV-based stability ranking
│   │   ├── athlete-search.tsx    # Search/filter athlete list
│   │   ├── athlete-profile.tsx   # Athlete profile card
│   │   ├── radar-chart.tsx       # Deviation value radar chart
│   │   ├── pacing-analysis.tsx   # Pacing breakdown
│   │   ├── lap-stability.tsx     # Lap stability analysis
│   │   ├── percentile-bar.tsx    # Percentile display
│   │   ├── cda-calculator.tsx    # CdA estimation tool
│   │   └── ai-comment.tsx        # AI comment display
│   ├── lib/
│   │   ├── stats.ts              # Statistical calculations (deviation, CV, percentile)
│   │   ├── cda.ts                # CdA calculation logic
│   │   ├── time-utils.ts         # Time string parsing/formatting
│   │   └── types.ts              # TypeScript type definitions
│   └── data/
│       ├── race.json             # Race metadata + weather
│       ├── results.json          # All athlete results
│       ├── laptimes.json         # All athlete lap times
│       └── comments.json         # AI-generated comments per athlete
├── public/
│   └── og-image.png              # OGP image
└── tests/
    ├── lib/
    │   ├── stats.test.ts
    │   ├── cda.test.ts
    │   └── time-utils.test.ts
    └── components/
        └── cda-calculator.test.tsx
```

---

## Phase 1: Project Setup & Data Pipeline

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Create Next.js project with TypeScript and Tailwind**

```bash
cd /home/matsu/ghq/github.com/matsubo/shirosato-tt
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Configure static export in next.config.ts**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- [ ] **Step 3: Install dependencies**

```bash
npm install recharts next-themes
npm install -D @types/node pdf-parse tsx vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 4: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add card badge table tabs input select separator tooltip
```

- [ ] **Step 5: Verify build works**

```bash
npm run build
```

Expected: Build succeeds, `out/` directory created.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with shadcn/ui, Recharts, next-themes"
```

---

### Task 2: Core Types & Utility Functions

**Files:**
- Create: `src/lib/types.ts`, `src/lib/time-utils.ts`, `src/lib/stats.ts`, `src/lib/cda.ts`
- Create: `tests/lib/time-utils.test.ts`, `tests/lib/stats.test.ts`, `tests/lib/cda.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to package.json scripts: `"test": "vitest run", "test:watch": "vitest"`

- [ ] **Step 2: Create type definitions**

```typescript
// src/lib/types.ts
export interface RaceMetadata {
  name: string;
  date: string;
  venue: string;
  courseLengthKm: number;
  courseLengthLabel: string;
  categories: Category[];
  weather: Weather;
}

export interface Category {
  name: string;
  laps: number;
  timeLimit: string;
  distance: number;
}

export interface Weather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  airDensity: number;
  source: string;
  note: string;
}

export type RankValue = number | "OPEN" | "DNF" | "DNS";

export interface AthleteResult {
  rank: RankValue;
  no: number;
  name: string;
  age: number;
  gender: "男" | "女";
  prefecture: string;
  totalTime: string | null;
  penalty: number | null;
  maleRank: number | null;
  femaleRank: number | null;
  ageCategory: string;
  categoryRank: number | null;
  avgSpeed: number | null;
  category: "200km" | "100km" | "50km";
  status: "finished" | "OPEN" | "DNF" | "DNS";
}

export interface AthleteLaptime {
  no: number;
  name: string;
  laps: number;
  totalTime: string;
  penalty: number;
  finalTime: string;
  lapTimes: string[];
  category: "200km" | "100km" | "50km";
}

export interface AthleteComments {
  [no: string]: string;
}

export interface DeviationValues {
  totalTime: number;
  lapStability: number;
  secondHalfRetention: number;
  bestLap: number;
  avgSpeed: number;
}
```

- [ ] **Step 3: Write time-utils tests**

```typescript
// tests/lib/time-utils.test.ts
import { describe, it, expect } from "vitest";
import { timeToSeconds, secondsToTime, formatTime } from "@/lib/time-utils";

describe("timeToSeconds", () => {
  it("converts H:MM:SS to seconds", () => {
    expect(timeToSeconds("4:39:27")).toBe(16767);
  });
  it("converts M:SS to seconds", () => {
    expect(timeToSeconds("8:16")).toBe(496);
  });
  it("converts 0:MM:SS to seconds", () => {
    expect(timeToSeconds("0:08:16")).toBe(496);
  });
});

describe("secondsToTime", () => {
  it("converts seconds to H:MM:SS", () => {
    expect(secondsToTime(16767)).toBe("4:39:27");
  });
});

describe("formatTime", () => {
  it("formats lap time string for display", () => {
    expect(formatTime("0:08:16")).toBe("8:16");
  });
});
```

- [ ] **Step 4: Run tests — verify they fail**

```bash
npx vitest run tests/lib/time-utils.test.ts
```

Expected: FAIL

- [ ] **Step 5: Implement time-utils**

```typescript
// src/lib/time-utils.ts
export function timeToSeconds(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export function secondsToTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatTime(time: string): string {
  const parts = time.split(":");
  if (parts.length === 3 && parts[0] === "0") {
    return `${parseInt(parts[1])}:${parts[2]}`;
  }
  return time;
}

export function lapTimeToMinutes(time: string): number {
  return timeToSeconds(time) / 60;
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npx vitest run tests/lib/time-utils.test.ts
```

Expected: PASS

- [ ] **Step 7: Write stats tests**

```typescript
// tests/lib/stats.test.ts
import { describe, it, expect } from "vitest";
import { calcDeviation, calcCV, calcPercentile, calcMovingAverage } from "@/lib/stats";

describe("calcDeviation", () => {
  it("returns 50 for the mean value (time-based, inverted)", () => {
    const values = [100, 200, 300, 400, 500];
    expect(calcDeviation(300, values)).toBeCloseTo(50);
  });
  it("returns > 50 for faster-than-average time", () => {
    const values = [100, 200, 300, 400, 500];
    expect(calcDeviation(100, values)).toBeGreaterThan(50);
  });
});

describe("calcCV", () => {
  it("calculates coefficient of variation", () => {
    const values = [10, 10, 10, 10];
    expect(calcCV(values)).toBe(0);
  });
  it("returns positive CV for varying data", () => {
    const values = [8, 9, 10, 11, 12];
    expect(calcCV(values)).toBeGreaterThan(0);
  });
});

describe("calcPercentile", () => {
  it("returns 0 for the best (rank 1 of 100)", () => {
    expect(calcPercentile(1, 100)).toBeCloseTo(1);
  });
  it("returns 50 for median", () => {
    expect(calcPercentile(50, 100)).toBeCloseTo(50);
  });
});

describe("calcMovingAverage", () => {
  it("calculates moving average with window 3", () => {
    const values = [10, 20, 30, 40, 50];
    const result = calcMovingAverage(values, 3);
    expect(result[1]).toBeCloseTo(20);
    expect(result[2]).toBeCloseTo(30);
  });
});
```

- [ ] **Step 8: Implement stats**

```typescript
// src/lib/stats.ts
export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values: number[]): number {
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function calcDeviation(value: number, allValues: number[]): number {
  const m = mean(allValues);
  const sd = stddev(allValues);
  if (sd === 0) return 50;
  return 50 - (10 * (value - m)) / sd;
}

export function calcCV(values: number[]): number {
  const m = mean(values);
  if (m === 0) return 0;
  return (stddev(values) / m) * 100;
}

export function calcPercentile(rank: number, total: number): number {
  return (rank / total) * 100;
}

export function calcMovingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    const half = Math.floor(window / 2);
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    const slice = values.slice(start, end);
    return slice.length > 0 ? mean(slice) : null;
  });
}
```

- [ ] **Step 9: Write CdA tests**

```typescript
// tests/lib/cda.test.ts
import { describe, it, expect } from "vitest";
import { calcCdA } from "@/lib/cda";

describe("calcCdA", () => {
  it("calculates CdA for given power, weight, speed, air density", () => {
    const result = calcCdA({
      powerWatts: 200,
      weightKg: 70,
      speedMs: 11.11,
      airDensity: 1.2407,
      crr: 0.004,
      drivetrainEfficiency: 0.97,
    });
    expect(result).toBeGreaterThan(0.1);
    expect(result).toBeLessThan(0.5);
  });

  it("returns higher CdA for lower speed at same power", () => {
    const params = { powerWatts: 200, weightKg: 70, airDensity: 1.2407, crr: 0.004, drivetrainEfficiency: 0.97 };
    const fast = calcCdA({ ...params, speedMs: 12 });
    const slow = calcCdA({ ...params, speedMs: 10 });
    expect(slow).toBeGreaterThan(fast);
  });
});
```

- [ ] **Step 10: Implement CdA**

```typescript
// src/lib/cda.ts
export interface CdAParams {
  powerWatts: number;
  weightKg: number;
  speedMs: number;
  airDensity: number;
  crr: number;
  drivetrainEfficiency: number;
}

export function calcCdA(params: CdAParams): number {
  const { powerWatts, weightKg, speedMs, airDensity, crr, drivetrainEfficiency } = params;
  const g = 9.81;
  const pEffective = powerWatts * drivetrainEfficiency;
  const pRoll = crr * weightKg * g * speedMs;
  const pAero = pEffective - pRoll;
  if (pAero <= 0 || speedMs <= 0) return 0;
  return (2 * pAero) / (airDensity * speedMs ** 3);
}

export function calcCdAFromLapTime(params: {
  powerWatts: number;
  weightKg: number;
  lapTimeSeconds: number;
  courseLengthKm: number;
  airDensity: number;
}): number {
  const speedMs = (params.courseLengthKm * 1000) / params.lapTimeSeconds;
  return calcCdA({
    powerWatts: params.powerWatts,
    weightKg: params.weightKg,
    speedMs,
    airDensity: params.airDensity,
    crr: 0.004,
    drivetrainEfficiency: 0.97,
  });
}
```

- [ ] **Step 11: Run all tests**

```bash
npx vitest run
```

Expected: All PASS

- [ ] **Step 12: Commit**

```bash
git add src/lib/ tests/ vitest.config.ts
git commit -m "feat: add core types and utility functions (time, stats, CdA)"
```

---

### Task 3: Parse PDFs → Generate JSON Data

**Files:**
- Create: `scripts/parse-pdf.ts`
- Create: `src/data/race.json`, `src/data/results.json`, `src/data/laptimes.json`, `src/data/comments.json`

- [ ] **Step 1: Create PDF parse script**

```typescript
// scripts/parse-pdf.ts
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

const DATA_DIR = path.join(__dirname, "../src/data");

async function fetchPdf(url: string): Promise<Buffer> {
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

function parseResultLine(line: string, category: string): object | null {
  // Parse each line from the results PDF table
  // Fields: 総合順位, No., 氏名, 年齢, 性別, 都道府県, 総合記録, P分, 男子順位, 女子順位, 年齢区分, 区分順位, 平均速度
  const parts = line.trim().split(/\s+/);
  if (parts.length < 8) return null;
  // Implementation will handle OPEN/DNF/DNS status and varying field counts
  return null; // Placeholder - actual implementation parses regex
}

async function parseResults() {
  console.log("Downloading results PDF...");
  const buffer = await fetchPdf("https://shirosato-tt.com/result/result_shiroatott202603.pdf");
  const data = await pdfParse(buffer);
  const text = data.text;

  console.log("Raw text length:", text.length);
  // Save raw text for debugging
  fs.writeFileSync(path.join(DATA_DIR, "raw-results.txt"), text);

  // Parse logic: split by category headers, then parse each line
  // Each category section starts with "第11回 しろさとTT200 大会結果【200km部門..."
  console.log("Parse results manually from raw text or use CSV fallback");
}

async function parseLaptimes() {
  console.log("Downloading laptimes PDF...");
  const buffer = await fetchPdf("https://shirosato-tt.com/result/result_shiroatott202603_laptime.pdf");
  const data = await pdfParse(buffer);
  const text = data.text;

  fs.writeFileSync(path.join(DATA_DIR, "raw-laptimes.txt"), text);
  console.log("Raw laptimes text length:", text.length);
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  await parseResults();
  await parseLaptimes();
  console.log("Done. Check raw text files and refine parsing.");
}

main().catch(console.error);
```

- [ ] **Step 2: Run the script to get raw PDF text**

```bash
npx tsx scripts/parse-pdf.ts
```

Inspect `src/data/raw-results.txt` and `src/data/raw-laptimes.txt` to understand the text format. If pdf-parse output is too messy for reliable parsing, fall back to manual CSV → JSON approach.

- [ ] **Step 3: Refine parsing or create CSV fallback**

If PDF parsing is unreliable, create CSVs manually from the PDF data and convert:

```bash
# If needed, create scripts/csv-to-json.ts that reads CSV files and outputs JSON
```

- [ ] **Step 4: Create race.json metadata**

```json
{
  "name": "第11回しろさとTT200",
  "date": "2026-03-22",
  "venue": "城里テストセンター",
  "courseLengthKm": 5.6663,
  "courseLengthLabel": "約5.7km",
  "categories": [
    { "name": "200km", "laps": 35, "timeLimit": "8:00:00", "distance": 198.32 },
    { "name": "100km", "laps": 18, "timeLimit": "4:00:00", "distance": 101.99 },
    { "name": "50km", "laps": 9, "timeLimit": "2:00:00", "distance": 51.0 }
  ],
  "weather": {
    "temperature": 13.0,
    "humidity": 50,
    "windSpeed": 5.0,
    "pressure": 1022.0,
    "airDensity": 1.2407,
    "source": "気象庁 (笠間アメダス)",
    "note": "rho = P / (R_specific * T) に湿度補正を適用"
  }
}
```

- [ ] **Step 5: Validate generated JSON data**

- Check all athlete `no` fields exist in both results.json and laptimes.json
- Check lap count matches category (200km=35, 100km=18, 50km=9)
- Check DNF athletes have fewer laps than category requirement

- [ ] **Step 6: Create placeholder comments.json**

```json
{}
```

Will be populated with AI-generated comments in a later task.

- [ ] **Step 7: Commit**

```bash
git add scripts/ src/data/
git commit -m "feat: add PDF parse script and race data JSONs"
```

---

## Phase 2: UI Framework & Theme

### Task 4: Layout, Theme, and Navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`, `src/components/nav.tsx`

- [ ] **Step 1: Create theme provider**

```typescript
// src/components/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 2: Create theme toggle**

```typescript
// src/components/theme-toggle.tsx
"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

- [ ] **Step 3: Create navigation**

```typescript
// src/components/nav.tsx
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">しろさとTT200</span>
          <span className="text-muted-foreground text-sm">Race Analytics</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Update root layout with fonts, theme provider, nav**

Set up layout.tsx with Noto Sans JP + Inter via next/font, wrap in ThemeProvider, add Nav.

- [ ] **Step 5: Add dark theme CSS variables to globals.css**

Customize shadcn dark theme colors to match @kokikr's style: deep navy background, cyan/green/orange accents.

- [ ] **Step 6: Verify theme toggle works**

```bash
npm run dev
```

Open browser, verify dark/light toggle works.

- [ ] **Step 7: Commit**

```bash
git add src/app/ src/components/
git commit -m "feat: add layout with dark/light theme toggle and navigation"
```

---

## Phase 3: Macro Dashboard (Top Page)

### Task 5: KPI Cards

**Files:**
- Create: `src/components/kpi-cards.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement KPI cards component**

Display: 参加者数, 完走者数, 完走率, 最速タイム (per category), 平均タイム, DNF数.
Compute all values from results.json at render time.
Style: colored accent borders per category (cyan/green/orange).

- [ ] **Step 2: Add to top page**

- [ ] **Step 3: Verify in browser**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add KPI summary cards to dashboard"
```

### Task 6: Category Time Distribution Histogram

**Files:**
- Create: `src/components/time-distribution.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement histogram component**

Use Recharts BarChart. Bin finish times into intervals (e.g., 15-min bins for 200km, 10-min for 100km/50km). Color per category: cyan/green/orange. Show count labels on bars.

- [ ] **Step 2: Add to top page**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add category time distribution histograms"
```

### Task 7: TOP10 Table + TOP3 Lap Chart

**Files:**
- Create: `src/components/top10-table.tsx`
- Create: `src/components/lap-chart.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement TOP10 table**

Tabs for 200km/100km/50km. Columns: 順位, No., 氏名, タイム, 平均速度, 偏差値. Rows link to athlete detail page.

- [ ] **Step 2: Implement TOP3 lap progression chart**

Recharts LineChart: X=lap number, Y=lap time (minutes). 3 colored lines for TOP3 riders. Tooltip with rider name and exact time.

- [ ] **Step 3: Add both to top page with tab sync**

When user selects category tab in TOP10, the lap chart shows the same category's TOP3.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add TOP10 table and TOP3 lap progression charts"
```

### Task 8: Statistics Charts (Age, Prefecture, Gender, Deviation Distribution)

**Files:**
- Create: `src/components/stats-charts.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement age distribution bar chart**

BarChart: X=age group (10代〜60代), Y=count. Stacked or grouped by category.

- [ ] **Step 2: Implement prefecture distribution bar chart**

Horizontal BarChart: top 15 prefectures by participant count.

- [ ] **Step 3: Implement gender ratio donut chart**

PieChart showing male/female ratio with counts.

- [ ] **Step 4: Implement deviation value distribution histogram**

BarChart showing distribution of finish time deviation values (hensachi). Bell curve overlay.

- [ ] **Step 5: Add all to dashboard**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add demographic and deviation statistics charts"
```

### Task 9: Pace Scatter Plot + Stability Ranking

**Files:**
- Create: `src/components/pace-scatter.tsx`
- Create: `src/components/stability-ranking.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement pace scatter plot**

ScatterChart: X=first-half avg lap, Y=second-half avg lap. Diagonal line for even split. Points above = positive split (slowed down), below = negative split. Color by category.

- [ ] **Step 2: Implement stability ranking**

Table: TOP10 most stable riders (lowest CV). Columns: 順位, No., 氏名, CV(%), カテゴリ.

- [ ] **Step 3: Add to dashboard**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add pace scatter plot and stability ranking"
```

### Task 10: Athlete Search & List

**Files:**
- Create: `src/components/athlete-search.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement searchable athlete list**

Client-side search/filter by No., name, category. Displays results in a compact table. Each row links to `/athletes/[no]`. Show rank, name, category, time.

- [ ] **Step 2: Add to bottom of dashboard**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add athlete search and list"
```

---

## Phase 4: Micro Analysis (Athlete Detail Page)

### Task 11: Athlete Detail Page - Profile & Lap Chart

**Files:**
- Create: `src/app/athletes/[no]/page.tsx`
- Create: `src/components/athlete-profile.tsx`

- [ ] **Step 1: Create athlete detail page with generateStaticParams**

```typescript
// src/app/athletes/[no]/page.tsx
import results from "@/data/results.json";

export function generateStaticParams() {
  return results.map((r) => ({ no: String(r.no) }));
}
```

- [ ] **Step 2: Implement athlete profile card**

Display: No., name, age, gender, prefecture, category, ranks, total time, avg speed. Show DNF/DNS badges as appropriate.

- [ ] **Step 3: Add lap time progression chart**

Reuse `lap-chart.tsx` in single-rider mode. Add moving average overlay (window: 5 for 200km, 3 for 100km/50km). Highlight best/worst laps.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add athlete detail page with profile and lap chart"
```

### Task 12: Radar Chart & Pacing Analysis

**Files:**
- Create: `src/components/radar-chart.tsx`
- Create: `src/components/pacing-analysis.tsx`

- [ ] **Step 1: Implement deviation radar chart**

Recharts RadarChart with 5 axes: totalTime, lapStability, secondHalfRetention, bestLap, avgSpeed. All computed as deviation values within the athlete's category.

- [ ] **Step 2: Implement pacing analysis**

Show: first-half avg vs second-half avg bar comparison, negative/positive split badge, decline rate %, best/worst lap with lap numbers.

- [ ] **Step 3: Add to athlete page**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add deviation radar chart and pacing analysis"
```

### Task 13: Lap Stability, Percentile, AI Comment

**Files:**
- Create: `src/components/lap-stability.tsx`
- Create: `src/components/percentile-bar.tsx`
- Create: `src/components/ai-comment.tsx`

- [ ] **Step 1: Implement lap stability visualization**

Show stddev, CV. Bar chart of each lap's deviation from mean (green for faster, red for slower).

- [ ] **Step 2: Implement percentile display**

Progress bars showing: "カテゴリ内 上位 X%", "年齢区分内 上位 X%".

- [ ] **Step 3: Implement AI comment display**

Card with AI icon and pre-generated comment text from comments.json.

- [ ] **Step 4: Add all to athlete page**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add lap stability, percentile, and AI comment to athlete page"
```

### Task 14: CdA Estimation Tool

**Files:**
- Create: `src/components/cda-calculator.tsx`

- [ ] **Step 1: Implement CdA calculator component**

Input fields: power (W), weight (kg). Read from URL params on mount (`?power=X&weight=Y`). On input change, update URL params (for sharing). Display: estimated avg CdA, per-lap CdA bar chart (color gradient green→red), environmental conditions summary. Show limitations note.

- [ ] **Step 2: Add to athlete page (only for finished athletes)**

- [ ] **Step 3: Verify URL sharing works**

Navigate to `/athletes/2?power=200&weight=70`, verify values are pre-filled and CdA is calculated.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add CdA estimation tool with URL sharing"
```

---

## Phase 5: AI Comments & Polish

### Task 15: Generate AI Comments

**Files:**
- Modify: `src/data/comments.json`

- [ ] **Step 1: Generate AI comments for all finished athletes**

Using Claude, generate analytical comments for each athlete based on their data. Focus on: pacing strategy evaluation, strengths, weaknesses, improvement suggestions. Write to `src/data/comments.json`.

- [ ] **Step 2: Verify comments display correctly on athlete pages**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add AI-generated athlete analysis comments"
```

### Task 16: OGP & Meta Tags

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/athletes/[no]/page.tsx`

- [ ] **Step 1: Add metadata to root layout**

Set default og:title, og:description, og:image.

- [ ] **Step 2: Add per-page metadata**

Top page: race overview metadata. Athlete page: athlete name + result in title/description.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add OGP and meta tags"
```

---

## Phase 6: Deploy

### Task 17: Dockerfile & Coolify Deploy

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: Create nginx.conf**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/index.html =404;
    }

    error_page 404 /404.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

- [ ] **Step 3: Create .dockerignore**

```
node_modules
.next
.git
*.png
docs/
```

- [ ] **Step 4: Test Docker build locally**

```bash
docker build -t shirosato-tt .
docker run -p 3000:80 shirosato-tt
```

Verify site works at http://localhost:3000

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore nginx.conf
git commit -m "feat: add Dockerfile and nginx config for Coolify deploy"
```

- [ ] **Step 6: Push to GitHub**

```bash
git remote add origin git@github.com:matsubo/shirosato-tt.git
git push -u origin main
```

- [ ] **Step 7: Deploy to Coolify**

Use Coolify MCP tools to create application, configure Docker build, and deploy.

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Project setup, core libs, data pipeline |
| 2 | 4 | Theme, layout, navigation |
| 3 | 5-10 | Macro dashboard (top page) |
| 4 | 11-14 | Micro analysis (athlete page) |
| 5 | 15-16 | AI comments, OGP |
| 6 | 17 | Docker + Coolify deploy |
