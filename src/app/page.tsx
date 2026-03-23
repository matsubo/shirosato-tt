"use client";

import { useState } from "react";
import { KpiCards } from "@/components/kpi-cards";
import { TimeDistribution } from "@/components/time-distribution";
import { Top10WithLap } from "@/components/top10-with-lap";
import { StatsCharts } from "@/components/stats-charts";
import { PaceScatter } from "@/components/pace-scatter";
import { StabilityRanking } from "@/components/stability-ranking";
import { AthleteSearch } from "@/components/athlete-search";
import { CategoryFilterBar } from "@/components/category-filter";
import { SpeedGauge } from "@/components/speed-gauge";
import { TimeBoxplot } from "@/components/time-boxplot";
import { LapHeatmap } from "@/components/lap-heatmap";
import { AllLapsChart } from "@/components/all-laps-chart";
import type { CategoryFilter } from "@/components/category-filter";
import race from "@/data/race.json";
import type { RaceMetadata } from "@/lib/types";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold tracking-tight">{children}</h2>
  );
}

export default function Home() {
  const raceData = race as unknown as RaceMetadata;
  const [category, setCategory] = useState<CategoryFilter>("ALL");

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {raceData.raceName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {raceData.date} {raceData.location} / {raceData.weather.condition}{" "}
          {raceData.weather.temperature}&#8451; 湿度{raceData.weather.humidity}%{" "}
          {raceData.weather.wind}
        </p>
      </div>

      {/* Category Filter */}
      <CategoryFilterBar value={category} onChange={setCategory} />

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
          <TimeBoxplot />
        </div>
      </section>

      {/* TOP10 + Lap Chart */}
      <section className="space-y-3">
        <SectionHeader>カテゴリ別 TOP10 &amp; ラップタイム推移</SectionHeader>
        <Top10WithLap category={category} />
      </section>

      {/* All Laps Chart */}
      <section className="space-y-3">
        <SectionHeader>全選手ラップタイム推移</SectionHeader>
        <AllLapsChart category={category} />
      </section>

      {/* Lap Heatmap (only visible when a category is selected) */}
      {category !== "ALL" && (
        <section className="space-y-3">
          <SectionHeader>ラップタイム ヒートマップ</SectionHeader>
          <LapHeatmap category={category} />
        </section>
      )}

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
    </main>
  );
}
