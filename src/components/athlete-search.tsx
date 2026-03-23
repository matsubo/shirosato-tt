"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { formatTime } from "@/lib/time-utils";
import type { CategoryFilter } from "@/components/category-filter";

const CATEGORY_COLORS: Record<string, string> = {
  "200km": "#22d3ee",
  "100km": "#4ade80",
  "50km": "#fb923c",
};

const CATEGORIES = ["全て", "200km", "100km", "50km"] as const;
const PAGE_SIZE = 20;

interface AthleteSearchProps {
  category: CategoryFilter;
}

export function AthleteSearch({ category }: AthleteSearchProps) {
  const allData = results as unknown as AthleteResult[];
  const [query, setQuery] = useState("");
  const [localCategoryFilter, setLocalCategoryFilter] = useState<string>("全て");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let list = [...allData];

    if (category !== "ALL") {
      list = list.filter((r) => r.category === category);
    } else if (localCategoryFilter !== "全て") {
      list = list.filter((r) => r.category === localCategoryFilter);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) || String(r.no).includes(q)
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
  }, [allData, query, localCategoryFilter, category]);

  // Reset page when filters change
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setPage(0);
  };

  const handleCategoryChange = (cat: string) => {
    setLocalCategoryFilter(cat);
    setPage(0);
  };

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
            onChange={(e) => handleQueryChange(e.target.value)}
            className="max-w-xs"
          />
          {category === "ALL" && (
            <div className="flex gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    localCategoryFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  style={
                    localCategoryFilter === cat && cat !== "全て"
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
          )}
          <span className="text-xs text-muted-foreground">
            {filtered.length}件
          </span>
        </div>

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
            {paged.map((r) => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {currentPage * PAGE_SIZE + 1} - {Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}件
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i;
                } else if (currentPage < 3) {
                  pageNum = i;
                } else if (currentPage > totalPages - 4) {
                  pageNum = totalPages - 7 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
