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
import { timeToSeconds, lapTimeToMinutes, formatTime } from "@/lib/time-utils";
import { calcCV, calcDeviation, mean } from "@/lib/stats";
import type { CategoryFilter } from "@/components/category-filter";

interface PerformanceRankingProps {
  category: CategoryFilter;
}

function computeForCategory(
  allData: AthleteResult[],
  cat: "200km" | "100km" | "50km"
) {
  const catFinished = allData.filter(
    (r) =>
      r.category === cat &&
      (r.status === "finished" || r.status === "OPEN") &&
      r.lapTimes &&
      r.lapTimes.length > 1 &&
      r.totalTime
  );
  if (catFinished.length === 0) return [];

  const totalTimes = catFinished.map((r) => timeToSeconds(r.totalTime!));
  const laps = catFinished.length;

  const catData = catFinished.map((r) => {
    const lapMins = r.lapTimes.map((l: { time: string }) =>
      lapTimeToMinutes(l.time)
    );
    const cv = calcCV(lapMins);
    const totalSec = timeToSeconds(r.totalTime!);

    // 後半維持率: 後半平均 / 前半平均 (1.0に近いほど良い)
    const halfPoint = Math.floor(lapMins.length / 2);
    const firstHalf = mean(lapMins.slice(0, halfPoint));
    const secondHalf = mean(lapMins.slice(halfPoint));
    const retentionRatio = firstHalf > 0 ? secondHalf / firstHalf : 1;

    return {
      no: r.no,
      name: r.name,
      category: r.category,
      totalTime: r.totalTime!,
      avgSpeed: r.avgSpeed ?? 0,
      cv,
      retentionRatio,
      totalSec,
    };
  });

  // 各メトリクスの偏差値を計算
  const allTotalSec = catData.map((d) => d.totalSec);
  const allCV = catData.map((d) => d.cv);
  const allRetention = catData.map((d) => Math.abs(1 - d.retentionRatio)); // 1.0からの乖離

  return catData.map((d) => {
    // タイム偏差値 (低いほど良い → 反転)
    const timeScore = calcDeviation(d.totalSec, allTotalSec);
    // 安定性偏差値 (CVが低いほど良い → 反転)
    const stabilityScore = calcDeviation(d.cv, allCV);
    // 後半維持偏差値 (1.0からの乖離が小さいほど良い → 反転)
    const retentionScore = calcDeviation(
      Math.abs(1 - d.retentionRatio),
      allRetention
    );

    // 総合スコア: タイム50% + 安定性25% + 後半維持25%
    const overallScore =
      timeScore * 0.5 + stabilityScore * 0.25 + retentionScore * 0.25;

    return {
      ...d,
      timeScore: Math.round(timeScore * 10) / 10,
      stabilityScore: Math.round(stabilityScore * 10) / 10,
      retentionScore: Math.round(retentionScore * 10) / 10,
      overallScore: Math.round(overallScore * 10) / 10,
    };
  });
}

export function StabilityRanking({ category }: PerformanceRankingProps) {
  const allData = results as unknown as AthleteResult[];

  const ranking = useMemo(() => {
    const all = computeForCategory(allData, category);
    all.sort((a, b) => b.overallScore - a.overallScore);
    return all.slice(0, 10);
  }, [allData, category]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>総合パフォーマンスランキング TOP10</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          タイム(50%) + ラップ安定性(25%) + 後半維持率(25%)
          の加重スコアでカテゴリ内評価
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead className="text-right">総合</TableHead>
              <TableHead className="text-right">タイム</TableHead>
              <TableHead className="text-right">安定性</TableHead>
              <TableHead className="text-right">維持率</TableHead>
              <TableHead>タイム</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((r, i) => (
              <TableRow key={`${r.category}-${r.no}`}>
                <TableCell className="font-bold">
                  {i < 3 ? (
                    <span
                      className={
                        i === 0
                          ? "text-yellow-400"
                          : i === 1
                            ? "text-gray-300"
                            : "text-orange-400"
                      }
                    >
                      {i + 1}
                    </span>
                  ) : (
                    i + 1
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/athletes/${r.no}`}
                    className="underline decoration-muted-foreground/30 hover:decoration-foreground transition-colors"
                  >
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums font-bold text-primary">
                  {r.overallScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-xs">
                  {r.timeScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-xs">
                  {r.stabilityScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-xs">
                  {r.retentionScore.toFixed(1)}
                </TableCell>
                <TableCell className="tabular-nums text-xs">
                  {formatTime(r.totalTime)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
