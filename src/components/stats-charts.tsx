"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EChart, useChartTheme, COLORS, CATEGORY_COLORS } from "@/components/echart";
import type { EChartsOption } from "@/components/echart";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds } from "@/lib/time-utils";
import { calcDeviation } from "@/lib/stats";
import type { CategoryFilter } from "@/components/category-filter";

const GENDER_COLORS = [COLORS.blue, COLORS.pink];

const AGE_DECADE_ORDER = ["10代", "20代", "30代", "40代", "50代", "60代", "70代"];

const AGE_COLORS: Record<string, string> = {
  "10代": COLORS.pink,
  "20代": COLORS.orange,
  "30代": COLORS.yellow,
  "40代": COLORS.green,
  "50代": COLORS.cyan,
  "60代": "#818cf8",
  "70代": COLORS.purple,
};

function extractDecade(ageCategory: string): string {
  const match = ageCategory.match(/^(\d+代)/);
  return match ? match[1] : ageCategory;
}

function filterByCategory(data: AthleteResult[], category: CategoryFilter): AthleteResult[] {
  return data.filter((r) => r.category === category);
}

function GenderRatioChart({ category }: { category: CategoryFilter }) {
  const allData = results as unknown as AthleteResult[];
  const theme = useChartTheme();

  const option: EChartsOption = useMemo(() => {
    const data = filterByCategory(allData, category);
    const male = data.filter((r) => r.gender === "男").length;
    const female = data.filter((r) => r.gender === "女").length;

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) =>
          `${params.name}: ${params.value}人 (${params.percent}%)`,
      },
      series: [
        {
          type: "pie",
          radius: ["35%", "65%"],
          center: ["50%", "50%"],
          // Standard donut (no roseType distortion)
          data: [
            {
              name: "男性",
              value: male,
              itemStyle: { color: GENDER_COLORS[0] },
            },
            {
              name: "女性",
              value: female,
              itemStyle: { color: GENDER_COLORS[1] },
            },
          ],
          label: {
            formatter: "{b}\n{d}%",
            color: theme.textColor,
            fontSize: 12,
          },
          labelLine: { lineStyle: { color: theme.borderColor } },
          itemStyle: {
            borderRadius: 6,
            borderColor: theme.isDark ? "#1e2337" : "#ffffff",
            borderWidth: 2,
          },
          animationType: "scale",
          animationEasing: "elasticOut",
          animationDuration: 800,
        },
      ],
    };
  }, [allData, category, theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>男女比</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "250px" }} />
      </CardContent>
    </Card>
  );
}

function AgeDistributionChart({ category }: { category: CategoryFilter }) {
  const allData = results as unknown as AthleteResult[];
  const theme = useChartTheme();

  const option: EChartsOption = useMemo(() => {
    const data = filterByCategory(allData, category);
    const counts: Record<string, number> = {};
    for (const r of data) {
      if (!r.ageCategory) continue;
      const decade = extractDecade(r.ageCategory);
      counts[decade] = (counts[decade] ?? 0) + 1;
    }
    const chartData = AGE_DECADE_ORDER.filter((d) => counts[d]).map((decade) => ({
      name: decade,
      count: counts[decade] ?? 0,
    }));

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
      },
      grid: { top: 30, right: 10, bottom: 10, left: 40 },
      xAxis: {
        type: "category",
        data: chartData.map((d) => d.name),
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      series: [
        {
          type: "bar",
          data: chartData.map((d) => ({
            value: d.count,
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: AGE_COLORS[d.name] ?? COLORS.purple },
                  { offset: 1, color: (AGE_COLORS[d.name] ?? COLORS.purple) + "66" },
                ],
              },
              borderRadius: [4, 4, 0, 0],
            },
          })),
          label: {
            show: true,
            position: "top",
            fontSize: 11,
            color: theme.subTextColor,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) =>
              params.value > 0 ? String(params.value) : "",
          },
          animationDuration: 600,
        },
      ],
    };
  }, [allData, category, theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>年代別分布</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "250px" }} />
      </CardContent>
    </Card>
  );
}

