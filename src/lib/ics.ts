import type { Category, Entry, Repeat } from "./types";
import { CATEGORIES } from "./types";
import { minutesToHHMM } from "./time";
import { newId } from "./storage";

const RRULE_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function icsDate(key: string): string {
  return key.replace(/-/g, "");
}

function icsDateTime(key: string, minutes: number): string {
  const [h, m] = minutesToHHMM(minutes).split(":");
  return `${icsDate(key)}T${h}${m}00`;
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function unescapeText(text: string): string {
  return text.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
}

function rruleFor(repeat: Repeat): string | null {
  switch (repeat.type) {
    case "none":
      return null;
    case "daily":
      return "FREQ=DAILY";
    case "weekdays":
      return "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
    case "weekly":
      return `FREQ=WEEKLY;BYDAY=${repeat.days.map((d) => RRULE_DAYS[d]).join(",")}`;
  }
}

/** Builds an iCalendar document with one VEVENT per entry (recurring entries keep their RRULE). */
export function buildIcs(entries: Entry[], calendarName = "Day Planner"): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Day Planner//EN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "CALSCALE:GREGORIAN",
  ];
  for (const entry of entries) {
    const rule = rruleFor(entry.repeat);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${entry.id}@day-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDateTime(entry.startDate, entry.start)}`,
      `DTEND:${icsDateTime(entry.startDate, entry.end)}`,
      `SUMMARY:${escapeText(entry.title)}`,
      `CATEGORIES:${entry.category}`,
    );
    if (entry.notes) lines.push(`DESCRIPTION:${escapeText(entry.notes)}`);
    if (rule) lines.push(`RRULE:${rule}`);
    if (entry.reminder !== null) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(entry.title)}`,
        `TRIGGER:-PT${entry.reminder}M`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export interface ImportedEvent {
  title: string;
  date: string;
  start: number;
  end: number;
  notes: string;
  category: Category;
}

function parseIcsDateTime(value: string): { date: string; minutes: number | null } | null {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  if (match[4] === undefined) return { date, minutes: null };
  return { date, minutes: Number(match[4]) * 60 + Number(match[5]) };
}

/**
 * Reads VEVENTs from an .ics file. Times are taken as local wall-clock times (any TZID or Z suffix is ignored).
 * Recurring events are imported as their first occurrence only.
 */
export function parseIcs(text: string): ImportedEvent[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events: ImportedEvent[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) {
        const event = toImported(current);
        if (event) events.push(event);
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const name = line.slice(0, colon).split(";")[0].toUpperCase();
    current[name] = line.slice(colon + 1);
  }
  return events;
}

function toImported(fields: Record<string, string>): ImportedEvent | null {
  const start = parseIcsDateTime(fields.DTSTART ?? "");
  if (!start) return null;
  const endParsed = parseIcsDateTime(fields.DTEND ?? "");
  const startMinutes = start.minutes ?? 9 * 60;
  let endMinutes = endParsed?.minutes ?? startMinutes + 60;
  if (endMinutes <= startMinutes) endMinutes = Math.min(24 * 60, startMinutes + 30);
  const category = CATEGORIES.includes(fields.CATEGORIES as Category) ? (fields.CATEGORIES as Category) : "personal";
  return {
    title: unescapeText(fields.SUMMARY ?? "") || "Untitled",
    date: start.date,
    start: startMinutes,
    end: endMinutes,
    notes: unescapeText(fields.DESCRIPTION ?? ""),
    category,
  };
}

export function importedToEntry(event: ImportedEvent): Entry {
  return {
    id: newId(),
    title: event.title,
    start: event.start,
    end: event.end,
    category: event.category,
    notes: event.notes,
    reminder: null,
    repeat: { type: "none" },
    startDate: event.date,
  };
}