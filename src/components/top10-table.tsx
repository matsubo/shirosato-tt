"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import results from "@/data/results.json";
import race from "@/data/race.json";
import type { AthleteResult, RaceMetadata } from "@/lib/types";
import { timeToSeconds, formatTime } from "@/lib/time-utils";
import { calcDeviation } from "@/lib/stats";

const RANK_COLORS: Record<number, string> = {
  1: "#fbbf24",
  2: "#9ca3af",
  3: "#d97706",
};

interface Top10TableContentProps {
  category: "200km" | "100km" | "50km";
}

export function Top10TableContent({ category }: Top10TableContentProps) {
  const data = results as unknown as AthleteResult[];
  const raceData = race as unknown as RaceMetadata;

  const { top10, deviations } = useMemo(() => {
    const finished = data.filter(
      (r) =>
        r.category === category &&
        r.status === "finished" &&
        typeof r.rank === "number" &&
        r.totalTime
    );
    finished.sort((a, b) => (a.rank as number) - (b.rank as number));

    const allTimes = finished.map((r) => timeToSeconds(r.totalTime!));

    const catMeta = raceData.categories.find((c) => c.name === category);
    const distance = catMeta?.distance ?? 0;

    const top = finished.slice(0, 10).map((r) => {
      const secs = timeToSeconds(r.totalTime!);
      const avgSpeed = distance > 0 ? distance / (secs / 3600) : 0;
      const deviation = calcDeviation(secs, allTimes);
      return {
        ...r,
        avgSpeed: avgSpeed.toFixed(1),
        deviation: deviation.toFixed(1),
      };
    });

    return { top10: top, deviations: allTimes };
  }, [category, data, raceData]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">順位</TableHead>
          <TableHead className="w-14">No.</TableHead>
          <TableHead>氏名</TableHead>
          <TableHead>タイム</TableHead>
          <TableHead className="text-right">平均速度</TableHead>
          <TableHead className="text-right">偏差値</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {top10.map((r) => {
          const rank = r.rank as number;
          const rankColor = RANK_COLORS[rank];
          return (
            <TableRow key={r.no}>
              <TableCell
                className="font-bold"
                style={rankColor ? { color: rankColor } : undefined}
              >
                {rank}
              </TableCell>
              <TableCell>{r.no}</TableCell>
              <TableCell>
                <Link
                  href={`/athletes/${r.no}`}
                  className="underline decoration-muted-foreground/30 hover:decoration-foreground transition-colors"
                >
                  {r.name}
                </Link>
              </TableCell>
              <TableCell className="tabular-nums">
                {formatTime(r.totalTime!)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.avgSpeed} km/h
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.deviation}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
