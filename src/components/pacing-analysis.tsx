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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds, formatTime, secondsToTime } from "@/lib/time-utils";
import { mean } from "@/lib/stats";

interface PacingAnalysisProps {
  athlete: AthleteResult;
}

function getHalfSplit(
  category: string,
  totalLaps: number
): { firstEnd: number; secondStart: number } {
  switch (category) {
    case "200km":
      return { firstEnd: 17, secondStart: 18 };
    case "100km":
      return { firstEnd: 9, secondStart: 10 };
    case "50km":
      return { firstEnd: 4, secondStart: 5 };
    default: {
      const half = Math.floor(totalLaps / 2);
      return { firstEnd: half, secondStart: half + 1 };
    }
  }
}

export function PacingAnalysis({ athlete }: PacingAnalysisProps) {
  if (athlete.lapTimes.length < 2) return null;

  const lapSeconds = athlete.lapTimes.map((l) => timeToSeconds(l.time));
  const { firstEnd, secondStart } = getHalfSplit(
    athlete.category,
    athlete.lapTimes.length
  );

  const firstHalfLaps = lapSeconds.slice(0, firstEnd);
  const secondHalfLaps = lapSeconds.slice(secondStart - 1);

  const firstAvg = mean(firstHalfLaps);
  const secondAvg = mean(secondHalfLaps);
  const declineRate =
    firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  const isNegativeSplit = secondAvg <= firstAvg;

  const bestLapIdx = lapSeconds.indexOf(Math.min(...lapSeconds));
  const worstLapIdx = lapSeconds.indexOf(Math.max(...lapSeconds));

  const barData = [
    { name: `前半 (Lap 1-${firstEnd})`, value: firstAvg },
    {
      name: `後半 (Lap ${secondStart}-${athlete.lapTimes.length})`,
      value: secondAvg,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ペーシング分析</CardTitle>
          {isNegativeSplit ? (
            <Badge className="border border-green-500/30 bg-green-500/20 text-green-400">
              ネガティブスプリット
            </Badge>
          ) : (
            <Badge className="border border-orange-500/30 bg-orange-500/20 text-orange-400">
              ポジティブスプリット
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => secondsToTime(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              formatter={(value) => [
                secondsToTime(Math.round(Number(value))),
                "平均ラップ",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              <Cell fill="hsl(var(--chart-1))" />
              <Cell
                fill={
                  isNegativeSplit
                    ? "hsl(var(--chart-2))"
                    : "hsl(var(--chart-5))"
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">変化率</p>
            <p
              className={`text-lg font-semibold tabular-nums ${declineRate > 0 ? "text-orange-400" : "text-green-400"}`}
            >
              {declineRate > 0 ? "+" : ""}
              {declineRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Best Lap</p>
            <p className="text-lg font-semibold tabular-nums text-green-400">
              Lap {bestLapIdx + 1}:{" "}
              {formatTime(athlete.lapTimes[bestLapIdx].time)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Worst Lap</p>
            <p className="text-lg font-semibold tabular-nums text-red-400">
              Lap {worstLapIdx + 1}:{" "}
              {formatTime(athlete.lapTimes[worstLapIdx].time)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
