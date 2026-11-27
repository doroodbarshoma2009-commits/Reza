import { describe, expect, it } from "vitest";
import { entriesForDate, occursOn, weekDates } from "../recurrence";
import type { Entry } from "../types";

const base: Entry = {
  id: "a",
  title: "Gym",
  start: 360,
  end: 420,
  category: "health",
  notes: "",
  reminder: null,
  repeat: { type: "none" },
  startDate: "2026-11-27",
};

describe("occursOn", () => {
  it("one-off entries only appear on their start date", () => {
    expect(occursOn(base, "2026-11-27")).toBe(true);
    expect(occursOn(base, "2026-11-28")).toBe(false);
  });

  it("daily entries repeat from their start date onwards", () => {
    const daily = { ...base, repeat: { type: "daily" as const } };
    expect(occursOn(daily, "2026-11-26")).toBe(false);
    expect(occursOn(daily, "2026-11-27")).toBe(true);
    expect(occursOn(daily, "2027-03-01")).toBe(true);
  });

  it("weekday entries skip Friday and Saturday", () => {
    const weekdays = { ...base, repeat: { type: "weekdays" as const } };
    expect(occursOn(weekdays, "2026-11-27")).toBe(true);
    expect(occursOn(weekdays, "2026-11-28")).toBe(false);
    expect(occursOn(weekdays, "2026-11-30")).toBe(true);
  });

  it("weekly entries match only chosen weekdays", () => {
    const weekly = { ...base, repeat: { type: "weekly" as const, days: [0, 3] } };
    expect(occursOn(weekly, "2026-11-29")).toBe(true);
    expect(occursOn(weekly, "2026-12-02")).toBe(true);
    expect(occursOn(weekly, "2026-11-27")).toBe(false);
  });
});

describe("entriesForDate", () => {
  it("returns matching entries sorted by start time", () => {
    const later = { ...base, id: "b", start: 600, end: 660, repeat: { type: "daily" as const } };
    const result = entriesForDate([later, base], "2026-11-27");
    expect(result.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("weekDates", () => {
  it("returns Monday through Sunday containing the anchor date", () => {
    expect(weekDates("2026-11-27")).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ]);
  });
});
