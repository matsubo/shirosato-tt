import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import results from "@/data/results.json";
import race from "@/data/race.json";
import comments from "@/data/comments.json";
import type { AthleteResult, RaceMetadata } from "@/lib/types";
import { AthleteProfile } from "@/components/athlete-profile";
import { RadarChartComponent } from "@/components/radar-chart";
import { PacingAnalysis } from "@/components/pacing-analysis";
import { LapStability } from "@/components/lap-stability";
import { PercentileBar } from "@/components/percentile-bar";
import { CdACalculator } from "@/components/cda-calculator";
import { AiComment } from "@/components/ai-comment";
import { SingleLapChart } from "@/components/single-lap-chart";

const allAthletes = results as AthleteResult[];
const raceData = race as RaceMetadata;
const commentsData = comments as Record<string, string>;

export function generateStaticParams() {
  return allAthletes.map((a) => ({
    no: String(a.no),
  }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ no: string }>;
}): Promise<Metadata> {
  return params.then(({ no }) => {
    const athlete = allAthletes.find((a) => a.no === Number(no));
    if (!athlete) {
      return { title: "選手が見つかりません" };
    }
    const timeStr = athlete.totalTime ? ` - ${athlete.totalTime}` : "";
    const statusStr =
      athlete.status === "DNF"
        ? " (DNF)"
        : athlete.status === "DNS"
          ? " (DNS)"
          : "";
    return {
      title: `${athlete.name} No.${athlete.no}${timeStr}${statusStr} | しろさとTT200`,
    };
  });
}

export default async function AthletePage({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const { no } = await params;
  const athlete = allAthletes.find((a) => a.no === Number(no));

  if (!athlete) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-lg text-muted-foreground">選手が見つかりません</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>
      </main>
    );
  }

  const categoryAthletes = allAthletes.filter(
    (a) => a.category === athlete.category
  );
  const finishedInCategory = categoryAthletes.filter(
    (a) => a.status === "finished" || a.status === "OPEN"
  );

  const categoryRank = { total: finishedInCategory.length };

  const genderFinished = finishedInCategory.filter(
    (a) => a.gender === athlete.gender
  );
  let genderRank: { rank: number; total: number } | undefined;
  if (
    typeof athlete.rank === "number" ||
    athlete.status === "finished" ||
    athlete.status === "OPEN"
  ) {
    const sorted = [...genderFinished]
      .filter((a) => a.totalTime)
      .sort((a, b) => {
        const ta = a.totalTime ? a.totalTime : "99:99:99";
        const tb = b.totalTime ? b.totalTime : "99:99:99";
        return ta.localeCompare(tb);
      });
    const idx = sorted.findIndex((a) => a.no === athlete.no);
    if (idx >= 0) {
      genderRank = { rank: idx + 1, total: sorted.length };
    }
  }

  const isDNS = athlete.status === "DNS";
  const isDNF = athlete.status === "DNF";
  const hasLaps = athlete.lapTimes.length > 0;
  const isFinished = athlete.status === "finished" || athlete.status === "OPEN";

  const comment = commentsData[String(athlete.no)];

  return (
    <main className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </Link>

      <div className="space-y-6">
        {/* Profile card */}
        <AthleteProfile
          athlete={athlete}
          race={raceData}
          categoryRank={categoryRank}
          genderRank={genderRank}
        />

        {/* DNS: show profile only */}
        {isDNS && (
          <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
            <span className="inline-flex items-center rounded-md bg-gray-500/20 px-4 py-2 text-lg font-semibold text-gray-400 ring-1 ring-gray-500/30">
              未出走
            </span>
          </div>
        )}

        {/* Charts for athletes with lap data */}
        {hasLaps && (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <SingleLapChart athlete={athlete} />
                <LapStability athlete={athlete} />
              </div>
              <div className="space-y-6">
                {isFinished && (
                  <RadarChartComponent
                    athlete={athlete}
                    categoryAthletes={categoryAthletes}
                    race={raceData}
                  />
                )}
                {hasLaps && <PacingAnalysis athlete={athlete} />}
              </div>
            </div>

            {isFinished && (
              <PercentileBar
                athlete={athlete}
                categoryAthletes={categoryAthletes}
              />
            )}

            {isFinished && (
              <CdACalculator athlete={athlete} race={raceData} />
            )}
          </>
        )}

        {/* AI comment */}
        <AiComment comment={comment} />
      </div>
    </main>
  );
}
