import { Card, CardContent } from "@/components/ui/card";
import results from "@/data/results.json";
import type { AthleteResult } from "@/lib/types";
import type { CategoryFilter } from "@/components/category-filter";

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

interface KpiCardsProps {
  category: CategoryFilter;
}

export function KpiCards({ category }: KpiCardsProps) {
  const allData = results as unknown as AthleteResult[];
  const data = allData.filter((r) => r.category === category);

  const total = data.length;
  const finishers = data.filter((r) => r.status === "finished").length;
  const finishRate = total > 0 ? ((finishers / total) * 100).toFixed(1) : "0.0";
  const dnfCount = data.filter((r) => r.status === "DNF").length;

  const categoriesToShow: Array<"200km" | "100km" | "50km"> = [category];

  const fastestByCategory = categoriesToShow.map((cat) => {
    const finished = allData.filter(
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

  const gridCols = "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5";

  return (
    <div className={`grid gap-3 ${gridCols}`}>
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
