"use client";

import { useMemo } from "react";
import type { EChartsOption } from "@/components/echart";
import { COLORS, EChart, useChartTheme } from "@/components/echart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcMovingAverage, mean } from "@/lib/stats";
import { secondsToTime, timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult } from "@/lib/types";

interface SingleLapChartProps {
  athlete: AthleteResult;
  categoryAvgLaps?: number[];
}

export function SingleLapChart({ athlete, categoryAvgLaps }: SingleLapChartProps) {
  if (athlete.lapTimes.length === 0) return null;

  const theme = useChartTheme();

  const lapSeconds = athlete.lapTimes.map((l) => timeToSeconds(l.time));
  const avg = mean(lapSeconds);
  const windowSize = Math.max(3, Math.floor(lapSeconds.length / 5));
  const movingAvg = calcMovingAverage(lapSeconds, windowSize);

  const bestIdx = lapSeconds.indexOf(Math.min(...lapSeconds));
  const worstIdx = lapSeconds.indexOf(Math.max(...lapSeconds));

  const option: EChartsOption = useMemo(() => {
    const laps = athlete.lapTimes.map((l) => l.lap);

    const series: EChartsOption["series"] = [
      {
        name: "ラップタイム",
        type: "line",
        data: lapSeconds,
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { width: 2, color: COLORS.cyan },
        itemStyle: { color: COLORS.cyan },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${COLORS.cyan}30` },
              { offset: 1, color: `${COLORS.cyan}05` },
            ],
          },
        },
        markPoint: {
          data: [
            {
              coord: [bestIdx, lapSeconds[bestIdx]],
              name: "Best",
              symbol: "pin",
              symbolSize: 40,
              itemStyle: { color: COLORS.green },
              label: { formatter: "Best", color: "#fff", fontSize: 10 },
            },
            {
              coord: [worstIdx, lapSeconds[worstIdx]],
              name: "Worst",
              symbol: "pin",
              symbolSize: 40,
              itemStyle: { color: COLORS.red },
              label: { formatter: "Worst", color: "#fff", fontSize: 10 },
            },
          ],
        },
        markLine: {
          data: [
            {
              yAxis: avg,
              label: {
                formatter: `Avg ${secondsToTime(Math.round(avg))}`,
                color: theme.subTextColor,
                fontSize: 10,
              },
              lineStyle: {
                color: theme.subTextColor,
                type: "dashed",
              },
            },
          ],
          silent: true,
        },
      },
      {
        name: "移動平均",
        type: "line",
        data: [
          ...Array(Math.floor(windowSize / 2)).fill(null),
          ...movingAvg,
          ...Array(lapSeconds.length - movingAvg.length - Math.floor(windowSize / 2)).fill(null),
        ],
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: COLORS.purple, type: "dashed" },
        itemStyle: { color: COLORS.purple },
        connectNulls: false,
      },
    ];

    if (categoryAvgLaps && categoryAvgLaps.length > 0) {
      series.push({
        name: "カテゴリ平均",
        type: "line",
        data: categoryAvgLaps,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: COLORS.orange, type: "dotted" },
        itemStyle: { color: COLORS.orange },
      });
    }

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const filtered = Array.isArray(params) ? params : [params];
          const lapNum = filtered[0]?.axisValue ?? "";
          let html = `<div style="font-weight:600">Lap ${lapNum}</div>`;
          for (const p of filtered) {
            if (p.value !== null && p.value !== undefined) {
              html += `<div>${p.marker} ${p.seriesName}: ${secondsToTime(Math.round(Number(p.value)))}</div>`;
            }
          }
          return html;
        },
      },
      legend: {
        data: categoryAvgLaps
          ? ["ラップタイム", "移動平均", "カテゴリ平均"]
          : ["ラップタイム", "移動平均"],
        textStyle: { color: theme.subTextColor, fontSize: 11 },
        bottom: 0,
      },
      grid: {
        top: 20,
        right: 20,
        bottom: 35,
        left: 60,
      },
      xAxis: {
        type: "category",
        data: laps,
        name: "Lap",
        nameLocation: "end",
        nameTextStyle: { color: theme.subTextColor, fontSize: 11 },
        axisLabel: { fontSize: 10, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontSize: 10,
          color: theme.subTextColor,
          formatter: (v: number) => secondsToTime(v),
        },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      series,
    };
  }, [
    athlete.lapTimes,
    lapSeconds,
    movingAvg,
    avg,
    bestIdx,
    worstIdx,
    windowSize,
    categoryAvgLaps,
    theme,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ラップタイム推移</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "280px" }} />
      </CardContent>
    </Card>
  );
}