function PrefectureDistributionChart({ category }: { category: CategoryFilter }) {
  const allData = results as unknown as AthleteResult[];
  const theme = useChartTheme();

  const option: EChartsOption = useMemo(() => {
    const data = filterByCategory(allData, category);
    const counts: Record<string, number> = {};
    for (const r of data) {
      if (!r.prefecture) continue;
      counts[r.prefecture] = (counts[r.prefecture] ?? 0) + 1;
    }
    const chartData = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    // Reverse for horizontal bar (bottom to top)
    const reversed = [...chartData].reverse();

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
      },
      grid: { top: 10, right: 40, bottom: 10, left: 80 },
      xAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      yAxis: {
        type: "category",
        data: reversed.map((d) => d.name),
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      series: [
        {
          type: "bar",
          data: reversed.map((d) => d.count),
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: CATEGORY_COLORS["200km"] + "66" },
                { offset: 1, color: CATEGORY_COLORS["200km"] },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: "right",
            fontSize: 11,
            color: theme.subTextColor,
          },
          animationDuration: 800,
        },
      ],
    };
  }, [allData, category, theme]);

  return (
    <Card className="sm:col-span-2">
      <CardHeader>
        <CardTitle>都道府県別参加者数（上位15）</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "400px" }} />
      </CardContent>
    </Card>
  );
}

function DeviationDistributionChart({ category }: { category: CategoryFilter }) {
  const allData = results as unknown as AthleteResult[];
  const theme = useChartTheme();

  const option: EChartsOption = useMemo(() => {
    const categoriesToProcess: Array<"200km" | "100km" | "50km"> = [category];

    const allDeviations: Array<{ deviation: number; category: string }> = [];

    for (const cat of categoriesToProcess) {
      const finished = allData.filter(
        (r) => r.category === cat && r.status === "finished" && r.totalTime
      );
      const times = finished.map((r) => timeToSeconds(r.totalTime!));
      for (const r of finished) {
        const dev = calcDeviation(timeToSeconds(r.totalTime!), times);
        allDeviations.push({ deviation: dev, category: cat });
      }
    }

    const bins: Array<{ label: string; count: number }> = [];
    for (let d = 20; d < 80; d += 5) {
      const count = allDeviations.filter(
        (v) => v.deviation >= d && v.deviation < d + 5
      ).length;
      bins.push({ label: `${d}-${d + 5}`, count });
    }

    // Calculate normal curve overlay
    const totalCount = allDeviations.length;
    const normalData = bins.map((bin) => {
      const mid = parseInt(bin.label) + 2.5;
      const z = (mid - 50) / 10;
      const pdf = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
      return Math.round(pdf * totalCount * 5 * 10) / 10;
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
      },
      grid: { top: 30, right: 10, bottom: 10, left: 40 },
      xAxis: {
        type: "category",
        data: bins.map((d) => d.label),
        axisLabel: { fontSize: 11, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      series: [
        {
          type: "bar",
          data: bins.map((d) => d.count),
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: COLORS.purple },
                { offset: 1, color: COLORS.purple + "66" },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          label: {
            show: true,
            position: "top",
            fontSize: 11,
            color: theme.subTextColor,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) =>
              params.value > 0 ? String(params.value) : "",
          },
        },
        {
          type: "line",
          data: normalData,
          smooth: true,
          symbol: "none",
          lineStyle: { color: COLORS.pink, width: 2, type: "dashed" },
          z: 10,
        },
      ],
    };
  }, [allData, category, theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>タイム偏差値分布（カテゴリ内）</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">
          完走タイムをカテゴリ内で偏差値化。50が平均、高いほど速い。破線は正規分布。
        </p>
        <EChart option={option} style={{ width: "100%", height: "250px" }} />
      </CardContent>
    </Card>
  );
}

interface StatsChartsProps {
  category: CategoryFilter;
}

export function StatsCharts({ category }: StatsChartsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <GenderRatioChart category={category} />
      <AgeDistributionChart category={category} />
      <PrefectureDistributionChart category={category} />
    </div>
  );
}
