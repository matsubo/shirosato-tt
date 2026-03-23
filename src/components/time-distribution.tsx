"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds } from "@/lib/time-utils";
import type { CategoryFilter } from "@/components/category-filter";

const CATEGORY_CONFIG: Record<
  string,
  { color: string; binMinutes: number; startHours: number; endHours: number }
> = {
  "200km": { color: "#22d3ee", binMinutes: 15, startHours: 4.5, endHours: 9 },
  "100km": { color: "#4ade80", binMinutes: 10, startHours: 2, endHours: 5 },
  "50km": { color: "#fb923c", binMinutes: 5, startHours: 1, endHours: 3 },
};

function buildBins(
  category: string,
  data: AthleteResult[]
) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return [];

  const finished = data.filter(
    (r) => r.category === category && r.status === "finished" && r.totalTime
  );
  const times = finished.map((r) => timeToSeconds(r.totalTime!) / 60);

  const bins: Array<{ label: string; count: number }> = [];
  const startMin = config.startHours * 60;
  const endMin = config.endHours * 60;

  for (let m = startMin; m < endMin; m += config.binMinutes) {
    const low = m;
    const high = m + config.binMinutes;
    const count = times.filter((t) => t >= low && t < high).length;
    const lH = Math.floor(low / 60);
    const lM = low % 60;
    const hH = Math.floor(high / 60);
    const hM = high % 60;
    const label = `${lH}:${String(lM).padStart(2, "0")}-${hH}:${String(hM).padStart(2, "0")}`;
    bins.push({ label, count });
  }

  return bins.filter(
    (_, i, arr) =>
      arr.slice(0, i + 1).some((b) => b.count > 0) &&
      arr.slice(i).some((b) => b.count > 0)
  );
}

function CategoryChart({ category }: { category: string }) {
  const data = useMemo(
    () => buildBins(category, results as unknown as AthleteResult[]),
    [category]
  );
  const config = CATEGORY_CONFIG[category];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "currentColor" }}
          angle={-45}
          textAnchor="end"
          height={60}
          stroke="currentColor"
        />
        <YAxis
          tick={{ fontSize: 12, fill: "currentColor" }}
          allowDecimals={false}
          stroke="currentColor"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover, 220 20% 14%))",
            border: "1px solid hsl(var(--border, 220 20% 25%))",
            borderRadius: "8px",
            color: "inherit",
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="count"
            position="top"
            style={{ fontSize: 11, fill: "currentColor" }}
            formatter={(v: unknown) => (Number(v) > 0 ? String(v) : "")}
          />
          {data.map((_, index) => (
            <Cell key={index} fill={config.color} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface TimeDistributionProps {
  category: CategoryFilter;
}

export function TimeDistribution({ category }: TimeDistributionProps) {
  const [active, setActive] = useState<string | number>("200km");

  // When a specific category is selected, show only that category
  if (category !== "ALL") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>タイム分布</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryChart category={category} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>タイム分布</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={active} onValueChange={setActive} defaultValue="200km">
          <TabsList>
            <TabsTrigger value="200km" style={{ color: active === "200km" ? "#22d3ee" : undefined }}>
              200km
            </TabsTrigger>
            <TabsTrigger value="100km" style={{ color: active === "100km" ? "#4ade80" : undefined }}>
              100km
            </TabsTrigger>
            <TabsTrigger value="50km" style={{ color: active === "50km" ? "#fb923c" : undefined }}>
              50km
            </TabsTrigger>
          </TabsList>
          <TabsContent value="200km">
            <CategoryChart category="200km" />
          </TabsContent>
          <TabsContent value="100km">
            <CategoryChart category="100km" />
          </TabsContent>
          <TabsContent value="50km">
            <CategoryChart category="50km" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
