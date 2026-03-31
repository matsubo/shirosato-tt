import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(__dirname, "../src/data");

type CategoryName = "200km" | "100km" | "50km";
type Status = "finished" | "OPEN" | "DNF" | "DNS";
type RankValue = number | "OPEN" | "DNF" | "DNS";

interface ParsedResult {
  rank: RankValue;
  bibNumber: number;
  name: string;
  age: number;
  gender: "男" | "女";
  prefecture: string;
  category: CategoryName;
  status: Status;
  totalTime: string | null;
  penalty: number | null;
  maleRank: number | null;
  femaleRank: number | null;
  ageCategory: string;
  categoryRank: number | null;
  avgSpeed: number | null;
}

function parseCategoryHeader(line: string): CategoryName | null {
  const match = line.match(/【(\d+)km部門/);
  if (!match) return null;
  return `${match[1]}km` as CategoryName;
}

function isHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed === "" ||
    trimmed.startsWith("総合") ||
    trimmed.startsWith("順位") ||
    trimmed.startsWith("女子") ||
    trimmed.startsWith("年齢区分") ||
    trimmed === "---PAGE---" ||
    /^第\d+回/.test(trimmed)
  );
}

function parseResultLine(line: string, currentCategory: CategoryName): ParsedResult | null {
  const trimmed = line.trim();
  if (!trimmed || isHeaderLine(trimmed)) return null;

  const parts = trimmed
    .split("\t")
    .map((s) => s.trim())
    .filter((s) => s !== "");

  if (parts.length < 5) return null;

  // Parse rank/status
  const rankStr = parts[0];
  let rank: RankValue;
  let status: Status;

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
    rank = parseInt(rankStr, 10);
    if (Number.isNaN(rank)) return null;
    status = "finished";
  }

  const bibNumber = parseInt(parts[1], 10);
  if (Number.isNaN(bibNumber)) return null;

  const name = parts[2];
  const age = parseInt(parts[3], 10);
  if (Number.isNaN(age)) return null;

  const gender = parts[4] as "男" | "女";
  if (gender !== "男" && gender !== "女") return null;

  // For DNF/DNS, the format is different - no totalTime, just prefecture (maybe) and ageCategory
  if (status === "DNF" || status === "DNS") {
    return parseDnfDnsLine(parts, rank, bibNumber, name, age, gender, currentCategory, status);
  }

  // For finished/OPEN entries
  const prefecture = parts[5];
  const remaining = parts.slice(6);

  if (remaining.length === 0) return null;

  // First remaining should be totalTime
  const totalTime = remaining[0]?.match(/^\d+:\d{2}:\d{2}$/) ? remaining[0] : null;

  // OPEN entries without totalTime (e.g., participated but no recorded time)
  if (!totalTime && status === "OPEN") {
    return parseDnfDnsLine(parts, rank, bibNumber, name, age, gender, currentCategory, status);
  }

  if (!totalTime) return null;

  const rest = remaining.slice(1);

  // Find ageCategory (matches pattern like "40代男子", "30代女子")
  const ageCatIdx = rest.findIndex((r) => /^\d+代[男女]子$/.test(r));
  if (ageCatIdx < 0) return null;

  const ageCategory = rest[ageCatIdx];

  // Numbers before ageCategory
  const numsBefore = rest
    .slice(0, ageCatIdx)
    .filter((r) => /^\d+$/.test(r))
    .map((r) => parseInt(r, 10));

  let penalty: number | null = null;
  let maleRank: number | null = null;
  let femaleRank: number | null = null;

  if (status === "OPEN") {
    // OPEN entries have no gender rank; numbers before ageCategory are penalty
    if (numsBefore.length === 1) {
      penalty = numsBefore[0];
    }
  } else {
    // finished entries
    if (gender === "男") {
      if (numsBefore.length === 1) {
        maleRank = numsBefore[0];
      } else if (numsBefore.length === 2) {
        penalty = numsBefore[0];
        maleRank = numsBefore[1];
      }
    } else {
      if (numsBefore.length === 1) {
        femaleRank = numsBefore[0];
      } else if (numsBefore.length === 2) {
        penalty = numsBefore[0];
        femaleRank = numsBefore[1];
      }
    }
  }

  // After ageCategory: optional categoryRank (number), then avgSpeed (Xkm/h)
  const afterAgeCat = rest.slice(ageCatIdx + 1);
  let categoryRank: number | null = null;
  let avgSpeed: number | null = null;

  for (const field of afterAgeCat) {
    if (field.endsWith("km/h")) {
      avgSpeed = parseFloat(field.replace("km/h", ""));
    } else if (/^\d+$/.test(field)) {
      categoryRank = parseInt(field, 10);
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
    penalty,
    maleRank,
    femaleRank,
    ageCategory,
    categoryRank,
    avgSpeed,
  };
}

