import { describe, expect, it } from "vitest";
import { deedStreak, isDeedDone, sortGoals } from "../goals";
import type { Goal } from "../types";

describe("sortGoals", () => {
  it("puts open goals before done ones", () => {
    const goals: Goal[] = [
      { id: "1", title: "A", done: true },
      { id: "2", title: "B", done: false },
    ];
    expect(sortGoals(goals).map((g) => g.id)).toEqual(["2", "1"]);
  });
});

describe("deedStreak", () => {
  it("counts consecutive days ending today", () => {
    const done = {
      "d@2026-11-25": true as const,
      "d@2026-11-26": true as const,
      "d@2026-11-27": true as const,
    };
    expect(deedStreak(done, "d", "2026-11-27")).toBe(3);
  });

  it("keeps yesterday's streak when today is not yet done", () => {
    const done = {
      "d@2026-11-26": true as const,
      "d@2026-11-25": true as const,
    };
    expect(deedStreak(done, "d", "2026-11-27")).toBe(2);
    expect(isDeedDone(done, "d", "2026-11-27")).toBe(false);
  });

  it("breaks on a missing day", () => {
    const done = {
      "d@2026-11-27": true as const,
      "d@2026-11-25": true as const,
    };
    expect(deedStreak(done, "d", "2026-11-27")).toBe(1);
  });
});
