import type { Entry } from "./types";
import { addDays, parseDateKey, weekdayOf } from "./time";

export function occursOn(entry: Entry, date: string): boolean {
  if (entry.repeat.type === "none") return entry.startDate === date;
  if (date < entry.startDate) return false;
  const weekday = weekdayOf(date);
  switch (entry.repeat.type) {
    case "daily":
      return true;
    case "weekdays":
      return weekday >= 1 && weekday <= 5;
    case "weekly":
      return entry.repeat.days.includes(weekday);
  }
}

export function entriesForDate(entries: Entry[], date: string): Entry[] {
  return entries.filter((e) => occursOn(e, date)).sort((a, b) => a.start - b.start || a.end - b.end);
}

export function completionKey(entryId: string, date: string): string {
  return `${entryId}@${date}`;
}

export function describeRepeat(entry: Entry, lang: "fa" | "en"): string {
  const r = entry.repeat;
  if (r.type === "none") return lang === "fa" ? "یک‌بار" : "Once";
  if (r.type === "daily") return lang === "fa" ? "هر روز" : "Every day";
  if (r.type === "weekdays") return lang === "fa" ? "روزهای کاری (دوشنبه تا جمعه)" : "Weekdays";
  const names = lang === "fa" ? FA_WEEKDAYS : EN_WEEKDAYS;
  const separator = lang === "fa" ? "، " : ", ";
  return r.days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => names[d])
    .join(separator);
}

const FA_WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekDates(anchor: string): string[] {
  const d = parseDateKey(anchor);
  const offset = (d.getDay() + 6) % 7;
  const monday = addDays(anchor, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function lastNDates(anchor: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(anchor, -(n - 1 - i)));
}
