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
    sport: "Cycling Time Trial",
    description:
      "第11回しろさとTT200（自転車タイムトライアル）の全選手リザルト・ラップタイムをBIダッシュボードで徹底分析。",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