function parseDnfDnsLine(
  parts: string[],
  rank: RankValue,
  bibNumber: number,
  name: string,
  age: number,
  gender: "男" | "女",
  category: CategoryName,
  status: Status,
): ParsedResult {
  // DNF/DNS format: rank, bib, name, age, gender, prefecture, [penalty], ageCategory
  // But sometimes prefecture is missing and ageCategory comes right after gender
  const remaining = parts.slice(5);

  let prefecture = "";
  let penalty: number | null = null;
  let ageCategory = "";

  for (const field of remaining) {
    if (/^\d+代[男女]子$/.test(field)) {
      ageCategory = field;
    } else if (/^\d+$/.test(field) && penalty === null) {
      penalty = parseInt(field, 10);
    } else if (!ageCategory && !/^\d+$/.test(field)) {
      // First non-number, non-ageCategory field is prefecture
      if (!prefecture) {
        prefecture = field;
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
    category,
    status,
    totalTime: null,
    penalty,
    maleRank: null,
    femaleRank: null,
    ageCategory,
    categoryRank: null,
    avgSpeed: null,
  };
}

function parseAllResults(text: string): ParsedResult[] {
  const lines = text.split("\n");
  const results: ParsedResult[] = [];
  let currentCategory: CategoryName = "200km";

  for (const line of lines) {
    const cat = parseCategoryHeader(line);
    if (cat) {
      currentCategory = cat;
      continue;
    }

    const result = parseResultLine(line, currentCategory);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

interface ExistingResult {
  rank: RankValue;
  bibNumber: number;
  name: string;
  category: CategoryName;
  status: Status;
  gender: "男" | "女";
  totalTime?: string;
  lapTimes: Array<{ lap: number; time: string }>;
}

function main() {
  // Read raw text
  const rawText = fs.readFileSync(path.join(DATA_DIR, "raw-results.txt"), "utf-8");

  // Parse results from raw text
  const parsed = parseAllResults(rawText);
  console.log(`Parsed ${parsed.length} entries from raw-results.txt`);

  // Read existing results.json to get lapTimes
  const existingResults: ExistingResult[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "results.json"), "utf-8"),
  );

  // Build lookup map by bibNumber for lapTimes
  const lapTimesMap = new Map<number, Array<{ lap: number; time: string }>>();
  for (const r of existingResults) {
    lapTimesMap.set(r.bibNumber, r.lapTimes || []);
  }

  // Build final results
  const finalResults = parsed.map((r) => ({
    rank: r.rank,
    bibNumber: r.bibNumber,
    name: r.name,
    age: r.age,
    gender: r.gender,
    prefecture: r.prefecture,
    category: r.category,
    status: r.status,
    totalTime: r.totalTime,
    penalty: r.penalty,
    maleRank: r.maleRank,
    femaleRank: r.femaleRank,
    ageCategory: r.ageCategory,
    categoryRank: r.categoryRank,
    avgSpeed: r.avgSpeed,
    lapTimes: lapTimesMap.get(r.bibNumber) || [],
  }));

  // Validation
  console.log("\n--- Validation ---");

  let missingAge = 0;
  let missingPrefecture = 0;
  let missingAgeCategory = 0;

  for (const r of finalResults) {
    if (!r.age || Number.isNaN(r.age)) missingAge++;
    if (!r.prefecture) missingPrefecture++;
    if (!r.ageCategory) missingAgeCategory++;
  }

  console.log(`Missing age: ${missingAge}`);
  console.log(`Missing prefecture: ${missingPrefecture}`);
  console.log(`Missing ageCategory: ${missingAgeCategory}`);

  for (const cat of ["200km", "100km", "50km"] as const) {
    const catResults = finalResults.filter((r) => r.category === cat);
    const finished = catResults.filter((r) => r.status === "finished");
    const open = catResults.filter((r) => r.status === "OPEN");
    const dnf = catResults.filter((r) => r.status === "DNF");
    const dns = catResults.filter((r) => r.status === "DNS");
    console.log(
      `${cat}: total=${catResults.length} finished=${finished.length} OPEN=${open.length} DNF=${dnf.length} DNS=${dns.length}`,
    );
  }

  // Check that existing results count matches
  console.log(`\nExisting results.json: ${existingResults.length} entries`);
  console.log(`New results: ${finalResults.length} entries`);

  if (existingResults.length !== finalResults.length) {
    console.log("WARNING: Entry count mismatch!");
    // Find which bibs are different
    const existingBibs = new Set(existingResults.map((r) => r.bibNumber));
    const newBibs = new Set(finalResults.map((r) => r.bibNumber));
    const missing = [...existingBibs].filter((b) => !newBibs.has(b));
    const extra = [...newBibs].filter((b) => !existingBibs.has(b));
    if (missing.length > 0) console.log(`  Missing bibs: ${missing.join(", ")}`);
    if (extra.length > 0) console.log(`  Extra bibs: ${extra.join(", ")}`);
  }

  // Spot check some entries
  console.log("\n--- Sample entries ---");
  const samples = [finalResults[0], finalResults[1], finalResults[2]];
  for (const s of samples) {
    console.log(
      `  Bib ${s.bibNumber}: ${s.name}, age=${s.age}, pref=${s.prefecture}, ` +
        `ageCat=${s.ageCategory}, catRank=${s.categoryRank}, ` +
        `maleRank=${s.maleRank}, femaleRank=${s.femaleRank}, ` +
        `penalty=${s.penalty}, avgSpeed=${s.avgSpeed}, lapTimes=${s.lapTimes.length}`,
    );
  }

  // Write results.json
  fs.writeFileSync(path.join(DATA_DIR, "results.json"), JSON.stringify(finalResults, null, 2));
  console.log("\nWrote results.json");
}

main();
