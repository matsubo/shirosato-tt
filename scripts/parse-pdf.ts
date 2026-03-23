import fs from "fs";
import path from "path";

const DATA_DIR = path.join(__dirname, "../src/data");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require("pdf-parse");

async function extractText(pdfPath: string): Promise<string> {
  const buffer = fs.readFileSync(pdfPath);
  const pdf = new PDFParse({ data: buffer });
  await pdf.load();
  const result = await pdf.getText();
  return result.pages.map((p: { text: string }) => p.text).join("\n---PAGE---\n");
}

type CategoryName = "200km" | "100km" | "50km";
type Status = "finished" | "OPEN" | "DNF" | "DNS";

interface ParsedResult {
  rank: number | "OPEN" | "DNF" | "DNS";
  bibNumber: number;
  name: string;
  age: number;
  gender: "男" | "女";
  prefecture: string;
  category: CategoryName;
  status: Status;
  totalTime?: string;
  penaltyMinutes?: number;
  maleRank?: number;
  femaleRank?: number;
  ageCategory: string;
  ageCategoryRank?: number;
  averageSpeed?: number;
}

interface ParsedLaptime {
  bibNumber: number;
  name: string;
  lapCount: number;
  totalTime: string;
  penaltyMinutes?: number;
  finalTime: string;
  laps: string[];
}

interface CategoryInfo {
  name: CategoryName;
  distance: number;
  laps: number;
}

function parseCategoryHeader(headerLine: string): CategoryInfo | null {
  // "第11回 しろさとTT200 大会結果 【200km部門(198.32km_35周回)】"
  const match = headerLine.match(/【(\d+)km部門\(([\d.]+)km_(\d+)周回\)】/);
  if (!match) return null;
  return {
    name: `${match[1]}km` as CategoryName,
    distance: parseFloat(match[2]),
    laps: parseInt(match[3]),
  };
}

