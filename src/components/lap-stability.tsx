"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EChart, useChartTheme, COLORS } from "@/components/echart";
import type { EChartsOption } from "@/components/echart";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds, secondsToTime } from "@/lib/time-utils";
import { mean, stddev, calcCV } from "@/lib/stats";

interface LapStabilityProps {
  athlete: AthleteResult;
}

export function LapStability({ athlete }: LapStabilityProps) {
  if (athlete.lapTimes.length < 2) return null;

  const theme = useChartTheme();

  const lapSeconds = athlete.lapTimes.map((l) => timeToSeconds(l.time));
  const avg = mean(lapSeconds);
  const sd = stddev(lapSeconds);
  const cv = calcCV(lapSeconds);

  const data = athlete.lapTimes.map((l, i) => {
    const sec = lapSeconds[i];
    const deviation = sec - avg;
    return {
      lap: `${l.lap}`,
      deviation,
      time: l.time,
      faster: deviation < 0,
    };
  });

  const option: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const item = data.find((d) => d.lap === p.axisValue);
          const val = Number(p.value);
          return `<div style="font-weight:600">Lap ${p.axisValue}${item ? ` (${item.time})` : ""}</div>
                  <div>偏差: ${val > 0 ? "+" : ""}${val.toFixed(1)}s</div>`;
        },
      },
      grid: { top: 10, right: 10, bottom: 30, left: 50 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.lap),
        axisLabel: { fontSize: 10, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
        name: "Lap",
        nameLocation: "end",
        nameTextStyle: { color: theme.subTextColor, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontSize: 10,
          color: theme.subTextColor,
          formatter: (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}s`,
        },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      series: [
        {
          type: "bar",
          data: data.map((d) => ({
            value: parseFloat(d.deviation.toFixed(1)),
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: d.faster ? 1 : 0,
                x2: 0,
                y2: d.faster ? 0 : 1,
                colorStops: [
                  { offset: 0, color: d.faster ? COLORS.green : COLORS.red },
                  { offset: 1, color: d.faster ? COLORS.green + "44" : COLORS.red + "44" },
                ],
              },
              borderRadius: d.faster ? [0, 0, 4, 4] : [4, 4, 0, 0],
            },
          })),
          markLine: {
            data: [{ yAxis: 0 }],
            lineStyle: { color: theme.subTextColor },
            label: { show: false },
            silent: true,
          },
          animationDuration: 600,
        },
      ],
    }),
    [data, theme]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>ラップ安定性</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">平均ラップ</p>
            <p className="text-lg font-semibold tabular-nums">
              {secondsToTime(Math.round(avg))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">標準偏差</p>
            <p className="text-lg font-semibold tabular-nums">
              {sd.toFixed(1)}s
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CV (変動係数)</p>
            <p className="text-lg font-semibold tabular-nums">
              {cv.toFixed(2)}%
            </p>
          </div>
        </div>

        <EChart option={option} style={{ width: "100%", height: "240px" }} />
      </CardContent>
    </Card>
  );
}
