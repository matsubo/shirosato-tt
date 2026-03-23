"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EChart, useChartTheme, CATEGORY_COLORS } from "@/components/echart";
import type { EChartsOption } from "@/components/echart";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { lapTimeToMinutes } from "@/lib/time-utils";
import type { CategoryFilter } from "@/components/category-filter";

const CATEGORY_CONFIG: Record<
  string,
  { color: string; firstHalf: [number, number]; secondHalf: [number, number] }
> = {
  "200km": { color: CATEGORY_COLORS["200km"], firstHalf: [1, 17], secondHalf: [18, 35] },
  "100km": { color: CATEGORY_COLORS["100km"], firstHalf: [1, 9], secondHalf: [10, 18] },
  "50km": { color: CATEGORY_COLORS["50km"], firstHalf: [1, 4], secondHalf: [5, 9] },
};

interface PacePoint {
  firstHalf: number;
  secondHalf: number;
  name: string;
  no: number;
  category: string;
}

function calcHalfAvg(
  lapTimes: AthleteResult["lapTimes"],
  range: [number, number]
): number | null {
  const laps = lapTimes.filter((l) => l.lap >= range[0] && l.lap <= range[1]);
  if (laps.length === 0) return null;
  const total = laps.reduce((sum, l) => sum + lapTimeToMinutes(l.time), 0);
  return total / laps.length;
}

interface PaceScatterProps {
  category: CategoryFilter;
}

export function PaceScatter({ category }: PaceScatterProps) {
  const data = results as unknown as AthleteResult[];
  const theme = useChartTheme();

  const categoriesToShow: Array<"200km" | "100km" | "50km"> =
    category === "ALL" ? ["200km", "100km", "50km"] : [category];

  const { scatterData, minVal, maxVal } = useMemo(() => {
    const byCategory: Record<string, PacePoint[]> = {};

    for (const cat of categoriesToShow) {
      const config = CATEGORY_CONFIG[cat];
      const finished = data.filter(
        (r) =>
          r.category === cat &&
          r.status === "finished" &&
          r.lapTimes.length > 0
      );

      const points: PacePoint[] = [];
      for (const r of finished) {
        const fh = calcHalfAvg(r.lapTimes, config.firstHalf);
        const sh = calcHalfAvg(r.lapTimes, config.secondHalf);
        if (fh !== null && sh !== null) {
          points.push({
            firstHalf: parseFloat(fh.toFixed(2)),
            secondHalf: parseFloat(sh.toFixed(2)),
            name: r.name,
            no: r.no,
            category: cat,
          });
        }
      }
      byCategory[cat] = points;
    }

    const allPoints = Object.values(byCategory).flat();
    const allValues = allPoints.flatMap((p) => [p.firstHalf, p.secondHalf]);
    const min = allValues.length > 0 ? Math.floor(Math.min(...allValues) - 0.5) : 5;
    const max = allValues.length > 0 ? Math.ceil(Math.max(...allValues) + 0.5) : 15;

    return { scatterData: byCategory, minVal: min, maxVal: max };
  }, [data, categoriesToShow]);

  const option: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const d = params.data;
          return `<div style="font-weight:600">${d.name} (#${d.no})</div>
                  <div>${d.category}</div>
                  <div>前半平均: ${params.value[0]} 分</div>
                  <div>後半平均: ${params.value[1]} 分</div>`;
        },
      },
      legend: {
        data: categoriesToShow,
        textStyle: { color: theme.subTextColor, fontSize: 12 },
        bottom: 0,
      },
      grid: { top: 10, right: 20, bottom: 40, left: 60 },
      xAxis: {
        type: "value",
        name: "前半平均ラップ (分)",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { color: theme.subTextColor, fontSize: 12 },
        min: minVal,
        max: maxVal,
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      yAxis: {
        type: "value",
        name: "後半平均ラップ (分)",
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: { color: theme.subTextColor, fontSize: 12 },
        min: minVal,
        max: maxVal,
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      series: [
        // Diagonal reference line
        {
          type: "line",
          data: [
            [minVal, minVal],
            [maxVal, maxVal],
          ],
          symbol: "none",
          lineStyle: { color: "#6b7280", type: "dashed", width: 1 },
          silent: true,
          z: 1,
        },
        // Scatter series per category
        ...categoriesToShow.map((cat) => ({
          name: cat,
          type: "scatter" as const,
          data: (scatterData[cat] ?? []).map((p) => ({
            value: [p.firstHalf, p.secondHalf],
            name: p.name,
            no: p.no,
            category: p.category,
          })),
          symbolSize: 8,
          itemStyle: {
            color: CATEGORY_CONFIG[cat].color,
            opacity: 0.7,
          },
          emphasis: {
            itemStyle: { opacity: 1, borderWidth: 2, borderColor: "#fff" },
          },
          z: 2,
        })),
      ],
    }),
    [categoriesToShow, scatterData, minVal, maxVal, theme]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>ペース配分散布図</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">
          対角線より上 = 後半ペースダウン / 対角線より下 = 後半ペースアップ
        </p>
        <EChart option={option} style={{ width: "100%", height: "350px" }} />
      </CardContent>
    </Card>
  );
}
