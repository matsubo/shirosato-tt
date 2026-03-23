import race from "@/data/race.json";
import results from "@/data/results.json";

export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: race.raceName,
    startDate: race.date,
    location: {
      "@type": "Place",
      name: race.location,
      address: {
        "@type": "PostalAddress",
        addressRegion: "茨城県",
        addressCountry: "JP",
      },
    },
    numberOfParticipants: results.length,
    sport: "Cycling",
    description:
      "しろさとTT200のレースデータを可視化するBIダッシュボード。ラップタイム分析、チーム比較、走行パフォーマンスを提供します。",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
