"use client";

import { useMemo } from "react";
import type { EChartsOption } from "@/components/echart";
import { COLORS, EChart, useChartTheme } from "@/components/echart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mean } from "@/lib/stats";
import { formatTime, secondsToTime, timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult } from "@/lib/types";

interface PacingAnalysisProps {
  athlete: AthleteResult;
}

function getHalfSplit(
  category: string,
  totalLaps: number,
): { firstEnd: number; secondStart: number } {
  switch (category) {
    case "200km":
      return { firstEnd: 17, secondStart: 18 };
    case "100km":
      return { firstEnd: 9, secondStart: 10 };
    case "50km":
      return { firstEnd: 4, secondStart: 5 };
    default: {
      const half = Math.floor(totalLaps / 2);
      return { firstEnd: half, secondStart: half + 1 };
    }
  }
}

export function PacingAnalysis({ athlete }: PacingAnalysisProps) {
  if (athlete.lapTimes.length < 2) return null;

  const theme = useChartTheme();

  const lapSeconds = athlete.lapTimes.map((l) => timeToSeconds(l.time));
  const { firstEnd, secondStart } = getHalfSplit(athlete.category, athlete.lapTimes.length);

  const firstHalfLaps = lapSeconds.slice(0, firstEnd);
  const secondHalfLaps = lapSeconds.slice(secondStart - 1);

  const firstAvg = mean(firstHalfLaps);
  const secondAvg = mean(secondHalfLaps);
  const declineRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  const isNegativeSplit = secondAvg <= firstAvg;

  const bestLapIdx = lapSeconds.indexOf(Math.min(...lapSeconds));
  const worstLapIdx = lapSeconds.indexOf(Math.max(...lapSeconds));

  const option: EChartsOption = useMemo(() => {
    const names = [
      `前半 (Lap 1-${firstEnd})`,
      `後半 (Lap ${secondStart}-${athlete.lapTimes.length})`,
    ];

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `<div style="font-weight:600">${p.axisValue}</div>
                  <div>平均ラップ: ${secondsToTime(Math.round(Number(p.value)))}</div>`;
        },
      },
      grid: { top: 10, right: 30, bottom: 10, left: 140 },
      xAxis: {
        type: "value",
        axisLabel: {
          fontSize: 11,
          color: theme.subTextColor,
          formatter: (v: number) => secondsToTime(v),
        },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      yAxis: {
        type: "category",
        data: names,
        axisLabel: { fontSize: 11, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      series: [
        {
          type: "bar",
          data: [
            {
              value: firstAvg,
              itemStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 0,
                  colorStops: [
                    { offset: 0, color: `${COLORS.cyan}88` },
                    { offset: 1, color: COLORS.cyan },
                  ],
                },
                borderRadius: [0, 4, 4, 0],
              },
            },
            {
              value: secondAvg,
              itemStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 0,
                  colorStops: [
                    { offset: 0, color: `${isNegativeSplit ? COLORS.green : COLORS.red}88` },
                    { offset: 1, color: isNegativeSplit ? COLORS.green : COLORS.red },
                  ],
                },
                borderRadius: [0, 4, 4, 0],
              },
            },
          ],
          barWidth: "50%",
          animationDuration: 600,
        },
      ],
    };
  }, [firstAvg, secondAvg, firstEnd, secondStart, athlete.lapTimes.length, isNegativeSplit, theme]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ペーシング分析</CardTitle>
          {isNegativeSplit ? (
            <Badge className="border border-green-500/30 bg-green-500/20 text-green-400">
              ネガティブスプリット
            </Badge>
          ) : (
            <Badge className="border border-orange-500/30 bg-orange-500/20 text-orange-400">
              ポジティブスプリット
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "180px" }} />

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">変化率</p>
            <p
              className={`text-lg font-semibold tabular-nums ${declineRate > 0 ? "text-orange-400" : "text-green-400"}`}
            >
              {declineRate > 0 ? "+" : ""}
              {declineRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Best Lap</p>
            <p className="text-lg font-semibold tabular-nums text-green-400">
              Lap {bestLapIdx + 1}: {formatTime(athlete.lapTimes[bestLapIdx].time)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Worst Lap</p>
            <p className="text-lg font-semibold tabular-nums text-red-400">
              Lap {worstLapIdx + 1}: {formatTime(athlete.lapTimes[worstLapIdx].time)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
