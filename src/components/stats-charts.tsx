"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import { timeToSeconds } from "@/lib/time-utils";
import { calcDeviation } from "@/lib/stats";
import type { CategoryFilter } from "@/components/category-filter";

const GENDER_COLORS = ["#60a5fa", "#f472b6"];

const AGE_DECADE_ORDER = ["10代", "20代", "30代", "40代", "50代", "60代", "70代"];

const AGE_COLORS: Record<string, string> = {
  "10代": "#f472b6",
  "20代": "#fb923c",
  "30代": "#facc15",
  "40代": "#4ade80",
  "50代": "#22d3ee",
  "60代": "#818cf8",
  "70代": "#a78bfa",
};

function extractDecade(ageCategory: string): string {
  const match = ageCategory.match(/^(\d+代)/);
  return match ? match[1] : ageCategory;
}

function filterByCategory(data: AthleteResult[], category: CategoryFilter): AthleteResult[] {
  if (category === "ALL") return data;
  return data.filter((r) => r.category === category);
}

function GenderRatioChart({ category }: { category: CategoryFilter }) {
  const allData = results as unknown as AthleteResult[];

  const genderData = useMemo(() => {
    const data = filterByCategory(allData, category);
    const male = data.filter((r) => r.gender === "男").length;
    const female = data.filter((r) => r.gender === "女").length;
    return [
      { name: "男性", value: male },
      { name: "女性", value: female },
    ];
  }, [allData, category]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>男女比</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={genderData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
              stroke="none"
            >
              {genderData.map((_, i) => (
                <Cell key={i} fill={GENDER_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover, 220 20% 14%))",
                border: "1px solid hsl(var(--border, 220 20% 25%))",
                borderRadius: "8px",
                color: "inherit",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AgeDistributionChart({ category }: { category: CategoryFilter }) {
  const allData = results as unknown as AthleteResult[];

  const chartData = useMemo(() => {
    const data = filterByCategory(allData, category);
    const counts: Record<string, number> = {};
    for (const r of data) {
      if (!r.ageCategory) continue;
      const decade = extractDecade(r.ageCategory);
      counts[decade] = (counts[decade] ?? 0) + 1;
    }
    return AGE_DECADE_ORDER.filter((d) => counts[d]).map((decade) => ({
      name: decade,
      count: counts[decade] ?? 0,
    }));
  }, [allData, category]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>年代別分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor" }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 12, fill: "currentColor" }} stroke="currentColor" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover, 220 20% 14%))",
                border: "1px solid hsl(var(--border, 220 20% 25%))",
                borderRadius: "8px",
                color: "inherit",
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={AGE_COLORS[entry.name] ?? "#a78bfa"} />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                style={{ fontSize: 11, fill: "currentColor" }}
                formatter={(v: unknown) => (Number(v) > 0 ? String(v) : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function PrefectureDistributionChart({ category }: { category: CategoryFilter }) {
  const allData = results as unknown as AthleteResult[];

  const chartData = useMemo(() => {
    const data = filterByCategory(allData, category);
    const counts: Record<string, number> = {};
    for (const r of data) {
      if (!r.prefecture) continue;
      counts[r.prefecture] = (counts[r.prefecture] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));
  }, [allData, category]);

  return (
    <Card className="sm:col-span-2">
      <CardHeader>
        <CardTitle>都道府県別参加者数（上位15）</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 60, bottom: 0 }}
          >
            <XAxis type="number" tick={{ fontSize: 12, fill: "currentColor" }} stroke="currentColor" allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "currentColor" }}
              stroke="currentColor"
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover, 220 20% 14%))",
                border: "1px solid hsl(var(--border, 220 20% 25%))",
                borderRadius: "8px",
                color: "inherit",
              }}
            />
            <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]}>
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 11, fill: "currentColor" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DeviationDistributionChart({ category }: { category: CategoryFilter }) {
  const allData = results as unknown as AthleteResult[];

  const chartData = useMemo(() => {
    const categoriesToProcess: Array<"200km" | "100km" | "50km"> =
      category === "ALL"
        ? ["200km", "100km", "50km"]
        : [category];

    const allDeviations: Array<{ deviation: number; category: string }> = [];

    for (const cat of categoriesToProcess) {
      const finished = allData.filter(
        (r) => r.category === cat && r.status === "finished" && r.totalTime
      );
      const times = finished.map((r) => timeToSeconds(r.totalTime!));
      for (const r of finished) {
        const dev = calcDeviation(timeToSeconds(r.totalTime!), times);
        allDeviations.push({ deviation: dev, category: cat });
      }
    }

    const bins: Array<{ label: string; count: number }> = [];
    for (let d = 20; d < 80; d += 5) {
      const count = allDeviations.filter(
        (v) => v.deviation >= d && v.deviation < d + 5
      ).length;
      bins.push({ label: `${d}-${d + 5}`, count });
    }

    return bins;
  }, [allData, category]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>偏差値分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 12, fill: "currentColor" }} stroke="currentColor" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover, 220 20% 14%))",
                border: "1px solid hsl(var(--border, 220 20% 25%))",
                borderRadius: "8px",
                color: "inherit",
              }}
            />
            <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="count"
                position="top"
                style={{ fontSize: 11, fill: "currentColor" }}
                formatter={(v: unknown) => (Number(v) > 0 ? String(v) : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface StatsChartsProps {
  category: CategoryFilter;
}

export function StatsCharts({ category }: StatsChartsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <GenderRatioChart category={category} />
      <AgeDistributionChart category={category} />
      <DeviationDistributionChart category={category} />
      <PrefectureDistributionChart category={category} />
    </div>
  );
}
