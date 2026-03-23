import { describe, it, expect } from "vitest";
import { mean, stddev, calcDeviation, calcCV, calcPercentile, calcMovingAverage } from "@/lib/stats";

describe("mean", () => {
  it("calculates the mean of numbers", () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([10, 20])).toBe(15);
  });

  it("returns 0 for empty array", () => {
    expect(mean([])).toBe(0);
  });
});

describe("stddev", () => {
  it("calculates population standard deviation", () => {
    expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.0, 1);
  });

  it("returns 0 for empty array", () => {
    expect(stddev([])).toBe(0);
  });

  it("returns 0 for single element", () => {
    expect(stddev([5])).toBe(0);
  });
});

describe("calcDeviation", () => {
  it("returns 50 for the mean value", () => {
    const values = [10, 20, 30, 40, 50];
    expect(calcDeviation(mean(values), values)).toBeCloseTo(50);
  });

  it("returns higher deviation for lower time (inverted)", () => {
    const values = [100, 200, 300, 400, 500];
    const fastDev = calcDeviation(100, values);
    const slowDev = calcDeviation(500, values);
    expect(fastDev).toBeGreaterThan(slowDev);
  });

  it("returns 50 when stddev is 0", () => {
    expect(calcDeviation(5, [5, 5, 5])).toBe(50);
  });
});

describe("calcCV", () => {
  it("calculates coefficient of variation", () => {
    const values = [10, 10, 10, 10];
    expect(calcCV(values)).toBe(0);
  });

  it("returns positive CV for varied data", () => {
    const values = [10, 20, 30];
    expect(calcCV(values)).toBeGreaterThan(0);
  });

  it("returns 0 when mean is 0", () => {
    expect(calcCV([])).toBe(0);
  });
});

describe("calcPercentile", () => {
  it("calculates percentile rank for time data", () => {
    const values = [100, 200, 300, 400, 500];
    // 100 is fastest: 4 values are slower -> 80%
    expect(calcPercentile(100, values)).toBe(80);
    // 500 is slowest: 0 values are slower -> 0%
    expect(calcPercentile(500, values)).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(calcPercentile(100, [])).toBe(0);
  });
});

describe("calcMovingAverage", () => {
  it("calculates moving average with window size", () => {
    const values = [1, 2, 3, 4, 5];
    const result = calcMovingAverage(values, 3);
    expect(result).toEqual([2, 3, 4]);
  });

  it("returns empty for window size larger than array", () => {
    expect(calcMovingAverage([1, 2], 3)).toEqual([]);
  });

  it("returns empty for zero or negative window size", () => {
    expect(calcMovingAverage([1, 2, 3], 0)).toEqual([]);
    expect(calcMovingAverage([1, 2, 3], -1)).toEqual([]);
  });

  it("returns empty for empty input", () => {
    expect(calcMovingAverage([], 3)).toEqual([]);
  });
});
