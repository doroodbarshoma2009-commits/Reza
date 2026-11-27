import type { Entry } from "./types";
import { completionKey, entriesForDate } from "./recurrence";
import { minutesToHHMM } from "./time";

export interface DueReminder {
  key: string;
  entry: Entry;
  time: string;
}

/**
 * Returns reminders whose trigger minute equals `nowMinutes` on `date`.
 * `fired` records keys already announced so each reminder fires once per occurrence.
 */
export function dueReminders(
  entries: Entry[],
  date: string,
  nowMinutes: number,
  fired: Set<string>,
): DueReminder[] {
  const due: DueReminder[] = [];
  for (const entry of entriesForDate(entries, date)) {
    if (entry.reminder === null) continue;
    if (entry.start - entry.reminder !== nowMinutes) continue;
    const key = completionKey(entry.id, date);
    if (fired.has(key)) continue;
    fired.add(key);
    due.push({ key, entry, time: minutesToHHMM(entry.start) });
  }
  return due;
}
