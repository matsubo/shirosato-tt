"use client";

import type { CategoryFilter } from "@/components/category-filter";
import { LapChart } from "@/components/lap-chart";
import { Top10TableContent } from "@/components/top10-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Top10WithLapProps {
  category: CategoryFilter;
}

export function Top10WithLap({ category }: Top10WithLapProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>TOP10</CardTitle>
        </CardHeader>
        <CardContent>
          <Top10TableContent category={category} />
        </CardContent>
      </Card>
      <LapChart category={category} />
    </div>
  );
}
