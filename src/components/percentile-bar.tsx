import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcPercentile } from "@/lib/stats";
import { timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult } from "@/lib/types";

interface PercentileBarProps {
  athlete: AthleteResult;
  categoryAthletes: AthleteResult[];
}

function getPercentileColor(percentile: number): string {
  if (percentile <= 25) return "bg-green-500";
  if (percentile <= 50) return "bg-yellow-500";
  if (percentile <= 75) return "bg-orange-500";
  return "bg-red-500";
}

function getPercentileTextColor(percentile: number): string {
  if (percentile <= 25) return "text-green-400";
  if (percentile <= 50) return "text-yellow-400";
  if (percentile <= 75) return "text-orange-400";
  return "text-red-400";
}

function ProgressBar({ label, percentile }: { label: string; percentile: number }) {
  const topPercent = (100 - percentile).toFixed(1);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${getPercentileTextColor(100 - percentile)}`}>
          上位 {topPercent}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${getPercentileColor(100 - percentile)}`}
          style={{ width: `${percentile}%` }}
        />
      </div>
    </div>
  );
}

export function PercentileBar({ athlete, categoryAthletes }: PercentileBarProps) {
  if (!athlete.totalTime) return null;

  const athleteTime = timeToSeconds(athlete.totalTime);

  const finishedCategory = categoryAthletes.filter(
    (a) => (a.status === "finished" || a.status === "OPEN") && a.totalTime,
  );
  const categoryTimes = finishedCategory.map((a) => timeToSeconds(a.totalTime!));
  const categoryPercentile = calcPercentile(athleteTime, categoryTimes);

  const genderAthletes = finishedCategory.filter((a) => a.gender === athlete.gender);
  const genderTimes = genderAthletes.map((a) => timeToSeconds(a.totalTime!));
  const genderPercentile = calcPercentile(athleteTime, genderTimes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>パーセンタイル順位</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar label={`カテゴリ内 (${athlete.category})`} percentile={categoryPercentile} />
        <ProgressBar
          label={`${athlete.gender === "男" ? "男子" : "女子"}内`}
          percentile={genderPercentile}
        />
      </CardContent>
    </Card>
  );
}
