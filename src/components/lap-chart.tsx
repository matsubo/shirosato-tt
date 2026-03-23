"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { lapTimeToMinutes } from "@/lib/time-utils";

const LINE_COLORS = ["#f472b6", "#a78bfa", "#34d399"];

interface LapChartProps {
  category: "200km" | "100km" | "50km";
  athleteNos?: number[];
}

export function LapChart({ category, athleteNos }: LapChartProps) {
  const data = results as unknown as AthleteResult[];

  const { chartData, riders } = useMemo(() => {
    const finished = data.filter(
      (r) =>
        r.category === category &&
        r.status === "finished" &&
        typeof r.rank === "number"
    );
    finished.sort((a, b) => (a.rank as number) - (b.rank as number));

    const selected = athleteNos
      ? finished.filter((r) => athleteNos.includes(r.no))
      : finished.slice(0, 3);

    if (selected.length === 0) return { chartData: [], riders: [] };

    const maxLaps = Math.max(...selected.map((r) => r.lapTimes.length));
    const rows: Array<Record<string, number>> = [];

    for (let lap = 1; lap <= maxLaps; lap++) {
      const row: Record<string, number> = { lap };
      for (const rider of selected) {
        const lt = rider.lapTimes.find((l) => l.lap === lap);
        if (lt) {
          row[`bib${rider.no}`] = lapTimeToMinutes(lt.time);
        }
      }
      rows.push(row);
    }

    return {
      chartData: rows,
      riders: selected.map((r) => ({
        key: `bib${r.no}`,
        name: `${r.name} (#${r.no})`,
      })),
    };
  }, [category, athleteNos, data]);

  if (riders.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>TOP3 ラップタイム推移 ({category})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="lap"
              tick={{ fontSize: 12, fill: "currentColor" }}
              label={{ value: "Lap", position: "insideBottomRight", offset: -5, fill: "currentColor" }}
              stroke="currentColor"
            />
            <YAxis
              tick={{ fontSize: 12, fill: "currentColor" }}
              label={{
                value: "分",
                angle: -90,
                position: "insideLeft",
                fill: "currentColor",
              }}
              stroke="currentColor"
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover, 220 20% 14%))",
                border: "1px solid hsl(var(--border, 220 20% 25%))",
                borderRadius: "8px",
                color: "inherit",
              }}
              formatter={(value, name) => {
                const rider = riders.find((r) => r.key === name);
                return [`${Number(value).toFixed(2)} 分`, rider?.name ?? String(name)];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const rider = riders.find((r) => r.key === value);
                return rider?.name ?? value;
              }}
              wrapperStyle={{ fontSize: 12 }}
            />
            {riders.map((rider, i) => (
              <Line
                key={rider.key}
                type="monotone"
                dataKey={rider.key}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
