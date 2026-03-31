import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime, timeToSeconds } from "@/lib/time-utils";
import type { AthleteResult, RaceMetadata } from "@/lib/types";

interface AthleteProfileProps {
  athlete: AthleteResult;
  race: RaceMetadata;
  categoryRank?: { total: number };
  genderRank?: { rank: number; total: number };
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "200km":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "100km":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "50km":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    default:
      return "";
  }
}

function getStatusBadge(athlete: AthleteResult) {
  switch (athlete.status) {
    case "OPEN":
      return (
        <span className="inline-flex items-center rounded-md bg-purple-500/20 px-3 py-1 text-sm font-semibold text-purple-400 ring-1 ring-purple-500/30">
          OPEN
        </span>
      );
    case "DNF":
      return (
        <span className="inline-flex items-center rounded-md bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-400 ring-1 ring-red-500/30">
          DNF
        </span>
      );
    case "DNS":
      return (
        <span className="inline-flex items-center rounded-md bg-gray-500/20 px-3 py-1 text-sm font-semibold text-gray-400 ring-1 ring-gray-500/30">
          DNS
        </span>
      );
    case "finished":
      return typeof athlete.rank === "number" ? (
        <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
          {athlete.rank}位
        </span>
      ) : null;
    default:
      return null;
  }
}

export function AthleteProfile({ athlete, race, categoryRank, genderRank }: AthleteProfileProps) {
  const categoryInfo = race.categories.find((c) => c.name === athlete.category);
  const totalDistance = categoryInfo?.distance ?? 0;
  const totalSeconds = athlete.totalTime ? timeToSeconds(athlete.totalTime) : 0;
  const avgSpeed = totalSeconds > 0 ? (totalDistance / (totalSeconds / 3600)).toFixed(1) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold text-primary">
            {athlete.no}
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl">{athlete.name}</CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className={`border ${getCategoryColor(athlete.category)}`}>
                {athlete.category}
              </Badge>
              <Badge variant="outline">{athlete.gender}</Badge>
              {getStatusBadge(athlete)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {athlete.totalTime && (
            <div>
              <p className="text-xs text-muted-foreground">Total Time</p>
              <p className="text-lg font-semibold tabular-nums">{formatTime(athlete.totalTime)}</p>
            </div>
          )}
          {avgSpeed && (
            <div>
              <p className="text-xs text-muted-foreground">Avg Speed</p>
              <p className="text-lg font-semibold tabular-nums">{avgSpeed} km/h</p>
            </div>
          )}
          {typeof athlete.rank === "number" && categoryRank && (
            <div>
              <p className="text-xs text-muted-foreground">総合順位</p>
              <p className="text-lg font-semibold">
                {athlete.rank}
                <span className="text-sm text-muted-foreground"> / {categoryRank.total}</span>
              </p>
            </div>
          )}
          {genderRank && (
            <div>
              <p className="text-xs text-muted-foreground">
                {athlete.gender === "男" ? "男子" : "女子"}順位
              </p>
              <p className="text-lg font-semibold">
                {genderRank.rank}
                <span className="text-sm text-muted-foreground"> / {genderRank.total}</span>
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Laps</p>
            <p className="text-lg font-semibold">
              {athlete.lapTimes.length}
              <span className="text-sm text-muted-foreground"> / {categoryInfo?.laps ?? "?"}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
