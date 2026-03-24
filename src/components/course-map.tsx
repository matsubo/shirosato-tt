"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const STRAVA_SEGMENT = "https://www.strava.com/segments/27682873";

// Shirosato Test Center oval course coordinates (approximated from Strava/OSM)
const COURSE_COORDS: [number, number][] = [
  [36.4825, 140.3095],
  [36.4830, 140.3105],
  [36.4835, 140.3118],
  [36.4838, 140.3132],
  [36.4839, 140.3148],
  [36.4838, 140.3165],
  [36.4835, 140.3180],
  [36.4830, 140.3192],
  [36.4822, 140.3200],
  [36.4812, 140.3205],
  [36.4800, 140.3208],
  [36.4788, 140.3210],
  [36.4775, 140.3212],
  [36.4762, 140.3213],
  [36.4748, 140.3214],
  [36.4735, 140.3214],
  [36.4722, 140.3213],
  [36.4710, 140.3212],
  [36.4698, 140.3210],
  [36.4686, 140.3207],
  [36.4675, 140.3202],
  [36.4665, 140.3195],
  [36.4658, 140.3185],
  [36.4653, 140.3172],
  [36.4651, 140.3158],
  [36.4650, 140.3142],
  [36.4651, 140.3126],
  [36.4654, 140.3112],
  [36.4660, 140.3100],
  [36.4668, 140.3090],
  [36.4678, 140.3083],
  [36.4690, 140.3078],
  [36.4703, 140.3075],
  [36.4716, 140.3073],
  [36.4730, 140.3072],
  [36.4744, 140.3072],
  [36.4758, 140.3073],
  [36.4772, 140.3075],
  [36.4785, 140.3078],
  [36.4798, 140.3082],
  [36.4810, 140.3088],
  [36.4820, 140.3094],
  [36.4825, 140.3095],
];

const CENTER: [number, number] = [36.4745, 140.3143];

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
      // Import CSS
      import("leaflet/dist/leaflet.css");

      if (!mapRef.current) return;

      map = L.map(mapRef.current, {
        center: CENTER,
        zoom: 14,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      L.polyline(COURSE_COORDS, {
        color: "#fbbf24",
        weight: 4,
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
