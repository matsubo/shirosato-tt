import { describe, it, expect } from "vitest";
import { timeToSeconds, secondsToTime, formatTime, lapTimeToMinutes } from "@/lib/time-utils";

describe("timeToSeconds", () => {
  it("converts HH:MM:SS to seconds", () => {
    expect(timeToSeconds("01:30:00")).toBe(5400);
    expect(timeToSeconds("00:05:30")).toBe(330);
    expect(timeToSeconds("02:00:00")).toBe(7200);
  });

  it("converts MM:SS to seconds", () => {
    expect(timeToSeconds("05:30")).toBe(330);
    expect(timeToSeconds("10:00")).toBe(600);
  });

  it("handles zero", () => {
    expect(timeToSeconds("00:00:00")).toBe(0);
    expect(timeToSeconds("00:00")).toBe(0);
  });
});

describe("secondsToTime", () => {
  it("converts seconds to HH:MM:SS", () => {
    expect(secondsToTime(5400)).toBe("01:30:00");
    expect(secondsToTime(330)).toBe("00:05:30");
    expect(secondsToTime(0)).toBe("00:00:00");
  });

  it("handles large values", () => {
    expect(secondsToTime(36000)).toBe("10:00:00");
  });
});

describe("formatTime", () => {
  it("formats time with hours without leading zero on hours", () => {
    expect(formatTime("01:30:00")).toBe("1:30:00");
    expect(formatTime("10:05:30")).toBe("10:05:30");
  });

  it("formats time under an hour as M:SS", () => {
    expect(formatTime("00:05:30")).toBe("5:30");
    expect(formatTime("00:00:45")).toBe("0:45");
  });
});

describe("lapTimeToMinutes", () => {
  it("converts lap time to minutes", () => {
    expect(lapTimeToMinutes("00:30:00")).toBe(30);
    expect(lapTimeToMinutes("01:00:00")).toBe(60);
    expect(lapTimeToMinutes("00:05:30")).toBeCloseTo(5.5);
  });
});
