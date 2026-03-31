import { DashboardClient } from "@/components/dashboard-client";
import race from "@/data/race.json";
import type { RaceMetadata } from "@/lib/types";

export default function Home() {
  const raceData = race as unknown as RaceMetadata;

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      {/* Header — rendered as static HTML for SEO */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{raceData.raceName}</h1>
        <p className="mt-1 text-muted-foreground">
          {raceData.date} {raceData.location} / {raceData.weather.condition}{" "}
          {raceData.weather.temperature}&#8451; 湿度{raceData.weather.humidity}%{" "}
          {raceData.weather.wind}
        </p>
      </div>

      {/* Interactive dashboard */}
      <DashboardClient />
    </main>
  );
}
