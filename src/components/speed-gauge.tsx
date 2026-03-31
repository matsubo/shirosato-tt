"use client";

import { useMemo } from "react";
import type { CategoryFilter } from "@/components/category-filter";
import type { EChartsOption } from "@/components/echart";
import { COLORS, EChart, useChartTheme } from "@/components/echart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import race from "@/data/race.json";
import results from "@/data/results.json";
import { timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult, RaceMetadata } from "@/lib/types";

interface SpeedGaugeProps {
  category: CategoryFilter;
}

export function SpeedGauge({ category }: SpeedGaugeProps) {
  const theme = useChartTheme();
  const raceData = race as unknown as RaceMetadata;

  const { speed, name, lapNum } = useMemo(() => {
    const allData = results as unknown as AthleteResult[];
    const catData = allData.filter(
      (r) =>
        r.category === category &&
        (r.status === "finished" || r.status === "OPEN") &&
        r.lapTimes &&
        r.lapTimes.length > 0,
    );

    const catInfo = raceData.categories.find((c) => c.name === category);
    const lapDistKm = catInfo?.lapDistance ?? 5.6663;

    let fastestSpeed = 0;
    let fastestName = "";
    let fastestLap = 0;

    for (const r of catData) {
      for (const lt of r.lapTimes) {
        const sec = timeToSeconds(lt.time);
        if (sec <= 0) continue;
        const speedKmh = (lapDistKm / sec) * 3600;
        if (speedKmh > fastestSpeed) {
          fastestSpeed = speedKmh;
          fastestName = `${r.name} (#${r.no})`;
          fastestLap = lt.lap;
        }
      }
    }

    return {
      speed: fastestSpeed,
      name: fastestName,
      lapNum: fastestLap,
    };
  }, [category]);

  const option: EChartsOption = useMemo(
    () => ({
      series: [
        {
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          min: 25,
          max: 55,
          splitNumber: 6,
          progress: {
            show: true,
            width: 18,
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: COLORS.green },
                  { offset: 0.5, color: COLORS.cyan },
                  { offset: 1, color: COLORS.blue },
                ],
              },
            },
          },
          pointer: {
            length: "60%",
            width: 6,
            itemStyle: {
              color: COLORS.cyan,
            },
          },
          axisLine: {
            lineStyle: {
              width: 18,
              color: [[1, theme.isDark ? "#334155" : "#e2e8f0"]],
            },
          },
          axisTick: {
            distance: -25,
            length: 6,
            lineStyle: { color: theme.subTextColor, width: 1 },
          },
          splitLine: {
            distance: -28,
            length: 12,
            lineStyle: { color: theme.subTextColor, width: 2 },
          },
          axisLabel: {
            distance: -15,
            color: theme.subTextColor,
            fontSize: 11,
          },
          detail: {
            valueAnimation: true,
            formatter: (value: number) => `${value.toFixed(1)} km/h`,
            color: theme.textColor,
            fontSize: 18,
            fontWeight: "bold",
            offsetCenter: [0, "70%"],
          },
          title: {
            offsetCenter: [0, "90%"],
            fontSize: 11,
            color: theme.subTextColor,
          },
          data: [
            {
              value: parseFloat(speed.toFixed(1)),
              name: `${name} Lap${lapNum}`,
            },
          ],
          animationDuration: 1200,
          animationEasing: "bounceOut",
        },
      ],
    }),
    [speed, name, lapNum, theme],
  );

  if (speed === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ラップ最高速度</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "260px" }} />
      </CardContent>
    </Card>
  );
}
