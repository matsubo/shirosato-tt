"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "@/components/echart";
import { EChart, useChartTheme } from "@/components/echart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calcCdAFromLapTime } from "@/lib/cda";
import { timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult, RaceMetadata } from "@/lib/types";

interface CdACalculatorProps {
  athlete: AthleteResult;
  race: RaceMetadata;
}

export function CdACalculator({ athlete, race }: CdACalculatorProps) {
  const [power, setPower] = useState(200);
  const [weight, setWeight] = useState(75);
  const theme = useChartTheme();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("power");
    const w = params.get("weight");
    if (p) setPower(Number(p));
    if (w) setWeight(Number(w));
  }, []);

  const updateUrl = useCallback((p: number, w: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("power", String(p));
    url.searchParams.set("weight", String(w));
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handlePowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setPower(v);
    updateUrl(v, weight);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setWeight(v);
    updateUrl(power, v);
  };

  if (athlete.lapTimes.length === 0) return null;

  const categoryInfo = race.categories.find((c) => c.name === athlete.category);
  const lapDistanceM = (categoryInfo?.lapDistance ?? 5.666) * 1000;
  const totalWeight = weight + 8;

  const airDensity = 1.226;

  const lapCdAs = athlete.lapTimes.map((l) => {
    const sec = timeToSeconds(l.time);
    return {
      lap: l.lap,
      cda: calcCdAFromLapTime(sec, lapDistanceM, power, {
        airDensity,
        totalWeight,
        rollingResistance: 0.004,
        drivetrainEfficiency: 0.97,
        gradient: 0,
      }),
    };
  });

  const validCdAs = lapCdAs.filter((l) => l.cda > 0).map((l) => l.cda);
  const avgCdA = validCdAs.length > 0 ? validCdAs.reduce((s, v) => s + v, 0) / validCdAs.length : 0;
  const minCda = Math.min(...validCdAs);
  const maxCda = Math.max(...validCdAs);

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
          return `<div style="font-weight:600">Lap ${p.axisValue}</div>
                  <div>CdA: ${Number(p.value).toFixed(4)} m\u00b2</div>`;
        },
      },
      visualMap: {
        show: false,
        min: minCda,
        max: maxCda,
        inRange: {
          color: ["#4ade80", "#facc15", "#f87171"],
        },
      },
      grid: { top: 10, right: 10, bottom: 30, left: 55 },
      xAxis: {
        type: "category",
        data: lapCdAs.map((d) => String(d.lap)),
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
          formatter: (v: number) => v.toFixed(3),
        },
        splitLine: { lineStyle: { color: theme.gridLineColor } },
      },
      series: [
        {
          type: "bar",
          data: lapCdAs.map((d) => d.cda),
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
          animationDuration: 600,
        },
      ],
    }),
    [lapCdAs, minCda, maxCda, theme],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>CdA推定ツール</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h4 className="mb-3 text-sm font-medium">入力パラメータ</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">平均パワー (W)</label>
                <Input
                  type="number"
                  value={power}
                  onChange={handlePowerChange}
                  min={50}
                  max={500}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">体重 (kg)</label>
                <Input
                  type="number"
                  value={weight}
                  onChange={handleWeightChange}
                  min={30}
                  max={150}
                />
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium">環境条件</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                気温: {race.weather.temperature}&deg;C / 湿度: {race.weather.humidity}%
              </p>
              <p>風: {race.weather.wind}</p>
              <p>コース: 1周 {categoryInfo?.lapDistance ?? 5.666}km (フラット)</p>
              <p>空気密度: {airDensity} kg/m&sup3;</p>
              <p>Crr: 0.004 / 駆動効率: 0.97</p>
              <p>
                総重量: {totalWeight}kg (体重{weight}kg + 機材8kg)
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">推定 CdA (平均)</p>
          <p className="text-4xl font-bold tabular-nums text-primary">{avgCdA.toFixed(4)}</p>
          <p className="text-xs text-muted-foreground">m&sup2;</p>
        </div>

        <EChart option={option} style={{ width: "100%", height: "200px" }} />

        <p className="mt-4 text-xs text-muted-foreground">
          ※
          この推定は一定速度を仮定しており、風の影響、加減速、コーナリングなどは考慮していません。実際のCdAとは異なる場合があります。
        </p>
      </CardContent>
    </Card>
  );
}
