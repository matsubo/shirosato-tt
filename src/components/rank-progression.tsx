"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EChart } from "@/components/echart";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds } from "@/lib/time-utils";
import type { CategoryFilter } from "@/components/category-filter";

const CATEGORY_META: Record<string, { color: string; laps: number }> = {
  "200km": { color: "#22d3ee", laps: 35 },
  "100km": { color: "#4ade80", laps: 18 },
  "50km": { color: "#fb923c", laps: 9 },
};

interface RankProgressionProps {
  category: CategoryFilter;
}

export function RankProgression({ category }: RankProgressionProps) {
  const allData = results as unknown as AthleteResult[];

  const option = useMemo(() => {
    if (category === "ALL") return null;

    const meta = CATEGORY_META[category];
    if (!meta) return null;

    // Get finished athletes with lap data
    const finished = allData.filter(
      (r) =>
        r.category === category &&
        (r.status === "finished" || r.status === "OPEN") &&
        r.lapTimes &&
        r.lapTimes.length >= meta.laps
    );

    if (finished.length === 0) return null;

    const totalRiders = finished.length;

    // For each lap, compute cumulative time and rank
    // cumulativeTimes[athleteIdx][lapIdx] = total seconds up to that lap
    const cumulativeTimes = finished.map((r) => {
      const cumulative: number[] = [];
      let total = 0;
      for (let i = 0; i < meta.laps; i++) {
        total += r.lapTimes[i] ? timeToSeconds(r.lapTimes[i].time) : 0;
        cumulative.push(total);
      }
      return cumulative;
    });

    // For each lap, determine rank of each athlete
    // ranks[athleteIdx][lapIdx] = rank (1-based)
    const ranks: number[][] = finished.map(() =>
      new Array(meta.laps).fill(0)
    );

    for (let lap = 0; lap < meta.laps; lap++) {
      // Create array of [athleteIdx, cumulativeTime]
      const indexed = finished.map((_, idx) => ({
        idx,
        time: cumulativeTimes[idx][lap],
      }));
      indexed.sort((a, b) => a.time - b.time);
      indexed.forEach((item, rank) => {
        ranks[item.idx][lap] = rank + 1;
      });
    }

    // Sort athletes by final rank
    const finalRankOrder = finished
      .map((r, idx) => ({ idx, finalRank: ranks[idx][meta.laps - 1], name: r.name }))
      .sort((a, b) => a.finalRank - b.finalRank);

    // Show only every 10th rider + TOP3 for readability
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series: any[] = [];

    finalRankOrder.forEach(({ idx, finalRank, name }) => {
      const isTop3 = finalRank <= 3;
      const isEvery10 = finalRank % 10 === 0;
      const isLast = finalRank === totalRiders;

      if (!isTop3 && !isEvery10 && !isLast) return;

      let lineColor = meta.color;
      let lineWidth = 1.5;
      let opacity = 0.4;
      let showSymbol = false;

      if (isTop3) {
        const colors = ["#fbbf24", "#94a3b8", "#f97316"];
        lineColor = colors[finalRank - 1];
        lineWidth = 3;
        opacity = 1;
        showSymbol = true;
      } else if (isLast) {
        lineColor = "#ef4444";
        lineWidth = 2;
        opacity = 0.7;
      }

      const label = isTop3
        ? `${finalRank}位 ${name}`
        : isLast
          ? `${finalRank}位 (最下位)`
          : `${finalRank}位`;

      series.push({
        name: label,
        type: "line" as const,
        data: ranks[idx],
        smooth: 0.3,
        symbol: showSymbol ? "circle" : "none",
        symbolSize: showSymbol ? 4 : 0,
        lineStyle: {
          width: lineWidth,
          color: lineColor,
          opacity,
        },
        emphasis: {
          lineStyle: { width: 3, opacity: 1 },
          label: {
            show: true,
            formatter: () => `${finalRank}位 ${name}`,
            fontSize: 11,
          },
        },
        z: isTop3 ? 100 - finalRank : 50 - finalRank,
      });
    });

    return {
      tooltip: {
        trigger: "axis" as const,
        confine: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (!Array.isArray(params)) return "";
          const lap = params[0]?.dataIndex + 1;
          const sorted = [...params].sort(
            (a: { data: number }, b: { data: number }) => a.data - b.data
          );
          const top5 = sorted.slice(0, 5);
          const lines = top5.map(
            (p: { data: number; seriesName: string }) =>
              `${p.data}位 ${p.seriesName}`
          );
          return `<strong>Lap ${lap}</strong><br/>${lines.join("<br/>")}`;
        },
      },
      legend: {
        show: true,
        data: series.map((s) => s.name),
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
        name: "順位",
        inverse: true,
        min: 1,
        max: totalRiders,
        axisLabel: { fontSize: 10 },
      },
      dataZoom:
        meta.laps > 15
          ? [
              { type: "inside" as const },
              { type: "slider" as const, height: 20, bottom: 35 },
            ]
          : [{ type: "inside" as const }],
      series,
    };
  }, [allData, category]);

  if (category === "ALL") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>順位推移</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            カテゴリを選択すると、各ラップ時点での順位推移が表示されます。
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!option) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          順位推移
          <span
            className="ml-2 text-sm font-normal"
            style={{ color: CATEGORY_META[category]?.color }}
          >
            {category}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">
          各ラップ時点での累積タイムによる順位推移。TOP3をハイライト。ホバーで詳細表示。
        </p>
        <EChart option={option} style={{ width: "100%", height: "500px" }} />
      </CardContent>
    </Card>
  );
}
