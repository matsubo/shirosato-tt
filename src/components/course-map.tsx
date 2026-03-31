"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STRAVA_SEGMENT = "https://www.strava.com/segments/27682873";

// JARI Shirosato Test Center high-speed oval course
// Source: OpenStreetMap Way 199283899 (maxspeed=190, lanes=3, oneway=yes)
const COURSE_COORDS: [number, number][] = [
  [36.4771782, 140.3274199],
  [36.4878056, 140.3194427],
  [36.4881006, 140.3191893],
  [36.4883906, 140.3189237],
  [36.4886623, 140.3186381],
  [36.4889093, 140.3183243],
  [36.4891378, 140.3179756],
  [36.4893373, 140.3175947],
  [36.4895023, 140.3171937],
  [36.489636, 140.3167739],
  [36.4897287, 140.3163502],
  [36.4897912, 140.3159103],
  [36.4898171, 140.315461],
  [36.4898085, 140.3150064],
  [36.4897567, 140.3145491],
  [36.4896726, 140.3141078],
  [36.48954, 140.313672],
  [36.4893837, 140.3132576],
  [36.4891896, 140.3128713],
  [36.4889696, 140.3125159],
  [36.4887238, 140.3121968],
  [36.4884586, 140.3119111],
  [36.4881664, 140.3116536],
  [36.487858, 140.3114364],
  [36.4875485, 140.3112634],
  [36.4872089, 140.3111252],
  [36.4868563, 140.311026],
  [36.4864886, 140.310975],
  [36.4861156, 140.310967],
  [36.4857306, 140.3110099],
  [36.4853478, 140.3111064],
  [36.4849629, 140.3112553],
  [36.4846092, 140.3114377],
  [36.4842567, 140.3116566],
  [36.4827226, 140.312805],
  [36.4790561, 140.3155494],
  [36.4731884, 140.3199411],
  [36.4728714, 140.3202099],
  [36.4725705, 140.3204955],
  [36.4722879, 140.3207999],
  [36.4720334, 140.3211232],
  [36.4717972, 140.3215054],
  [36.4715923, 140.3219198],
  [36.4714263, 140.322365],
  [36.4712936, 140.3228331],
  [36.4712116, 140.3233266],
  [36.4711707, 140.3238308],
  [36.4711771, 140.3243431],
  [36.4712311, 140.3248662],
  [36.4713324, 140.3253503],
  [36.4714823, 140.3258291],
  [36.4716721, 140.3262797],
  [36.4718954, 140.3267129],
  [36.4721477, 140.3270522],
  [36.4724179, 140.32737],
  [36.4727193, 140.3276624],
  [36.4730488, 140.3279038],
  [36.4733696, 140.3280929],
  [36.4737028, 140.3282377],
  [36.4740544, 140.3283437],
  [36.4744103, 140.3284121],
  [36.4747726, 140.3284255],
  [36.4751328, 140.3284],
  [36.4754941, 140.3283249],
  [36.4758456, 140.3282069],
  [36.4761983, 140.3280526],
  [36.4765261, 140.3278595],
  [36.4768518, 140.3276476],
  [36.4771782, 140.3274199],
];

const CENTER: [number, number] = [36.4805, 140.3197];

export function CourseMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    let map: L.Map;

    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      if (!mapRef.current) return;

      map = L.map(mapRef.current, {
        center: CENTER,
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      L.polyline(COURSE_COORDS, {
        color: "#fbbf24",
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1,
      }).addTo(map);
    });

    return () => {
      if (map) map.remove();
    };
  }, [mounted]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          コース
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapRef} className="h-[220px] w-full" />
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
          <span>1周 5.67km / 獲得標高 18m / フラット</span>
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
