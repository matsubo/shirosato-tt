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
import { PacingWaterfall } from "@/components/pacing-waterfall";
import { timeToSeconds } from "@/lib/time-utils";
import { mean } from "@/lib/stats";

const allAthletes = results as AthleteResult[];
const raceData = race as RaceMetadata;
const commentsData = comments as Record<string, string>;

export function generateStaticParams() {
  return allAthletes.map((a) => ({
    no: String(a.no),
  }));
}

const siteUrl = "https://shirosato-tt-2026.teraren.com";

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
    const title = `${athlete.name} No.${athlete.no}${timeStr}${statusStr} | しろさとTT200`;
    const rankStr = typeof athlete.rank === "number" ? `総合${athlete.rank}位` : athlete.status;
    const desc = athlete.totalTime
      ? `${athlete.name}（${athlete.age}歳・${athlete.prefecture}）の${athlete.category}レース分析。${rankStr}、タイム${athlete.totalTime}、平均速度${athlete.avgSpeed}km/h。ラップ推移・偏差値・ペーシング・CdA推定を詳細に可視化。`
      : `${athlete.name}（${athlete.age}歳・${athlete.prefecture}）の${athlete.category}レース情報。`;

    return {
      title,
      description: desc,
      alternates: {
        canonical: `${siteUrl}/athletes/${athlete.no}`,
      },
      openGraph: {
        title,
        description: desc,
        images: [
          {
            url: `${siteUrl}/og-image.png`,
            width: 1200,
            height: 630,
            alt: "第11回 しろさとTT200 Race Analytics Dashboard",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [`${siteUrl}/og-image.png`],
      },
    };
  });
}

function getCategoryAvgLaps(
  category: string,
  maxLaps: number
): number[] {
  const finished = allAthletes.filter(
    (a) =>
      a.category === category &&
      a.status === "finished" &&
      a.lapTimes.length > 0
  );

  const avgLaps: number[] = [];
  for (let lap = 1; lap <= maxLaps; lap++) {
    const times = finished
      .map((a) => {
        const lt = a.lapTimes.find((l) => l.lap === lap);
        return lt ? timeToSeconds(lt.time) : null;
      })
      .filter((t): t is number => t !== null);
    avgLaps.push(times.length > 0 ? mean(times) : 0);
  }
  return avgLaps;
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
  const hasLaps = athlete.lapTimes.length > 0;
  const isFinished = athlete.status === "finished" || athlete.status === "OPEN";

  const comment = commentsData[String(athlete.no)];

  // Category average laps for comparison
  const categoryAvgLaps = hasLaps
    ? getCategoryAvgLaps(athlete.category, athlete.lapTimes.length)
    : undefined;

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
                <SingleLapChart
                  athlete={athlete}
                  categoryAvgLaps={categoryAvgLaps}
                />
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

            {/* Pacing Waterfall */}
            <PacingWaterfall athlete={athlete} />

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
