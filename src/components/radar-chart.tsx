"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EChart, useChartTheme, COLORS } from "@/components/echart";
import type { EChartsOption } from "@/components/echart";
import type { AthleteResult, RaceMetadata } from "@/lib/types";
import { timeToSeconds } from "@/lib/time-utils";
import { mean, stddev, calcCV } from "@/lib/stats";

interface RadarChartProps {
  athlete: AthleteResult;
  categoryAthletes: AthleteResult[];
  race: RaceMetadata;
}

function calcHensachi(
  value: number,
  values: number[],
  inverted: boolean
): number {
  const sd = stddev(values);
  if (sd === 0) return 50;
  const avg = mean(values);
  if (inverted) {
    return 50 - (10 * (value - avg)) / sd;
  }
  return 50 + (10 * (value - avg)) / sd;
}

function clampHensachi(v: number): number {
  return Math.max(20, Math.min(80, v));
}

export function RadarChartComponent({
  athlete,
  categoryAthletes,
  race,
}: RadarChartProps) {
  const theme = useChartTheme();

  const finished = categoryAthletes.filter(
    (a) => a.status === "finished" || a.status === "OPEN"
  );
  if (finished.length < 2) return null;

  const categoryInfo = race.categories.find(
    (c) => c.name === athlete.category
  );

  const totalTimes = finished
    .map((a) => (a.totalTime ? timeToSeconds(a.totalTime) : 0))
    .filter((t) => t > 0);
  const athleteTotalTime = athlete.totalTime
    ? timeToSeconds(athlete.totalTime)
    : 0;

  const lapSecondsList = finished.map((a) =>
    a.lapTimes.map((l) => timeToSeconds(l.time))
  );
  const cvs = lapSecondsList.map((laps) => calcCV(laps));
  const athleteLaps = athlete.lapTimes.map((l) => timeToSeconds(l.time));
  const athleteCV = calcCV(athleteLaps);

  const secondHalfRetentions = finished.map((a) => {
    const laps = a.lapTimes.map((l) => timeToSeconds(l.time));
    const half = Math.floor(laps.length / 2);
    const first = mean(laps.slice(0, half));
    const second = mean(laps.slice(half));
    return first > 0 ? second / first : 1;
  });
  const athleteFirstHalf = mean(
    athleteLaps.slice(0, Math.floor(athleteLaps.length / 2))
  );
  const athleteSecondHalf = mean(
    athleteLaps.slice(Math.floor(athleteLaps.length / 2))
  );
  const athleteRetention =
    athleteFirstHalf > 0 ? athleteSecondHalf / athleteFirstHalf : 1;

  const bestLaps = finished.map((a) =>
    Math.min(...a.lapTimes.map((l) => timeToSeconds(l.time)))
  );
  const athleteBestLap = Math.min(...athleteLaps);

  const avgSpeeds = finished.map((a) => {
    const totalSec = a.totalTime ? timeToSeconds(a.totalTime) : 0;
    const dist = (categoryInfo?.distance ?? 0) * 1000;
    return totalSec > 0 ? dist / totalSec : 0;
  });
  const athleteAvgSpeed =
    athleteTotalTime > 0
      ? ((categoryInfo?.distance ?? 0) * 1000) / athleteTotalTime
      : 0;

  const data = [
    {
      axis: "総合タイム",
      value: clampHensachi(calcHensachi(athleteTotalTime, totalTimes, true)),
    },
    {
      axis: "ラップ安定性",
      value: clampHensachi(calcHensachi(athleteCV, cvs, true)),
    },
    {
      axis: "後半維持率",
      value: clampHensachi(
        calcHensachi(athleteRetention, secondHalfRetentions, true)
      ),
    },
    {
      axis: "ベストラップ",
      value: clampHensachi(calcHensachi(athleteBestLap, bestLaps, true)),
    },
    {
      axis: "平均速度",
      value: clampHensachi(calcHensachi(athleteAvgSpeed, avgSpeeds, false)),
    },
  ];

  const option: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor },
      },
      radar: {
        indicator: data.map((d) => ({
          name: d.axis,
          max: 80,
          min: 20,
        })),
        shape: "polygon",
        splitNumber: 4,
        axisName: {
          color: theme.subTextColor,
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: theme.gridLineColor },
        },
        splitArea: {
          areaStyle: {
            color: theme.isDark
              ? ["rgba(34,211,238,0.02)", "rgba(34,211,238,0.05)", "rgba(34,211,238,0.02)", "rgba(34,211,238,0.05)"]
              : ["rgba(0,0,0,0.01)", "rgba(0,0,0,0.03)", "rgba(0,0,0,0.01)", "rgba(0,0,0,0.03)"],
          },
        },
        axisLine: {
          lineStyle: { color: theme.gridLineColor },
        },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: data.map((d) => parseFloat(d.value.toFixed(1))),
              name: "偏差値",
              areaStyle: {
                color: {
                  type: "radial",
                  x: 0.5,
                  y: 0.5,
                  r: 0.5,
                  colorStops: [
                    { offset: 0, color: COLORS.cyan + "40" },
                    { offset: 1, color: COLORS.cyan + "10" },
                  ],
                },
              },
              lineStyle: { color: COLORS.cyan, width: 2 },
              itemStyle: { color: COLORS.cyan },
              symbol: "circle",
              symbolSize: 6,
            },
          ],
          animationDuration: 800,
        },
      ],
    }),
    [data, theme]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>レーダーチャート (偏差値)</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "320px" }} />
        <div className="mt-2 grid grid-cols-5 gap-1 text-center text-xs text-muted-foreground">
          {data.map((d) => (
            <div key={d.axis}>
              <span className="font-medium text-foreground">
                {d.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
