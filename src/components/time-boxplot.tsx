"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EChart, useChartTheme, CATEGORY_COLORS } from "@/components/echart";
import type { EChartsOption } from "@/components/echart";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds, secondsToTime } from "@/lib/time-utils";

function calcBoxplot(values: number[]): [number, number, number, number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return [0, 0, 0, 0, 0];

  const q1Idx = Math.floor(n * 0.25);
  const q2Idx = Math.floor(n * 0.5);
  const q3Idx = Math.floor(n * 0.75);

  const q1 = sorted[q1Idx];
  const median = sorted[q2Idx];
  const q3 = sorted[q3Idx];
  const iqr = q3 - q1;

  const lower = Math.max(sorted[0], q1 - 1.5 * iqr);
  const upper = Math.min(sorted[n - 1], q3 + 1.5 * iqr);

  return [lower, q1, median, q3, upper];
}

export function TimeBoxplot() {
  const theme = useChartTheme();

  const option: EChartsOption = useMemo(() => {
    const allData = results as unknown as AthleteResult[];
    const categories: Array<"200km" | "100km" | "50km"> = [
      "200km",
      "100km",
      "50km",
    ];

    const boxData: Array<[number, number, number, number, number]> = [];
    const outlierData: Array<[number, number]> = [];

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const finished = allData.filter(
        (r) => r.category === cat && r.status === "finished" && r.totalTime
      );
      const times = finished.map((r) => timeToSeconds(r.totalTime!) / 60);

      const [lower, q1, median, q3, upper] = calcBoxplot(times);
      boxData.push([lower, q1, median, q3, upper]);

      // Outliers
      for (const t of times) {
        if (t < lower || t > upper) {
          outlierData.push([i, t]);
        }
      }
    }

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (params.componentType === "series") {
            if (Array.isArray(params.value) && params.value.length === 5) {
              const [lower, q1, median, q3, upper] = params.value;
              const fmt = (v: number) => secondsToTime(Math.round(v * 60));
              return `<div style="font-weight:600">${categories[params.dataIndex]}</div>
                      <div>上限: ${fmt(upper)}</div>
                      <div>Q3: ${fmt(q3)}</div>
                      <div>中央値: ${fmt(median)}</div>
                      <div>Q1: ${fmt(q1)}</div>
                      <div>下限: ${fmt(lower)}</div>`;
            }
            const [catIdx, val] = params.value;
            return `${categories[catIdx]}: ${secondsToTime(Math.round(val * 60))}`;
          }
          return "";
        },
      },
      grid: { top: 20, right: 20, bottom: 10, left: 70 },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      yAxis: {
        type: "value",
        name: "タイム (分)",
        nameTextStyle: { color: theme.subTextColor },
        axisLabel: {
          fontSize: 10,
          color: theme.subTextColor,
          formatter: (v: number) => {
            const h = Math.floor(v / 60);
            const m = Math.round(v % 60);
            return `${h}:${String(m).padStart(2, "0")}`;
          },
        },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      series: [
        {
          type: "boxplot",
          data: boxData,
          itemStyle: {
            color: theme.isDark ? "rgba(34, 211, 238, 0.15)" : "rgba(34, 211, 238, 0.1)",
            borderColor: CATEGORY_COLORS["200km"],
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              borderColor: "#fff",
              borderWidth: 2,
            },
          },
          animationDuration: 800,
        },
        {
          name: "外れ値",
          type: "scatter",
          data: outlierData,
          symbolSize: 6,
          itemStyle: { color: "#f87171", opacity: 0.6 },
        },
      ],
    };
  }, [theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>カテゴリ別タイム分布 (箱ひげ図)</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "350px" }} />
      </CardContent>
    </Card>
  );
}
