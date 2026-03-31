"use client";

import { useMemo } from "react";
import type { EChartsOption } from "@/components/echart";
import { COLORS, EChart, useChartTheme } from "@/components/echart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mean } from "@/lib/stats";
import { secondsToTime, timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult } from "@/lib/types";

interface PacingWaterfallProps {
  athlete: AthleteResult;
}

export function PacingWaterfall({ athlete }: PacingWaterfallProps) {
  if (athlete.lapTimes.length < 2) return null;

  const theme = useChartTheme();

  const lapSeconds = athlete.lapTimes.map((l) => timeToSeconds(l.time));
  const idealLap = mean(lapSeconds); // Even split would be every lap at average

  const option: EChartsOption = useMemo(() => {
    // Cumulative time loss/gain vs ideal even split
    let cumulative = 0;
    const data = athlete.lapTimes.map((l, i) => {
      const diff = lapSeconds[i] - idealLap;
      cumulative += diff;
      return {
        lap: l.lap,
        diff: parseFloat(diff.toFixed(1)),
        cumulative: parseFloat(cumulative.toFixed(1)),
        faster: diff < 0,
      };
    });

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const filtered = Array.isArray(params) ? params : [params];
          let html = `<div style="font-weight:600">Lap ${filtered[0]?.axisValue}</div>`;
          for (const p of filtered) {
            const val = Number(p.value);
            const sign = val > 0 ? "+" : "";
            html += `<div>${p.marker} ${p.seriesName}: ${sign}${val.toFixed(1)}s</div>`;
          }
          return html;
        },
      },
      legend: {
        data: ["各ラップ差", "累積差"],
        textStyle: { color: theme.subTextColor, fontSize: 11 },
        bottom: 0,
      },
      grid: { top: 20, right: 20, bottom: 35, left: 55 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.lap),
        name: "Lap",
        nameLocation: "end",
        nameTextStyle: { color: theme.subTextColor, fontSize: 11 },
        axisLabel: { fontSize: 10, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      yAxis: {
        type: "value",
        name: "秒",
        nameTextStyle: { color: theme.subTextColor },
        axisLabel: {
          fontSize: 10,
          color: theme.subTextColor,
          formatter: (v: number) => `${v > 0 ? "+" : ""}${v}`,
        },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      series: [
        {
          name: "各ラップ差",
          type: "bar",
          data: data.map((d) => ({
            value: d.diff,
            itemStyle: {
              color: d.faster ? `${COLORS.green}88` : `${COLORS.red}88`,
              borderRadius: d.faster ? [0, 0, 2, 2] : [2, 2, 0, 0],
            },
          })),
          markLine: {
            data: [{ yAxis: 0 }],
            lineStyle: { color: theme.subTextColor },
            label: { show: false },
            silent: true,
          },
        },
        {
          name: "累積差",
          type: "line",
          data: data.map((d) => d.cumulative),
          smooth: true,
          symbol: "circle",
          symbolSize: 4,
          lineStyle: { width: 2, color: COLORS.orange },
          itemStyle: { color: COLORS.orange },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${COLORS.orange}20` },
                { offset: 1, color: `${COLORS.orange}05` },
              ],
            },
          },
        },
      ],
    };
  }, [athlete.lapTimes, lapSeconds, idealLap, theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ペーシング累積差分析</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">
          理想イーブンペース(平均ラップ {secondsToTime(Math.round(idealLap))}) との差分。正=遅い /
          負=速い
        </p>
        <EChart option={option} style={{ width: "100%", height: "280px" }} />
      </CardContent>
    </Card>
  );
}
