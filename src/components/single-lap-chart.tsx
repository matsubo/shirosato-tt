"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds, secondsToTime } from "@/lib/time-utils";
import { mean, calcMovingAverage } from "@/lib/stats";

interface SingleLapChartProps {
  athlete: AthleteResult;
}

export function SingleLapChart({ athlete }: SingleLapChartProps) {
  if (athlete.lapTimes.length === 0) return null;

  const lapSeconds = athlete.lapTimes.map((l) => timeToSeconds(l.time));
  const avg = mean(lapSeconds);
  const windowSize = Math.max(3, Math.floor(lapSeconds.length / 5));
  const movingAvg = calcMovingAverage(lapSeconds, windowSize);

  const data = athlete.lapTimes.map((l, i) => ({
    lap: l.lap,
    time: lapSeconds[i],
    movingAvg: movingAvg[i] ?? null,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>ラップタイム推移</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="lap"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "Lap",
                position: "insideBottomRight",
                offset: -5,
                fontSize: 11,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => secondsToTime(v)}
              domain={["dataMin - 10", "dataMax + 10"]}
            />
            <ReferenceLine
              y={avg}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{
                value: `Avg ${secondsToTime(Math.round(avg))}`,
                position: "right",
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <Tooltip
              formatter={(value, name) => [
                secondsToTime(Math.round(Number(value))),
                name === "time" ? "ラップタイム" : "移動平均",
              ]}
              labelFormatter={(label) => `Lap ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="time"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="movingAvg"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
