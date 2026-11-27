import { describe, expect, it } from "vitest";
import { dueReminders } from "../reminders";
import type { Entry } from "../types";

const entry: Entry = {
  id: "r1",
  title: "Call",
  start: 600,
  end: 630,
  category: "work",
  notes: "",
  reminder: 5,
  repeat: { type: "none" },
  startDate: "2026-11-27",
};

describe("dueReminders", () => {
  it("fires once at the reminder minute", () => {
    const fired = new Set<string>();
    expect(dueReminders([entry], "2026-11-27", 594, fired)).toHaveLength(0);
    expect(dueReminders([entry], "2026-11-27", 595, fired)).toHaveLength(1);
    expect(dueReminders([entry], "2026-11-27", 595, fired)).toHaveLength(0);
  });

  it("ignores entries without reminders or on other days", () => {
    const fired = new Set<string>();
    expect(dueReminders([{ ...entry, reminder: null }], "2026-11-27", 595, fired)).toHaveLength(0);
    expect(dueReminders([entry], "2026-11-28", 595, fired)).toHaveLength(0);
  });
});
