"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { lapTimeToMinutes } from "@/lib/time-utils";

const CATEGORY_CONFIG: Record<
  string,
  { color: string; firstHalf: [number, number]; secondHalf: [number, number] }
> = {
  "200km": { color: "#22d3ee", firstHalf: [1, 17], secondHalf: [18, 35] },
  "100km": { color: "#4ade80", firstHalf: [1, 9], secondHalf: [10, 18] },
  "50km": { color: "#fb923c", firstHalf: [1, 4], secondHalf: [5, 9] },
};

interface PacePoint {
  firstHalf: number;
  secondHalf: number;
  name: string;
  no: number;
  category: string;
}

function calcHalfAvg(
  lapTimes: AthleteResult["lapTimes"],
  range: [number, number]
): number | null {
  const laps = lapTimes.filter((l) => l.lap >= range[0] && l.lap <= range[1]);
  if (laps.length === 0) return null;
  const total = laps.reduce((sum, l) => sum + lapTimeToMinutes(l.time), 0);
  return total / laps.length;
}

export function PaceScatter() {
  const data = results as unknown as AthleteResult[];

  const scatterData = useMemo(() => {
    const byCategory: Record<string, PacePoint[]> = {};
    const categories: Array<"200km" | "100km" | "50km"> = ["200km", "100km", "50km"];

    for (const cat of categories) {
      const config = CATEGORY_CONFIG[cat];
      const finished = data.filter(
        (r) =>
          r.category === cat &&
          r.status === "finished" &&
          r.lapTimes.length > 0
      );

      const points: PacePoint[] = [];
      for (const r of finished) {
        const fh = calcHalfAvg(r.lapTimes, config.firstHalf);
        const sh = calcHalfAvg(r.lapTimes, config.secondHalf);
        if (fh !== null && sh !== null) {
          points.push({
            firstHalf: parseFloat(fh.toFixed(2)),
            secondHalf: parseFloat(sh.toFixed(2)),
            name: r.name,
            no: r.no,
            category: cat,
          });
        }
      }
      byCategory[cat] = points;
    }

    return byCategory;
  }, [data]);

  const allPoints = Object.values(scatterData).flat();
  const allValues = allPoints.flatMap((p) => [p.firstHalf, p.secondHalf]);
  const minVal = allValues.length > 0 ? Math.floor(Math.min(...allValues) - 0.5) : 5;
  const maxVal = allValues.length > 0 ? Math.ceil(Math.max(...allValues) + 0.5) : 15;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ペース配分散布図</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">
          対角線より上 = 後半ペースダウン / 対角線より下 = 後半ペースアップ
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <XAxis
              type="number"
              dataKey="firstHalf"
              name="前半平均"
              unit=" 分"
              domain={[minVal, maxVal]}
              tick={{ fontSize: 12, fill: "currentColor" }}
              label={{ value: "前半平均ラップ (分)", position: "insideBottom", offset: -5, fill: "currentColor", fontSize: 12 }}
              stroke="currentColor"
            />
            <YAxis
              type="number"
              dataKey="secondHalf"
              name="後半平均"
              unit=" 分"
              domain={[minVal, maxVal]}
              tick={{ fontSize: 12, fill: "currentColor" }}
              label={{ value: "後半平均ラップ (分)", angle: -90, position: "insideLeft", fill: "currentColor", fontSize: 12 }}
              stroke="currentColor"
            />
            <ReferenceLine
              segment={[
                { x: minVal, y: minVal },
                { x: maxVal, y: maxVal },
              ]}
              stroke="#6b7280"
              strokeDasharray="4 4"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover, 220 20% 14%))",
                border: "1px solid hsl(var(--border, 220 20% 25%))",
                borderRadius: "8px",
                color: "inherit",
              }}
              formatter={(value, name) => [`${value} 分`, String(name) === "firstHalf" ? "前半平均" : "後半平均"]}
              labelFormatter={(_, payload) => {
                if (payload && payload.length > 0) {
                  const p = payload[0]?.payload as PacePoint | undefined;
                  return p ? `${p.name} (#${p.no}) - ${p.category}` : "";
                }
                return "";
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {(["200km", "100km", "50km"] as const).map((cat) => (
              <Scatter
                key={cat}
                name={cat}
                data={scatterData[cat] ?? []}
                fill={CATEGORY_CONFIG[cat].color}
                fillOpacity={0.7}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
