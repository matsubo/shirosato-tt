"use client";

import { useMemo } from "react";
import type { CategoryFilter } from "@/components/category-filter";
import { EChart } from "@/components/echart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import results from "@/data/results.json";
import { timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult } from "@/lib/types";

const CATEGORY_META: Record<string, { color: string; laps: number }> = {
  "200km": { color: "#22d3ee", laps: 35 },
  "100km": { color: "#4ade80", laps: 18 },
  "50km": { color: "#fb923c", laps: 9 },
};

interface AllLapsChartProps {
  category: CategoryFilter;
}

export function AllLapsChart({ category }: AllLapsChartProps) {
  const allData = results as unknown as AthleteResult[];

  const option = useMemo(() => {
    const meta = CATEGORY_META[category];
    if (!meta) return null;

    const finished = allData.filter(
      (r) =>
        r.category === category &&
        (r.status === "finished" || r.status === "OPEN") &&
        r.lapTimes &&
        r.lapTimes.length >= meta.laps,
    );

    // Sort by total time for visual layering (slowest first = drawn first)
    const sorted = [...finished].sort((a, b) => {
      const ta = a.totalTime ? timeToSeconds(a.totalTime) : Infinity;
      const tb = b.totalTime ? timeToSeconds(b.totalTime) : Infinity;
      return tb - ta;
    });

    // Compute average lap per lap number
    const avgLaps: number[] = [];
    for (let i = 0; i < meta.laps; i++) {
      const times = sorted
        .map((r) => (r.lapTimes[i] ? timeToSeconds(r.lapTimes[i].time) / 60 : null))
        .filter((v): v is number => v !== null);
      avgLaps.push(times.reduce((a, b) => a + b, 0) / times.length);
    }

    const series = sorted.map((r, idx) => {
      const lapMins = r.lapTimes
        .slice(0, meta.laps)
        .map((l: { time: string }) => Math.round((timeToSeconds(l.time) / 60) * 100) / 100);

      const totalRiders = sorted.length;
      // Color: top riders are more opaque, slower riders more transparent
      const rank = idx; // 0 = slowest (drawn first)
      const normalizedPos = rank / totalRiders;
      const opacity = 0.05 + normalizedPos * 0.3;

      return {
        name: r.name,
        type: "line" as const,
        data: lapMins,
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: normalizedPos > 0.95 ? 2.5 : 1,
          color: meta.color,
          opacity,
        },
        emphasis: {
          lineStyle: { width: 3, opacity: 1 },
        },
        z: rank,
      };
    });

    // Add average line
    series.push({
      name: "平均",
      type: "line" as const,
      data: avgLaps.map((v) => Math.round(v * 100) / 100),
      smooth: true,
      symbol: "none",
      lineStyle: {
        width: 3,
        color: "#fff",
        opacity: 0.9,
        // @ts-expect-error ECharts type accepts this
        type: "dashed",
      },
      emphasis: {
        lineStyle: { width: 4, opacity: 1 },
      },
      z: sorted.length + 1,
    });

    // Top 3 highlighted
    const top3 = sorted.slice(-3).reverse();
    top3.forEach((r, i) => {
      const lapMins = r.lapTimes
        .slice(0, meta.laps)
        .map((l: { time: string }) => Math.round((timeToSeconds(l.time) / 60) * 100) / 100);
      const colors = ["#fbbf24", "#94a3b8", "#f97316"];
      series.push({
        name: `${i + 1}位 ${r.name}`,
        type: "line" as const,
        data: lapMins,
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 2.5,
          color: colors[i],
          opacity: 1,
        },
        emphasis: {
          lineStyle: { width: 4, opacity: 1 },
        },
        z: sorted.length + 2 + i,
      });
    });

    return {
      tooltip: {
        trigger: "axis" as const,
        confine: true,
      },
      legend: {
        show: true,
        data: ["平均", ...top3.map((r, i) => `${i + 1}位 ${r.name}`)],
        bottom: 0,
        textStyle: { fontSize: 11 },
      },
      grid: {
        left: 50,
        right: 20,
        top: 20,
        bottom: 60,
      },
      xAxis: {
        type: "category" as const,
        data: Array.from({ length: meta.laps }, (_, i) => `${i + 1}`),
        name: "Lap",
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: "value" as const,
        name: "分",
        axisLabel: { fontSize: 10 },
      },
      dataZoom:
        meta.laps > 15
          ? [{ type: "inside" as const }, { type: "slider" as const, height: 20, bottom: 35 }]
          : [{ type: "inside" as const }],
      series,
    };
  }, [category]);

  if (!option) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>全選手ラップタイム推移</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">
          各選手のラップ推移を重ね表示。上位選手ほど濃く、白破線は全体平均。TOP3をハイライト。
        </p>
        <EChart option={option} style={{ width: "100%", height: "450px" }} />
      </CardContent>
    </Card>
  );
}