function parseResultLine(line: string, currentCategory: CategoryName): ParsedResult | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("総合") || trimmed.startsWith("順位") || trimmed.startsWith("女子") || trimmed.startsWith("年齢区分")) return null;
  if (trimmed === "---PAGE---") return null;
  if (trimmed.match(/^第\d+回/)) return null;

  // Split by tab
  const parts = trimmed.split("\t").map(s => s.trim()).filter(s => s !== "");

  if (parts.length < 5) return null;

  let rank: number | "OPEN" | "DNF" | "DNS";
  let status: Status;

  const rankStr = parts[0];
  if (rankStr === "OPEN") {
    rank = "OPEN";
    status = "OPEN";
  } else if (rankStr === "DNF") {
    rank = "DNF";
    status = "DNF";
  } else if (rankStr === "DNS") {
    rank = "DNS";
    status = "DNS";
  } else {
    rank = parseInt(rankStr);
    if (isNaN(rank)) return null;
    status = "finished";
  }

  const bibNumber = parseInt(parts[1]);
  if (isNaN(bibNumber)) return null;

  const name = parts[2];
  const age = parseInt(parts[3]);
  const gender = parts[4] as "男" | "女";
  const prefecture = parts[5];

  let totalTime: string | undefined;
  let penaltyMinutes: number | undefined;
  let maleRank: number | undefined;
  let femaleRank: number | undefined;
  let ageCategory = "";
  let ageCategoryRank: number | undefined;
  let averageSpeed: number | undefined;

  if (status === "finished" || status === "OPEN") {
    // For finished/OPEN entries, parse remaining fields
    // The field layout after prefecture varies depending on penalty minutes and gender ranks
    const remaining = parts.slice(6);

    if (remaining.length === 0) return null;

    // First remaining field should be totalTime (H:MM:SS format)
    if (remaining[0] && remaining[0].match(/^\d+:\d{2}:\d{2}$/)) {
      totalTime = remaining[0];
      const rest = remaining.slice(1);

      // Now parse the rest: optional P分, optional male/female rank, ageCategory, optional ageCategoryRank, averageSpeed
      let idx = 0;

      // Check for penalty minutes (just a number before the rank fields)
      if (rest[idx] && rest[idx].match(/^\d+$/) && !rest[idx].match(/km\/h$/)) {
        const val = parseInt(rest[idx]);
        // Could be P分 or a rank - we need to look ahead
        // If next field is also a number, this might be P分
        // Pattern: [P分] [maleRank] ageCategory [ageCategoryRank] averageSpeed
        // or: [P分] [femaleRank] ageCategory averageSpeed
        // Check if this looks like P minutes (usually small number like 5)
        // Actually, let's look at the ageCategory field to determine
        const ageCatIdx = rest.findIndex(r => r.match(/代[男女]子$/));
        if (ageCatIdx >= 0) {
          // Everything before ageCategory that's a number
          const nums = rest.slice(0, ageCatIdx).filter(r => r.match(/^\d+$/));

          if (gender === "男") {
            if (status === "finished") {
              if (nums.length === 1) {
                maleRank = parseInt(nums[0]);
              } else if (nums.length === 2) {
                // First could be penalty, second is maleRank
                penaltyMinutes = parseInt(nums[0]);
                maleRank = parseInt(nums[1]);
              }
            } else {
              // OPEN - no ranks
              if (nums.length === 1) {
                penaltyMinutes = parseInt(nums[0]);
              }
            }
          } else {
            // Female
            if (status === "finished") {
              if (nums.length === 1) {
                femaleRank = parseInt(nums[0]);
              } else if (nums.length === 2) {
                penaltyMinutes = parseInt(nums[0]);
                femaleRank = parseInt(nums[1]);
              }
            } else {
              if (nums.length === 1) {
                penaltyMinutes = parseInt(nums[0]);
              }
            }
          }

          ageCategory = rest[ageCatIdx];

          // After ageCategory
          const afterAgeCat = rest.slice(ageCatIdx + 1);
          for (const field of afterAgeCat) {
            if (field.match(/km\/h$/)) {
              averageSpeed = parseFloat(field.replace("km/h", ""));
            } else if (field.match(/^\d+$/)) {
              ageCategoryRank = parseInt(field);
            }
          }
        }
      } else {
        // No penalty, look for ageCategory
        const ageCatIdx = rest.findIndex(r => r.match(/代[男女]子$/));
        if (ageCatIdx >= 0) {
          ageCategory = rest[ageCatIdx];
          const afterAgeCat = rest.slice(ageCatIdx + 1);
          for (const field of afterAgeCat) {
            if (field.match(/km\/h$/)) {
              averageSpeed = parseFloat(field.replace("km/h", ""));
            } else if (field.match(/^\d+$/)) {
              ageCategoryRank = parseInt(field);
            }
          }
        }
      }
    }
  } else {
    // DNF/DNS - minimal fields
    const remaining = parts.slice(6);
    // May have penalty minutes then ageCategory
    for (const field of remaining) {
      if (field.match(/代[男女]子$/)) {
        ageCategory = field;
      } else if (field.match(/^\d+$/) && !penaltyMinutes) {
        penaltyMinutes = parseInt(field);
      }
    }
  }

  return {
    rank,
    bibNumber,
    name,
    age,
    gender,
    prefecture,
    category: currentCategory,
    status,
    totalTime,
    penaltyMinutes,
    maleRank,
    femaleRank,
    ageCategory,
    ageCategoryRank,
    averageSpeed,
  };
}

