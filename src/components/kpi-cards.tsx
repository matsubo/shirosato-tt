import { Card, CardContent } from "@/components/ui/card";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  "200km": "#22d3ee",
  "100km": "#4ade80",
  "50km": "#fb923c",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  accent?: string;
  sub?: string;
}

function KpiCard({ label, value, accent, sub }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 ring-1 ring-foreground/10">
      {accent && (
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: accent }}
        />
      )}
      <CardContent className="pt-4 text-center">
        <p
          className="text-3xl font-bold tabular-nums"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        {sub && (
          <p className="mt-0.5 text-xs text-muted-foreground/70">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiCards() {
  const data = results as unknown as AthleteResult[];

  const total = data.length;
  const finishers = data.filter((r) => r.status === "finished").length;
  const finishRate = ((finishers / total) * 100).toFixed(1);
  const dnfCount = data.filter((r) => r.status === "DNF").length;

  const categories: Array<"200km" | "100km" | "50km"> = [
    "200km",
    "100km",
    "50km",
  ];

  const fastestByCategory = categories.map((cat) => {
    const finished = data.filter(
      (r) => r.category === cat && r.status === "finished" && typeof r.rank === "number"
    );
    finished.sort((a, b) => {
      const ra = typeof a.rank === "number" ? a.rank : Infinity;
      const rb = typeof b.rank === "number" ? b.rank : Infinity;
      return ra - rb;
    });
    const fastest = finished[0];
    return {
      category: cat,
      time: fastest?.totalTime ?? "-",
      name: fastest?.name ?? "-",
    };
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <KpiCard label="参加者数" value={total} />
      <KpiCard label="完走者数" value={finishers} />
      <KpiCard label="完走率" value={`${finishRate}%`} />
      <KpiCard label="DNF数" value={dnfCount} accent="#ef4444" />
      {fastestByCategory.map((f) => (
        <KpiCard
          key={f.category}
          label={`最速 ${f.category}`}
          value={f.time ?? "-"}
          accent={CATEGORY_COLORS[f.category]}
          sub={f.name}
        />
      ))}
    </div>
  );
}
