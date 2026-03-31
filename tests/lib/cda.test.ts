import { describe, expect, it } from "vitest";
import { calcCdA, calcCdAFromLapTime } from "@/lib/cda";

describe("calcCdA", () => {
  it("returns 0 when speed is 0", () => {
    expect(calcCdA({ power: 200, speed: 0 })).toBe(0);
  });

  it("calculates CdA with default parameters", () => {
    // 200W at 10 m/s (~36 km/h)
    const cda = calcCdA({ power: 200, speed: 10 });
    expect(cda).toBeGreaterThan(0);
    // Typical CdA for a cyclist is 0.2 - 0.4
    expect(cda).toBeGreaterThan(0.1);
    expect(cda).toBeLessThan(1.0);
  });

  it("higher power at same speed gives higher CdA", () => {
    const cda1 = calcCdA({ power: 200, speed: 10 });
    const cda2 = calcCdA({ power: 300, speed: 10 });
    expect(cda2).toBeGreaterThan(cda1);
  });

  it("applies drivetrain efficiency", () => {
    const cdaDefault = calcCdA({ power: 200, speed: 10 });
    const cdaPerfect = calcCdA({ power: 200, speed: 10, drivetrainEfficiency: 1.0 });
    // Perfect efficiency should yield slightly higher CdA (more power available)
    expect(cdaPerfect).toBeGreaterThan(cdaDefault);
  });

  it("accepts custom parameters", () => {
    const cda = calcCdA({
      power: 250,
      speed: 12,
      airDensity: 1.2,
      rollingResistance: 0.005,
      totalWeight: 75,
      gradient: 0.01,
      drivetrainEfficiency: 0.95,
    });
    expect(cda).toBeGreaterThan(0);
  });
});

describe("calcCdAFromLapTime", () => {
  it("returns 0 when lap time is 0", () => {
    expect(calcCdAFromLapTime(0, 5000, 200)).toBe(0);
  });

  it("calculates CdA from lap time and distance", () => {
    // 5km in 600 seconds = ~8.33 m/s (~30 km/h)
    const cda = calcCdAFromLapTime(600, 5000, 200);
    expect(cda).toBeGreaterThan(0);
    expect(cda).toBeLessThan(2.0);
  });

  it("faster lap time gives lower CdA (less drag needed)", () => {
    const cdaSlow = calcCdAFromLapTime(600, 5000, 200);
    const cdaFast = calcCdAFromLapTime(500, 5000, 200);
    // Faster speed at same power means less drag, but cubic relationship
    // means CdA should be lower for faster times
    expect(cdaFast).toBeLessThan(cdaSlow);
  });
});
