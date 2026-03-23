"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EChart, useChartTheme } from "@/components/echart";
import type { EChartsOption } from "@/components/echart";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds, secondsToTime } from "@/lib/time-utils";
import type { CategoryFilter } from "@/components/category-filter";

interface LapHeatmapProps {
  category: CategoryFilter;
}

export function LapHeatmap({ category }: LapHeatmapProps) {
  const theme = useChartTheme();

  const option: EChartsOption | null = useMemo(() => {
    if (category === "ALL") return null;

    const allData = results as unknown as AthleteResult[];
    const finished = allData
      .filter(
        (r) =>
          r.category === category &&
          r.status === "finished" &&
          r.lapTimes.length > 0 &&
          typeof r.rank === "number"
      )
      .sort((a, b) => (a.rank as number) - (b.rank as number))
      .slice(0, 30); // Top 30 for readability

    if (finished.length === 0) return null;

    const maxLaps = Math.max(...finished.map((r) => r.lapTimes.length));
    const lapLabels = Array.from({ length: maxLaps }, (_, i) => `${i + 1}`);
    const riderLabels = finished.map((r) => `#${r.no} ${r.name}`);

    // Build heatmap data: [lapIdx, riderIdx, seconds]
    const heatmapData: Array<[number, number, number | null]> = [];
    let minSec = Infinity;
    let maxSec = -Infinity;

    for (let ri = 0; ri < finished.length; ri++) {
      for (let li = 0; li < maxLaps; li++) {
        const lt = finished[ri].lapTimes.find((l) => l.lap === li + 1);
        if (lt) {
          const sec = timeToSeconds(lt.time);
          heatmapData.push([li, ri, sec]);
          if (sec < minSec) minSec = sec;
          if (sec > maxSec) maxSec = sec;
        } else {
          heatmapData.push([li, ri, null]);
        }
      }
    }

    return {
      tooltip: {
        position: "top",
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const [lapIdx, riderIdx, val] = params.value;
          if (val === null) return "";
          return `<div style="font-weight:600">${riderLabels[riderIdx]}</div>
                  <div>Lap ${lapIdx + 1}: ${secondsToTime(Math.round(val))}</div>`;
        },
      },
      grid: {
        top: 10,
        right: 20,
        bottom: 50,
        left: 120,
      },
      xAxis: {
        type: "category",
        data: lapLabels,
        name: "Lap",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { color: theme.subTextColor },
        axisLabel: { fontSize: 10, color: theme.subTextColor },
        splitArea: { show: true },
      },
      yAxis: {
        type: "category",
        data: riderLabels,
        axisLabel: { fontSize: 9, color: theme.subTextColor },
        splitArea: { show: true },
      },
      visualMap: {
        min: minSec,
        max: maxSec,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemWidth: 12,
        itemHeight: 100,
        textStyle: { color: theme.subTextColor, fontSize: 10 },
        inRange: {
          color: ["#4ade80", "#facc15", "#fb923c", "#f87171"],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (value: any) => secondsToTime(Math.round(Number(value))),
      },
      series: [
        {
          type: "heatmap",
          data: heatmapData.filter((d) => d[2] !== null),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          itemStyle: {
            borderColor: theme.isDark ? "#1e2337" : "#ffffff",
            borderWidth: 1,
          },
          animationDuration: 1000,
        },
      ],
    };
  }, [category, theme]);

  if (category === "ALL" || option === null) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ラップタイム ヒートマップ (TOP30)</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart
          option={option}
          style={{ width: "100%", height: "500px" }}
        />
      </CardContent>
    </Card>
  );
}
