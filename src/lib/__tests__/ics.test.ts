import { describe, expect, it } from "vitest";
import { buildIcs, parseIcs } from "../ics";
import type { Entry } from "../types";

const entry: Entry = {
  id: "e1",
  title: "Deep work, focus; ok",
  start: 540,
  end: 630,
  category: "work",
  notes: "line one\nline two",
  reminder: 10,
  repeat: { type: "weekdays" },
  startDate: "2026-11-23",
};

describe("ICS export and import", () => {
  it("writes a VEVENT with recurrence and reminder", () => {
    const ics = buildIcs([entry]);
    expect(ics).toContain("DTSTART:20261123T090000");
    expect(ics).toContain("DTEND:20261123T103000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
    expect(ics).toContain("TRIGGER:-PT10M");
    expect(ics).toContain("SUMMARY:Deep work\\, focus\\; ok");
  });

  it("reads back events written by the exporter", () => {
    const events = parseIcs(buildIcs([{ ...entry, repeat: { type: "none" }, reminder: null }]));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      title: "Deep work, focus; ok",
      date: "2026-11-23",
      start: 540,
      end: 630,
      notes: "line one\nline two",
      category: "work",
    });
  });

  it("unfolds long lines and ignores events without a start", () => {
    const text = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART;TZID=Asia/Tehran:20261201T080000",
      "DTEND;TZID=Asia/Tehran:20261201T093000",
      "SUMMARY:Very long",
      " title here",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "SUMMARY:No start",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const events = parseIcs(text);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Very longtitle here");
    expect(events[0].start).toBe(480);
    expect(events[0].end).toBe(570);
  });
});
