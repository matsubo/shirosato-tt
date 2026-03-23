"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EChart, useChartTheme, CATEGORY_COLORS } from "@/components/echart";
import type { EChartsOption } from "@/components/echart";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds } from "@/lib/time-utils";
import type { CategoryFilter } from "@/components/category-filter";

const CATEGORY_CONFIG: Record<
  string,
  { color: string; binMinutes: number; startHours: number; endHours: number }
> = {
  "200km": { color: CATEGORY_COLORS["200km"], binMinutes: 15, startHours: 4.5, endHours: 9 },
  "100km": { color: CATEGORY_COLORS["100km"], binMinutes: 10, startHours: 2, endHours: 5 },
  "50km": { color: CATEGORY_COLORS["50km"], binMinutes: 5, startHours: 1, endHours: 3 },
};

function buildBins(category: string, data: AthleteResult[]) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return [];

  const finished = data.filter(
    (r) => r.category === category && r.status === "finished" && r.totalTime
  );
  const times = finished.map((r) => timeToSeconds(r.totalTime!) / 60);

  const bins: Array<{ label: string; count: number }> = [];
  const startMin = config.startHours * 60;
  const endMin = config.endHours * 60;

  for (let m = startMin; m < endMin; m += config.binMinutes) {
    const low = m;
    const high = m + config.binMinutes;
    const count = times.filter((t) => t >= low && t < high).length;
    const lH = Math.floor(low / 60);
    const lM = low % 60;
    const hH = Math.floor(high / 60);
    const hM = high % 60;
    const label = `${lH}:${String(lM).padStart(2, "0")}-${hH}:${String(hM).padStart(2, "0")}`;
    bins.push({ label, count });
  }

  return bins.filter(
    (_, i, arr) =>
      arr.slice(0, i + 1).some((b) => b.count > 0) &&
      arr.slice(i).some((b) => b.count > 0)
  );
}

function CategoryChart({ category }: { category: string }) {
  const data = useMemo(
    () => buildBins(category, results as unknown as AthleteResult[]),
    [category]
  );
  const config = CATEGORY_CONFIG[category];
  const theme = useChartTheme();

  const option: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
      },
      grid: {
        top: 30,
        right: 10,
        bottom: 60,
        left: 40,
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.label),
        axisLabel: {
          fontSize: 11,
          color: theme.subTextColor,
          rotate: 45,
        },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      dataZoom: [
        {
          type: "slider",
          show: data.length > 12,
          bottom: 5,
          height: 18,
          borderColor: theme.borderColor,
          textStyle: { color: theme.subTextColor },
        },
      ],
      series: [
        {
          type: "bar",
          data: data.map((d) => d.count),
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: config.color },
                { offset: 1, color: config.color + "66" },
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
          animationDuration: 600,
          animationEasing: "elasticOut",
        },
      ],
    }),
    [data, config.color, theme]
  );

  return <EChart option={option} style={{ width: "100%", height: "300px" }} />;
}

interface TimeDistributionProps {
  category: CategoryFilter;
}

export function TimeDistribution({ category }: TimeDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>タイム分布</CardTitle>
      </CardHeader>
      <CardContent>
        <CategoryChart category={category} />
      </CardContent>
    </Card>
  );
}
