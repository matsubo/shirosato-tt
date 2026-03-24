import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

// Shirosato Test Center coordinates
const LAT = 36.478;
const LNG = 140.318;
const ZOOM = 14;

// Strava segment for reference
const STRAVA_SEGMENT = "https://www.strava.com/segments/27682873";

export function CourseMap() {
  // OpenStreetMap embed
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${LNG - 0.015}%2C${LAT - 0.008}%2C${LNG + 0.015}%2C${LAT + 0.008}&layer=mapnik&marker=${LAT}%2C${LNG}`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          コース
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          src={osmUrl}
          className="h-[200px] w-full border-0"
          loading="lazy"
          title="城里テストセンター コースマップ"
        />
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
          <span>城里テストセンター / 1周 5.67km / 獲得標高 18m</span>
          <a
            href={STRAVA_SEGMENT}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            Strava
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
