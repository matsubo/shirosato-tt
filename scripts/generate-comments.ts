import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LapEntry {
  lap: number;
  time: string;
}

interface ResultEntry {
  rank: string | number;
  bibNumber: number;
  name: string;
  category: string;
  status: string;
  gender: string;
  totalTime: string;
  lapTimes?: LapEntry[];
}

interface LaptimeEntry {
  bibNumber: number;
  name: string;
  category: string;
  lapCount: number;
  totalTime: string;
  finalTime: string;
  laps: LapEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeToSeconds(t: string): number {
  const parts = t.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface LapStats {
  lapSeconds: number[];
  mean: number;
  stddev: number;
  cv: number; // coefficient of variation (%)
  bestLap: number; // 1-indexed
  bestTime: number;
  worstLap: number;
  worstTime: number;
  firstHalfMean: number;
  secondHalfMean: number;
  splitDiff: number; // positive = slowed down (positive split)
  lastThreeMean: number;
  totalLaps: number;
  rank: string | number;
  category: string;
}

function analyseLaps(laps: LapEntry[]): Omit<LapStats, "rank" | "category"> {
  const lapSeconds = laps.map((l) => timeToSeconds(l.time));
  const n = lapSeconds.length;
  const mean = lapSeconds.reduce((a, b) => a + b, 0) / n;
  const variance = lapSeconds.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  const cv = (stddev / mean) * 100;

  let bestIdx = 0;
  let worstIdx = 0;
  for (let i = 1; i < n; i++) {
    if (lapSeconds[i] < lapSeconds[bestIdx]) bestIdx = i;
    if (lapSeconds[i] > lapSeconds[worstIdx]) worstIdx = i;
  }

  const half = Math.floor(n / 2);
  const firstHalf = lapSeconds.slice(0, half);
  const secondHalf = lapSeconds.slice(half);
  const firstHalfMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const splitDiff = secondHalfMean - firstHalfMean;

  const lastThree = lapSeconds.slice(-3);
  const lastThreeMean = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;

  return {
    lapSeconds,
    mean,
    stddev,
    cv,
    bestLap: bestIdx + 1,
    bestTime: lapSeconds[bestIdx],
    worstLap: worstIdx + 1,
    worstTime: lapSeconds[worstIdx],
    firstHalfMean,
    secondHalfMean,
    splitDiff,
    lastThreeMean,
    totalLaps: n,
  };
}

// ---------------------------------------------------------------------------
// Comment templates
// ---------------------------------------------------------------------------

// Returns true if athlete is in the top ~10% of their category by rank
function isTopPerformer(rank: string | number): boolean {
  const n = typeof rank === "number" ? rank : parseInt(rank, 10);
  return !Number.isNaN(n) && n <= 10;
}

function generateComment(stats: LapStats): string {
  const {
    cv,
    bestLap,
    bestTime,
    worstLap,
    worstTime,
    splitDiff,
    mean,
    lastThreeMean,
    totalLaps,
    rank,
    firstHalfMean,
    secondHalfMean,
  } = stats;

  const bestTimeStr = formatSeconds(bestTime);
  const worstTimeStr = formatSeconds(worstTime);
  const meanStr = formatSeconds(mean);
  const splitDiffSec = Math.abs(splitDiff);

  // Determine characteristics
  const isConsistent = cv < 3.5;
  const isVeryConsistent = cv < 2.0;
  const isNegativeSplit = splitDiff < -3; // second half faster by > 3s avg
  const isPositiveSplit = splitDiff > 5; // slowed significantly
  const isStrongFinisher = lastThreeMean < mean - 2;
  const isTop = isTopPerformer(rank);

  // Pick template based on priority
  if (isVeryConsistent && isTop) {
    return pickFrom([
      `平均ラップ${meanStr}の驚異的な安定感。CV${cv.toFixed(1)}%はトップクラスの証。ラップ${bestLap}で最速${bestTimeStr}を記録した。`,
      `全${totalLaps}周を通じてCV${cv.toFixed(1)}%という卓越したペース管理。ラップ${bestLap}の${bestTimeStr}が光る走りだった。`,
      `ラップ間のばらつきがわずかCV${cv.toFixed(1)}%。平均${meanStr}を軸に安定した上位走行を展開した。`,
    ]);
  }

  if (isNegativeSplit) {
    const diff = formatSeconds(splitDiffSec);
    return pickFrom([
      `後半にかけてペースアップするネガティブスプリット型。後半は平均${formatSeconds(secondHalfMean)}で前半比${diff}短縮した。`,
      `前半を抑え後半勝負のレース展開。ラップ${bestLap}で最速${bestTimeStr}を刻み、終盤の強さを見せた。`,
      `後半の平均が前半より${diff}速いネガティブスプリット。ラップ${bestLap}の${bestTimeStr}が最速で尻上がりの走行だった。`,
      `前半${formatSeconds(firstHalfMean)}から後半${formatSeconds(secondHalfMean)}へ加速。計画的なペース配分が奏功した。`,
    ]);
  }

  if (isPositiveSplit && cv > 5) {
    const diff = formatSeconds(splitDiffSec);
    return pickFrom([
      `前半は積極的な走りで平均${formatSeconds(firstHalfMean)}。後半${diff}のペースダウンがあり、配分に課題が残る。`,
      `序盤のラップ${bestLap}で${bestTimeStr}の好タイムを記録。しかし後半は平均${diff}落ちペース維持が今後の鍵だ。`,
      `前半の貯金を活かすも後半は平均${diff}の減速。ラップ${worstLap}の${worstTimeStr}が最も苦しい区間だった。`,
      `攻めの前半から後半にかけて${diff}のペースダウン。ラップ${worstLap}(${worstTimeStr})をどう改善するかが課題だ。`,
    ]);
  }

  if (isConsistent) {
    return pickFrom([
      `CV${cv.toFixed(1)}%の安定した走り。平均${meanStr}を維持し、ラップ${bestLap}で最速${bestTimeStr}をマークした。`,
      `全${totalLaps}周を均一なペースで走破。最速ラップ${bestLap}(${bestTimeStr})と最遅ラップ${worstLap}(${worstTimeStr})の差が小さい。`,
      `平均${meanStr}の堅実なペース。CV${cv.toFixed(1)}%の安定感でラップ${bestLap}に${bestTimeStr}の最速タイムを記録。`,
      `ラップ${bestLap}の${bestTimeStr}を軸に安定感のある走行。ペースのばらつきが少なく堅実なレース運びだった。`,
    ]);
  }

  if (isStrongFinisher) {
    return pickFrom([
      `終盤に真価を発揮。最後の3周は平均${formatSeconds(lastThreeMean)}で全体平均${meanStr}を上回る粘り強い走りだった。`,
      `ラスト3周の平均${formatSeconds(lastThreeMean)}が全体平均を上回る。ラップ${bestLap}の${bestTimeStr}が最速で終盤型の走行だ。`,
      `後半にかけて持ち直し、終盤3周は${formatSeconds(lastThreeMean)}平均。最後まで脚を残すレースマネジメントが光った。`,
    ]);
  }

  if (isTop) {
    return pickFrom([
      `上位入賞の実力者。平均${meanStr}のハイペースを維持し、ラップ${bestLap}で最速${bestTimeStr}を記録した。`,
      `ラップ${bestLap}の${bestTimeStr}が圧巻。平均${meanStr}のスピードを${totalLaps}周にわたって維持した。`,
      `トップレベルの走力を発揮。最速${bestTimeStr}(ラップ${bestLap})と平均${meanStr}のバランスが秀逸。`,
    ]);
  }

  // Mid-pack / general
  const range = worstTime - bestTime;
  const rangeStr = formatSeconds(range);
  return pickFrom([
    `平均${meanStr}で${totalLaps}周を完走。ラップ${bestLap}の${bestTimeStr}が自己ベスト、最大${rangeStr}の変動幅だった。`,
    `ラップ${bestLap}(${bestTimeStr})を最速に全${totalLaps}周を走破。ペース変動${rangeStr}で後半の維持が今後の伸びしろだ。`,
    `全体平均${meanStr}で完走。最速ラップ${bestLap}(${bestTimeStr})と最遅ラップ${worstLap}(${worstTimeStr})の差を詰めたい。`,
    `${totalLaps}周を平均${meanStr}で走破。ラップ${bestLap}で見せた${bestTimeStr}のスピードを持続することが次の目標だ。`,
    `最速${bestTimeStr}(ラップ${bestLap})が光る。平均${meanStr}との差を縮め、全体的なペース向上を目指したい。`,
    `ラップ${worstLap}(${worstTimeStr})がやや苦しい区間。平均${meanStr}のペースを安定させることが鍵となる。`,
  ]);
}

// Deterministic pseudo-random pick based on a global counter
let pickCounter = 0;
function pickFrom(templates: string[]): string {
  const idx = pickCounter % templates.length;
  pickCounter++;
  return templates[idx];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const basePath = join(__dirname, "..", "src", "data");
  const results: ResultEntry[] = JSON.parse(readFileSync(join(basePath, "results.json"), "utf-8"));
  const laptimes: LaptimeEntry[] = JSON.parse(
    readFileSync(join(basePath, "laptimes.json"), "utf-8"),
  );

  const laptimeMap = new Map<number, LaptimeEntry>();
  for (const lt of laptimes) {
    laptimeMap.set(lt.bibNumber, lt);
  }

  const finished = results.filter((r) => r.status !== "DNF" && r.status !== "DNS");

  const comments: Record<string, string> = {};
  let generated = 0;

  for (const athlete of finished) {
    const lt = laptimeMap.get(athlete.bibNumber);
    if (!lt || lt.laps.length === 0) continue;

    const analysis = analyseLaps(lt.laps);
    const stats: LapStats = {
      ...analysis,
      rank: athlete.rank,
      category: athlete.category,
    };

    const comment = generateComment(stats);
    comments[String(athlete.bibNumber)] = comment;
    generated++;
  }

  const outputPath = join(basePath, "comments.json");
  writeFileSync(outputPath, `${JSON.stringify(comments, null, 2)}\n`, "utf-8");

  console.log(`Generated ${generated} comments for finished athletes.`);
  console.log(`Written to ${outputPath}`);

  // Validation
  const finishedWithLaps = finished.filter(
    (r) => laptimeMap.has(r.bibNumber) && (laptimeMap.get(r.bibNumber)?.laps.length ?? 0) > 0,
  );
  if (generated !== finishedWithLaps.length) {
    console.error(`WARNING: Expected ${finishedWithLaps.length} but generated ${generated}`);
    process.exit(1);
  }

  // Check comment lengths
  const lengths = Object.values(comments).map((c) => c.length);
  const minLen = Math.min(...lengths);
  const maxLen = Math.max(...lengths);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  console.log(`Comment lengths: min=${minLen}, max=${maxLen}, avg=${avgLen.toFixed(0)}`);

  // Verify JSON is valid
  JSON.parse(readFileSync(outputPath, "utf-8"));
  console.log("JSON validation: OK");
}

main();
