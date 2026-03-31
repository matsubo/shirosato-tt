import { AlertTriangle, Gauge, Percent, Timer, TrendingUp, Trophy, Users } from "lucide-react";
import type { CategoryFilter } from "@/components/category-filter";
import results from "@/data/results.json";
import { secondsToTime, timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  "200km": "#22d3ee",
  "100km": "#4ade80",
  "50km": "#fb923c",
};

interface KpiCardsProps {
  category: CategoryFilter;
}

export function KpiCards({ category }: KpiCardsProps) {
  const allData = results as unknown as AthleteResult[];
  const data = allData.filter((r) => r.category === category);

  const total = data.length;
  const finished = data.filter((r) => r.status === "finished" || r.status === "OPEN");
  const finishers = finished.length;
  const finishRate = total > 0 ? ((finishers / total) * 100).toFixed(1) : "0.0";
  const dnfCount = data.filter((r) => r.status === "DNF").length;

  // Fastest
  const sortedFinished = [...finished]
    .filter((r) => r.totalTime)
    .sort((a, b) => timeToSeconds(a.totalTime!) - timeToSeconds(b.totalTime!));
  const fastest = sortedFinished[0];

  // Average time
  const times = sortedFinished.map((r) => timeToSeconds(r.totalTime!));
  const avgTime =
    times.length > 0
      ? secondsToTime(Math.round(times.reduce((a, b) => a + b, 0) / times.length))
      : "-";

  // Average speed
  const speeds = finished.filter((r) => r.avgSpeed).map((r) => r.avgSpeed!);
  const avgSpeed =
    speeds.length > 0 ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1) : "-";

  const accent = CATEGORY_COLORS[category] ?? "#22d3ee";

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
      {/* Participants */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-xs font-medium">参加者</span>
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums">{total}</p>
      </div>

      {/* Finishers */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="h-4 w-4" />
          <span className="text-xs font-medium">完走者</span>
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums">{finishers}</p>
      </div>

      {/* Finish Rate */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Percent className="h-4 w-4" />
          <span className="text-xs font-medium">完走率</span>
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums">{finishRate}%</p>
        {/* Mini progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${finishRate}%`,
              backgroundColor: accent,
            }}
          />
        </div>
      </div>

      {/* DNF */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-medium">DNF</span>
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums text-red-400">{dnfCount}</p>
      </div>

      {/* Fastest */}
      <div
        className="relative overflow-hidden rounded-xl border bg-card p-4"
        style={{ borderColor: `${accent}40` }}
      >
        <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: accent }} />
        <div className="flex items-center gap-2" style={{ color: accent }}>
          <Timer className="h-4 w-4" />
          <span className="text-xs font-medium">最速タイム</span>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: accent }}>
          {fastest?.totalTime ?? "-"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{fastest?.name ?? "-"}</p>
      </div>

      {/* Average Time */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">平均タイム</span>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums">{avgTime}</p>
      </div>

      {/* Average Speed */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Gauge className="h-4 w-4" />
          <span className="text-xs font-medium">平均速度</span>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums">{avgSpeed}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">km/h</p>
      </div>
    </div>
  );
}