function parseLaptimeLine(line: string): ParsedLaptime | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("No.") || trimmed === "---PAGE---") return null;
  if (trimmed.match(/^第\d+回/)) return null;

  const parts = trimmed.split("\t").map(s => s.trim()).filter(s => s !== "");
  if (parts.length < 4) return null;

  const bibNumber = parseInt(parts[0]);
  if (isNaN(bibNumber)) return null;

  const name = parts[1];
  const lapCount = parseInt(parts[2]);
  if (isNaN(lapCount)) return null;

  const totalTime = parts[3];

  // Determine if there's a penalty field and final time
  // Format: No. name lapCount record [P分] finalTime LAP1 LAP2 ...
  // If P分 exists, parts[4] would be P分, parts[5] would be finalTime
  // Otherwise parts[4] is finalTime
  let penaltyMinutes: number | undefined;
  let finalTime: string;
  let lapStartIdx: number;

  // Check if parts[4] is a small number (penalty) or a time
  if (parts[4] && parts[4].match(/^\d+$/) && parseInt(parts[4]) < 100) {
    penaltyMinutes = parseInt(parts[4]);
    finalTime = parts[5] || totalTime;
    lapStartIdx = 6;
  } else {
    finalTime = parts[4] || totalTime;
    lapStartIdx = 5;
  }

  // For some entries, finalTime might not be a time format - it might be the first lap
  // Check: finalTime should be in H:MM:SS or H:M:SS format
  if (finalTime && !finalTime.match(/^\d+:\d{2}:\d{2}$/)) {
    // No separate final time, this is actually the first lap
    lapStartIdx = 4;
    finalTime = totalTime;
  }

  const laps = parts.slice(lapStartIdx).filter(s => s.match(/^\d+:\d{2}:\d{2}$/));

  return {
    bibNumber,
    name,
    lapCount,
    totalTime,
    penaltyMinutes,
    finalTime,
    laps,
  };
}

