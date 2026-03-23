"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EChart, useChartTheme, COLORS } from "@/components/echart";
import type { EChartsOption } from "@/components/echart";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import type { CategoryFilter } from "@/components/category-filter";

interface SpeedGaugeProps {
  category: CategoryFilter;
}

export function SpeedGauge({ category }: SpeedGaugeProps) {
  const theme = useChartTheme();

  const { speed, name, cat } = useMemo(() => {
    const allData = results as unknown as AthleteResult[];
    const categoriesToCheck: Array<"200km" | "100km" | "50km"> = [category];

    let fastest: AthleteResult | null = null;
    let fastestSpeed = 0;

    for (const c of categoriesToCheck) {
      const finished = allData.filter(
        (r) => r.category === c && r.status === "finished" && r.avgSpeed
      );
      for (const r of finished) {
        if (r.avgSpeed && r.avgSpeed > fastestSpeed) {
          fastestSpeed = r.avgSpeed;
          fastest = r;
        }
      }
    }

    return {
      speed: fastestSpeed,
      name: fastest ? `${fastest.name} (#${fastest.no})` : "",
      cat: fastest ? fastest.category : "",
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
          max: 50,
          splitNumber: 5,
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
              name: `${name} (${cat})`,
            },
          ],
          animationDuration: 1200,
          animationEasing: "bounceOut",
        },
      ],
    }),
    [speed, name, cat, theme]
  );

  if (speed === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>最速平均速度</CardTitle>
      </CardHeader>
      <CardContent>
        <EChart option={option} style={{ width: "100%", height: "260px" }} />
      </CardContent>
    </Card>
  );
}
