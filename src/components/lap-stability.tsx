"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds, secondsToTime } from "@/lib/time-utils";
import { mean, stddev, calcCV } from "@/lib/stats";

interface LapStabilityProps {
  athlete: AthleteResult;
}

export function LapStability({ athlete }: LapStabilityProps) {
  if (athlete.lapTimes.length < 2) return null;

  const lapSeconds = athlete.lapTimes.map((l) => timeToSeconds(l.time));
  const avg = mean(lapSeconds);
  const sd = stddev(lapSeconds);
  const cv = calcCV(lapSeconds);

  const data = athlete.lapTimes.map((l, i) => {
    const sec = lapSeconds[i];
    const deviation = sec - avg;
    return {
      lap: `${l.lap}`,
      deviation,
      time: l.time,
      faster: deviation < 0,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>ラップ安定性</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">平均ラップ</p>
            <p className="text-lg font-semibold tabular-nums">
              {secondsToTime(Math.round(avg))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">標準偏差</p>
            <p className="text-lg font-semibold tabular-nums">
              {sd.toFixed(1)}s
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CV (変動係数)</p>
            <p className="text-lg font-semibold tabular-nums">
              {cv.toFixed(2)}%
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
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
              tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}s`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              formatter={(value) => [
                `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(1)}s`,
                "偏差",
              ]}
              labelFormatter={(label) => {
                const item = data.find((d) => d.lap === label);
                return item ? `Lap ${label} (${item.time})` : `Lap ${label}`;
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="deviation" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.faster
                      ? "hsl(var(--chart-2))"
                      : "hsl(var(--chart-5))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
