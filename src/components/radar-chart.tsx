"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const finished = categoryAthletes.filter(
    (a) => a.status === "finished" || a.status === "OPEN"
  );
  if (finished.length < 2) return null;

  const categoryInfo = race.categories.find(
    (c) => c.name === athlete.category
  );
  const lapDist = categoryInfo?.lapDistance ?? 5.666;

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
      value: clampHensachi(
        calcHensachi(athleteTotalTime, totalTimes, true)
      ),
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
      value: clampHensachi(
        calcHensachi(athleteBestLap, bestLaps, true)
      ),
    },
    {
      axis: "平均速度",
      value: clampHensachi(
        calcHensachi(athleteAvgSpeed, avgSpeeds, false)
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>レーダーチャート (偏差値)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[20, 80]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickCount={4}
            />
            <Radar
              name="偏差値"
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(value) => [Number(value).toFixed(1), "偏差値"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
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
