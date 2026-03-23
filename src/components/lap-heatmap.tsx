"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EChart, useChartTheme } from "@/components/echart";
import type { EChartsOption } from "@/components/echart";
import { ChevronLeft, ChevronRight } from "lucide-react";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds, secondsToTime } from "@/lib/time-utils";
import type { CategoryFilter } from "@/components/category-filter";

const PAGE_SIZE = 30;

interface LapHeatmapProps {
  category: CategoryFilter;
}

export function LapHeatmap({ category }: LapHeatmapProps) {
  const theme = useChartTheme();
  const [page, setPage] = useState(0);

  const allFinished = useMemo(() => {
    if (category === "ALL") return [];
    const allData = results as unknown as AthleteResult[];
    return allData
      .filter(
        (r) =>
          r.category === category &&
          (r.status === "finished" || r.status === "OPEN") &&
          r.lapTimes.length > 0
      )
      .sort((a, b) => {
        const ra = typeof a.rank === "number" ? a.rank : 9999;
        const rb = typeof b.rank === "number" ? b.rank : 9999;
        return ra - rb;
      });
  }, [category]);

  const totalPages = Math.ceil(allFinished.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages - 1);

  const option: EChartsOption | null = useMemo(() => {
    if (category === "ALL" || allFinished.length === 0) return null;

    const paged = allFinished.slice(
      currentPage * PAGE_SIZE,
      (currentPage + 1) * PAGE_SIZE
    );

    const maxLaps = Math.max(...paged.map((r) => r.lapTimes.length));
    const lapLabels = Array.from({ length: maxLaps }, (_, i) => `${i + 1}`);
    const riderLabels = paged.map(
      (r) =>
        `${typeof r.rank === "number" ? r.rank : r.status}位 ${r.name}`
    );

    const heatmapData: Array<[number, number, number | null]> = [];
    let minSec = Infinity;
    let maxSec = -Infinity;

    for (let ri = 0; ri < paged.length; ri++) {
      for (let li = 0; li < maxLaps; li++) {
        const lt = paged[ri].lapTimes.find(
          (l: { lap: number }) => l.lap === li + 1
        );
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
        left: 140,
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
  }, [category, allFinished, currentPage, theme]);

  if (category === "ALL" || option === null) return null;

  const startRank = currentPage * PAGE_SIZE + 1;
  const endRank = Math.min((currentPage + 1) * PAGE_SIZE, allFinished.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            ラップタイム ヒートマップ ({startRank}-{endRank}位 / {allFinished.length}人)
          </CardTitle>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <EChart
          option={option}
          style={{ width: "100%", height: `${Math.max(300, endRank - startRank + 1) * 16 + 80}px` }}
        />
      </CardContent>
    </Card>
  );
}
