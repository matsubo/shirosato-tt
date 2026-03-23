"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
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
import { formatTime } from "@/lib/time-utils";

const CATEGORY_COLORS: Record<string, string> = {
  "200km": "#22d3ee",
  "100km": "#4ade80",
  "50km": "#fb923c",
};

const CATEGORIES = ["全て", "200km", "100km", "50km"] as const;

export function AthleteSearch() {
  const data = results as unknown as AthleteResult[];
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("全て");

  const filtered = useMemo(() => {
    let list = [...data];

    if (categoryFilter !== "全て") {
      list = list.filter((r) => r.category === categoryFilter);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          String(r.no).includes(q)
      );
    }

    list.sort((a, b) => {
      if (a.category !== b.category) {
        const order = { "200km": 0, "100km": 1, "50km": 2 };
        return (order[a.category] ?? 0) - (order[b.category] ?? 0);
      }
      const ra = typeof a.rank === "number" ? a.rank : 9999;
      const rb = typeof b.rank === "number" ? b.rank : 9999;
      return ra - rb;
    });

    return list;
  }, [data, query, categoryFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>選手検索</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="氏名またはNo.で検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={
                  categoryFilter === cat && cat !== "全て"
                    ? {
                        backgroundColor: CATEGORY_COLORS[cat],
                        color: "#000",
                      }
                    : undefined
                }
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length}件
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">No.</TableHead>
                <TableHead>氏名</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead className="w-14">順位</TableHead>
                <TableHead>タイム</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={`${r.no}-${r.category}`}>
                  <TableCell>{r.no}</TableCell>
                  <TableCell>
                    <Link
                      href={`/athletes/${r.no}`}
                      className="underline decoration-muted-foreground/30 hover:decoration-foreground transition-colors"
                    >
                      {r.name}
                    </Link>
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
                    {typeof r.rank === "number" ? r.rank : r.rank}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {r.totalTime ? formatTime(r.totalTime) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