function parseResults(text: string): ParsedResult[] {
  const lines = text.split("\n");
  const results: ParsedResult[] = [];
  let currentCategory: CategoryName = "200km";

  for (const line of lines) {
    const catInfo = parseCategoryHeader(line);
    if (catInfo) {
      currentCategory = catInfo.name;
      continue;
    }

    const result = parseResultLine(line, currentCategory);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

function parseLaptimes(text: string): ParsedLaptime[] {
  const lines = text.split("\n");
  const laptimes: ParsedLaptime[] = [];

  for (const line of lines) {
    if (line === "---PAGE---") continue;
    const lt = parseLaptimeLine(line);
    if (lt) {
      laptimes.push(lt);
    }
  }

  return laptimes;
}

function determineCategoryForBib(bib: number): CategoryName {
  if (bib < 200) return "200km";
  if (bib < 300) return "100km";
  return "50km";
}

function buildAthleteResults(
  results: ParsedResult[],
  laptimeMap: Map<number, ParsedLaptime>
): object[] {
  return results.map(r => {
    const lt = laptimeMap.get(r.bibNumber);
    const lapTimes = lt
      ? lt.laps.map((time, i) => ({
          lap: i + 1,
          time,
        }))
      : [];

    const entry: Record<string, unknown> = {
      rank: r.rank,
      bibNumber: r.bibNumber,
      name: r.name,
      category: r.category,
      status: r.status,
      gender: r.gender,
    };

    if (r.totalTime) {
      entry.totalTime = r.totalTime;
    }

    entry.lapTimes = lapTimes;

    return entry;
  });
}

function buildLaptimes(laptimeData: ParsedLaptime[]): object[] {
  return laptimeData.map(lt => ({
    bibNumber: lt.bibNumber,
    name: lt.name,
    category: determineCategoryForBib(lt.bibNumber),
    lapCount: lt.lapCount,
    totalTime: lt.totalTime,
    finalTime: lt.finalTime,
    laps: lt.laps.map((time, i) => ({
      lap: i + 1,
      time,
    })),
  }));
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Step 1: Extract raw text
  const resultPdf = "/tmp/result_11.pdf";
  const laptimePdf = "/tmp/laptime_11.pdf";

  console.log("Extracting PDFs...");
  const resultText = await extractText(resultPdf);
  const laptimeText = await extractText(laptimePdf);

  // Save raw text
  fs.writeFileSync(path.join(DATA_DIR, "raw-results.txt"), resultText);
  fs.writeFileSync(path.join(DATA_DIR, "raw-laptimes.txt"), laptimeText);
  console.log("Saved raw text files.");

  // Step 2: Parse data
  console.log("Parsing results...");
  const results = parseResults(resultText);
  console.log(`Parsed ${results.length} result entries.`);

  const cat200 = results.filter(r => r.category === "200km");
  const cat100 = results.filter(r => r.category === "100km");
  const cat50 = results.filter(r => r.category === "50km");
  console.log(`  200km: ${cat200.length}, 100km: ${cat100.length}, 50km: ${cat50.length}`);

  console.log("Parsing laptimes...");
  const laptimes = parseLaptimes(laptimeText);
  console.log(`Parsed ${laptimes.length} laptime entries.`);

  // Build laptime map by bib number
  const laptimeMap = new Map<number, ParsedLaptime>();
  for (const lt of laptimes) {
    laptimeMap.set(lt.bibNumber, lt);
  }

  // Step 3: Create JSON files

  // race.json
  const raceMetadata = {
    raceName: "第11回 しろさとTT200",
    date: "2026-03-22",
    location: "城里テストセンター",
    weather: {
      temperature: 12,
      humidity: 55,
      wind: "北西 3m/s",
      condition: "晴れ",
    },
    categories: [
      { name: "200km", distance: 198.32, laps: 35, lapDistance: 5.666 },
      { name: "100km", distance: 101.99, laps: 18, lapDistance: 5.666 },
      { name: "50km", distance: 51.0, laps: 9, lapDistance: 5.667 },
    ],
  };

  // results.json
  const athleteResults = buildAthleteResults(results, laptimeMap);

  // laptimes.json
  const athleteLaptimes = buildLaptimes(laptimes);

  // comments.json
  const comments = {};

  // Write all JSON files
  fs.writeFileSync(
    path.join(DATA_DIR, "race.json"),
    JSON.stringify(raceMetadata, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, "results.json"),
    JSON.stringify(athleteResults, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, "laptimes.json"),
    JSON.stringify(athleteLaptimes, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, "comments.json"),
    JSON.stringify(comments, null, 2)
  );

  console.log("\nJSON files created:");
  console.log(`  race.json`);
  console.log(`  results.json (${athleteResults.length} entries)`);
  console.log(`  laptimes.json (${athleteLaptimes.length} entries)`);
  console.log(`  comments.json`);

  // Step 4: Validation
  console.log("\n--- Validation ---");

  // Check categories
  for (const cat of ["200km", "100km", "50km"] as const) {
    const catResults = results.filter(r => r.category === cat);
    const finished = catResults.filter(r => r.status === "finished");
    const open = catResults.filter(r => r.status === "OPEN");
    const dnf = catResults.filter(r => r.status === "DNF");
    const dns = catResults.filter(r => r.status === "DNS");
    console.log(
      `${cat}: total=${catResults.length} finished=${finished.length} OPEN=${open.length} DNF=${dnf.length} DNS=${dns.length}`
    );
  }

  // Check bib consistency between results and laptimes
  const resultBibs = new Set(results.map(r => r.bibNumber));
  const laptimeBibs = new Set(laptimes.map(l => l.bibNumber));
  const inResultNotLaptime = [...resultBibs].filter(b => !laptimeBibs.has(b));
  const inLaptimeNotResult = [...laptimeBibs].filter(b => !resultBibs.has(b));

  if (inResultNotLaptime.length > 0) {
    console.log(`Bibs in results but not in laptimes (${inResultNotLaptime.length}): DNS entries expected`);
    // Check if they're all DNS
    const nonDns = inResultNotLaptime.filter(b => {
      const r = results.find(r => r.bibNumber === b);
      return r && r.status !== "DNS";
    });
    if (nonDns.length > 0) {
      console.log(`  WARNING: Non-DNS bibs missing laptimes: ${nonDns.join(", ")}`);
    }
  }
  if (inLaptimeNotResult.length > 0) {
    console.log(`WARNING: Bibs in laptimes but not in results: ${inLaptimeNotResult.join(", ")}`);
  }

  // Check lap counts match categories
  for (const lt of laptimes) {
    const cat = determineCategoryForBib(lt.bibNumber);
    const expectedLaps = cat === "200km" ? 35 : cat === "100km" ? 18 : 9;
    if (lt.laps.length !== expectedLaps && lt.laps.length !== lt.lapCount) {
      // Only warn if it's not a DNF (fewer laps expected)
      const result = results.find(r => r.bibNumber === lt.bibNumber);
      if (result && result.status === "finished") {
        if (lt.laps.length !== expectedLaps) {
          console.log(
            `WARNING: Bib ${lt.bibNumber} (${cat}) has ${lt.laps.length} laps, expected ${expectedLaps}`
          );
        }
      }
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
