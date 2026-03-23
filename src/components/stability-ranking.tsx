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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { lapTimeToMinutes, formatTime } from "@/lib/time-utils";
import { calcCV } from "@/lib/stats";
import type { CategoryFilter } from "@/components/category-filter";

const CATEGORY_COLORS: Record<string, string> = {
  "200km": "#22d3ee",
  "100km": "#4ade80",
  "50km": "#fb923c",
};

interface StabilityRankingProps {
  category: CategoryFilter;
}

export function StabilityRanking({ category }: StabilityRankingProps) {
  const allData = results as unknown as AthleteResult[];

  const ranking = useMemo(() => {
    const base = category === "ALL"
      ? allData
      : allData.filter((r) => r.category === category);

    const finished = base.filter(
      (r) => r.status === "finished" && r.lapTimes.length > 1
    );

    const withCV = finished.map((r) => {
      const lapMins = r.lapTimes.map((l) => lapTimeToMinutes(l.time));
      const cv = calcCV(lapMins);
      return {
        no: r.no,
        name: r.name,
        category: r.category,
        totalTime: r.totalTime ?? "-",
        cv,
      };
    });

    withCV.sort((a, b) => a.cv - b.cv);
    return withCV.slice(0, 10);
  }, [allData, category]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>安定性ランキング TOP10</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          変動係数(CV)が低いほどラップタイムが安定していることを示します
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">順位</TableHead>
              <TableHead className="w-14">No.</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead className="text-right">CV(%)</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>タイム</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((r, i) => (
              <TableRow key={r.no}>
                <TableCell className="font-bold">{i + 1}</TableCell>
                <TableCell>{r.no}</TableCell>
                <TableCell>
                  <Link
                    href={`/athletes/${r.no}`}
                    className="underline decoration-muted-foreground/30 hover:decoration-foreground transition-colors"
                  >
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.cv.toFixed(2)}
                </TableCell>
                <TableCell>
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[r.category]}20`,
                      color: CATEGORY_COLORS[r.category],
                    }}
                  >
                    {r.category}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">
                  {r.totalTime !== "-" ? formatTime(r.totalTime) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
