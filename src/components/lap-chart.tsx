"use client";

import { useMemo } from "react";
import type { EChartsOption } from "@/components/echart";
import { COLORS, EChart, useChartTheme } from "@/components/echart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import results from "@/data/results.json";
import { lapTimeToMinutes } from "@/lib/time-utils";
import type { AthleteResult } from "@/lib/types";

const LINE_COLORS = [COLORS.pink, COLORS.purple, COLORS.teal];

interface LapChartProps {
  category: "200km" | "100km" | "50km";
  athleteNos?: number[];
}

export function LapChart({ category, athleteNos }: LapChartProps) {
  const data = results as unknown as AthleteResult[];
  const theme = useChartTheme();

  const { chartData, riders, maxLaps } = useMemo(() => {
    const finished = data.filter(
      (r) => r.category === category && r.status === "finished" && typeof r.rank === "number",
    );
    finished.sort((a, b) => (a.rank as number) - (b.rank as number));

    const selected = athleteNos
      ? finished.filter((r) => athleteNos.includes(r.no))
      : finished.slice(0, 3);

    if (selected.length === 0) return { chartData: [], riders: [], maxLaps: 0 };

    const ml = Math.max(...selected.map((r) => r.lapTimes.length));
    const laps = Array.from({ length: ml }, (_, i) => i + 1);

    const ridersList = selected.map((r) => ({
      key: `bib${r.no}`,
      name: `${r.name} (#${r.no})`,
      data: laps.map((lap) => {
        const lt = r.lapTimes.find((l) => l.lap === lap);
        return lt ? lapTimeToMinutes(lt.time) : null;
      }),
    }));

    return { chartData: laps, riders: ridersList, maxLaps: ml };
  }, [category, athleteNos]);

  if (riders.length === 0) return null;

  const option: EChartsOption = useMemo(() => {
    const allValues = riders.flatMap((r) => r.data.filter((v): v is number => v !== null));
    const minVal = allValues.length > 0 ? Math.floor(Math.min(...allValues) * 10 - 5) / 10 : 5;
    const maxVal = allValues.length > 0 ? Math.ceil(Math.max(...allValues) * 10 + 5) / 10 : 15;

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
          let html = `<div style="font-weight:600;margin-bottom:4px">Lap ${lapNum}</div>`;
          for (const p of filtered) {
            if (p.value !== null && p.value !== undefined) {
              html += `<div>${p.marker} ${p.seriesName}: ${Number(p.value).toFixed(2)} 分</div>`;
            }
          }
          return html;
        },
      },
      legend: {
        data: riders.map((r) => r.name),
        textStyle: { color: theme.subTextColor, fontSize: 12 },
        bottom: 0,
      },
      grid: { top: 10, right: 10, bottom: 40, left: 50 },
      xAxis: {
        type: "category",
        data: chartData,
        name: "Lap",
        nameLocation: "end",
        nameTextStyle: { color: theme.subTextColor },
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        axisLine: { lineStyle: { color: theme.borderColor } },
      },
      yAxis: {
        type: "value",
        name: "分",
        nameTextStyle: { color: theme.subTextColor },
        min: minVal,
        max: maxVal,
        axisLabel: { fontSize: 12, color: theme.subTextColor },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      dataZoom:
        maxLaps > 20
          ? [{ type: "slider", bottom: 25, height: 18, borderColor: theme.borderColor }]
          : [],
      series: riders.map((rider, i) => ({
        name: rider.name,
        type: "line" as const,
        data: rider.data,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: LINE_COLORS[i % LINE_COLORS.length] },
        itemStyle: { color: LINE_COLORS[i % LINE_COLORS.length] },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${LINE_COLORS[i % LINE_COLORS.length]}30` },
              { offset: 1, color: `${LINE_COLORS[i % LINE_COLORS.length]}05` },
            ],
          },
        },
        animationDuration: 800,
        animationEasing: "cubicOut",
      })),
    };
  }, [chartData, riders, maxLaps, theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>TOP3 ラップタイム推移 ({category})</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "300px" }} />
      </CardContent>
    </Card>
  );
}
