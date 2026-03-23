export type RankValue = number | "OPEN" | "DNF" | "DNS";

export interface RaceMetadata {
  raceName: string;
  date: string;
  location: string;
  weather: Weather;
  categories: Category[];
}

export interface Category {
  name: "200km" | "100km" | "50km";
  distance: number;
  laps: number;
  lapDistance: number;
}

export interface Weather {
  temperature: number;
  humidity: number;
  wind: string;
  condition: string;
}

export interface AthleteResult {
  rank: RankValue;
  no: number;
  name: string;
  age: number;
  gender: "男" | "女";
  prefecture: string;
  category: "200km" | "100km" | "50km";
  status: "finished" | "OPEN" | "DNF" | "DNS";
  totalTime: string | null;
  penalty: number | null;
  maleRank: number | null;
  femaleRank: number | null;
  ageCategory: string;
  categoryRank: number | null;
  avgSpeed: number | null;
  lapTimes: AthleteLaptime[];
  comments?: AthleteComments;
}

export interface AthleteLaptime {
  lap: number;
  time: string;
  splitTime?: string;
}

export interface AthleteComments {
  bike?: string;
  memo?: string;
}

export interface DeviationValues {
  overall: number;
  pace: number;
  consistency: number;
}

export interface CdAParams {
  power: number;
  speed: number;
  airDensity?: number;
  rollingResistance?: number;
  totalWeight?: number;
  gradient?: number;
  drivetrainEfficiency?: number;
}
