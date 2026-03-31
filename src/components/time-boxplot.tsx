"use client";

import { useMemo } from "react";
import type { CategoryFilter } from "@/components/category-filter";
import type { EChartsOption } from "@/components/echart";
import { EChart, useChartTheme } from "@/components/echart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import results from "@/data/results.json";
import { secondsToTime, timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult } from "@/lib/types";

const AGE_DECADES = ["10代", "20代", "30代", "40代", "50代", "60代"];

function extractDecade(ageCategory: string): string {
  const match = ageCategory.match(/^(\d+代)/);
  return match ? match[1] : "";
}

function calcBoxplot(values: number[]): [number, number, number, number, number] | null {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n < 3) return null;

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

interface TimeBoxplotProps {
  category: CategoryFilter;
}

export function TimeBoxplot({ category }: TimeBoxplotProps) {
  const theme = useChartTheme();

  const option: EChartsOption = useMemo(() => {
    const allData = results as unknown as AthleteResult[];
    const catData = allData.filter(
      (r) =>
        r.category === category &&
        (r.status === "finished" || r.status === "OPEN") &&
        r.totalTime &&
        r.ageCategory,
    );

    const MALE_COLOR = "#22d3ee";
    const FEMALE_COLOR = "#f472b6";

    // Build boxplot data per age decade, split by gender
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maleBoxData: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const femaleBoxData: any[] = [];
    const maleOutliers: Array<[number, number]> = [];
    const femaleOutliers: Array<[number, number]> = [];

    for (let i = 0; i < AGE_DECADES.length; i++) {
      const decade = AGE_DECADES[i];

      // Male
      const males = catData.filter(
        (r) => r.gender === "男" && extractDecade(r.ageCategory) === decade,
      );
      const maleTimes = males.map((r) => timeToSeconds(r.totalTime!) / 60);
      const maleBox = calcBoxplot(maleTimes);
      maleBoxData.push(maleBox ?? "-");

      if (maleBox) {
        for (const t of maleTimes) {
          if (t < maleBox[0] || t > maleBox[4]) {
            maleOutliers.push([i, t]);
          }
        }
      }

      // Female
      const females = catData.filter(
        (r) => r.gender === "女" && extractDecade(r.ageCategory) === decade,
      );
      const femaleTimes = females.map((r) => timeToSeconds(r.totalTime!) / 60);
      const femaleBox = calcBoxplot(femaleTimes);
      femaleBoxData.push(femaleBox ?? "-");

      if (femaleBox) {
        for (const t of femaleTimes) {
          if (t < femaleBox[0] || t > femaleBox[4]) {
            femaleOutliers.push([i, t]);
          }
        }
      }
    }

    const fmt = (v: number) => secondsToTime(Math.round(v * 60));

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (params.componentType === "series") {
            if (
              params.seriesType === "boxplot" &&
              Array.isArray(params.value) &&
              params.value.length === 5
            ) {
              const [lower, q1, median, q3, upper] = params.value;
              const gender = params.seriesName;
              return `<div style="font-weight:600">${AGE_DECADES[params.dataIndex]} ${gender}</div>
                      <div>上限: ${fmt(upper)}</div>
                      <div>Q3: ${fmt(q3)}</div>
                      <div>中央値: ${fmt(median)}</div>
                      <div>Q1: ${fmt(q1)}</div>
                      <div>下限: ${fmt(lower)}</div>`;
            }
            if (params.seriesType === "scatter") {
              const [idx, val] = params.value;
              return `${AGE_DECADES[idx]}: ${fmt(val)}`;
            }
          }
          return "";
        },
      },
      legend: {
        data: ["男性", "女性"],
        bottom: 0,
        textStyle: { color: theme.subTextColor, fontSize: 11 },
      },
      grid: { top: 20, right: 20, bottom: 40, left: 70 },
      xAxis: {
        type: "category",
        data: AGE_DECADES,
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      yAxis: {
        type: "value",
        name: "タイム",
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
          name: "男性",
          type: "boxplot",
          data: maleBoxData,
          itemStyle: {
            color: theme.isDark ? `${MALE_COLOR}22` : `${MALE_COLOR}15`,
            borderColor: MALE_COLOR,
            borderWidth: 2,
          },
        },
        {
          name: "女性",
          type: "boxplot",
          data: femaleBoxData,
          itemStyle: {
            color: theme.isDark ? `${FEMALE_COLOR}22` : `${FEMALE_COLOR}15`,
            borderColor: FEMALE_COLOR,
            borderWidth: 2,
          },
        },
        {
          name: "男性 外れ値",
          type: "scatter",
          data: maleOutliers,
          symbolSize: 5,
          itemStyle: { color: MALE_COLOR, opacity: 0.5 },
        },
        {
          name: "女性 外れ値",
          type: "scatter",
          data: femaleOutliers,
          symbolSize: 5,
          itemStyle: { color: FEMALE_COLOR, opacity: 0.5 },
        },
      ],
    };
  }, [category, theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>年代×性別 タイム分布（箱ひげ図）</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">
          年代ごとの完走タイム分布を男女別に表示。箱は25-75パーセンタイル、中央線は中央値。
        </p>
        <EChart option={option} style={{ width: "100%", height: "380px" }} />
      </CardContent>
    </Card>
  );
}
