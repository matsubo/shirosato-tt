"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Top10TableContent } from "@/components/top10-table";
import { LapChart } from "@/components/lap-chart";
import type { CategoryFilter } from "@/components/category-filter";

const CATEGORY_COLORS: Record<string, string> = {
  "200km": "#22d3ee",
  "100km": "#4ade80",
  "50km": "#fb923c",
};

interface Top10WithLapProps {
  category: CategoryFilter;
}

export function Top10WithLap({ category }: Top10WithLapProps) {
  const [internalCategory, setInternalCategory] = useState<string | number>("200km");

  // When a specific category is selected globally, show only that category (no tabs)
  if (category !== "ALL") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              TOP10{" "}
              <span style={{ color: CATEGORY_COLORS[category] }}>{category}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Top10TableContent category={category} />
          </CardContent>
        </Card>
        <LapChart category={category} />
      </div>
    );
  }

  return (
    <Tabs value={internalCategory} onValueChange={setInternalCategory} defaultValue="200km">
      <TabsList>
        <TabsTrigger
          value="200km"
          style={{ color: internalCategory === "200km" ? "#22d3ee" : undefined }}
        >
          200km
        </TabsTrigger>
        <TabsTrigger
          value="100km"
          style={{ color: internalCategory === "100km" ? "#4ade80" : undefined }}
        >
          100km
        </TabsTrigger>
        <TabsTrigger
          value="50km"
          style={{ color: internalCategory === "50km" ? "#fb923c" : undefined }}
        >
          50km
        </TabsTrigger>
      </TabsList>
      {(["200km", "100km", "50km"] as const).map((cat) => (
        <TabsContent key={cat} value={cat}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  TOP10{" "}
                  <span style={{ color: CATEGORY_COLORS[cat] }}>{cat}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Top10TableContent category={cat} />
              </CardContent>
            </Card>
            <LapChart category={cat} />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
