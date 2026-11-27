import { describe, expect, it } from "vitest";
import { addDays, dateKey, hhmmToMinutes, minutesToHHMM, overlaps, weekdayOf } from "../time";

describe("time helpers", () => {
  it("converts minutes to HH:MM and back", () => {
    expect(minutesToHHMM(0)).toBe("00:00");
    expect(minutesToHHMM(9 * 60 + 5)).toBe("09:05");
    expect(minutesToHHMM(1440)).toBe("00:00");
    expect(hhmmToMinutes("09:05")).toBe(545);
    expect(hhmmToMinutes("7:30")).toBe(450);
  });

  it("rejects malformed times", () => {
    expect(hhmmToMinutes("25:00")).toBeNull();
    expect(hhmmToMinutes("12:60")).toBeNull();
    expect(hhmmToMinutes("abc")).toBeNull();
    expect(hhmmToMinutes("24:30")).toBeNull();
  });

  it("detects overlapping ranges but not touching ones", () => {
    expect(overlaps({ start: 60, end: 120 }, { start: 100, end: 150 })).toBe(true);
    expect(overlaps({ start: 60, end: 120 }, { start: 120, end: 150 })).toBe(false);
  });

  it("works with local date keys", () => {
    expect(dateKey(new Date(2026, 10, 27))).toBe("2026-11-27");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(weekdayOf("2026-11-27")).toBe(5);
  });
});
