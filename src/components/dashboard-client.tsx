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
