import type { Category, Entry, PlannerData } from "./types";
import { CATEGORIES } from "./types";
import { completionKey, entriesForDate } from "./recurrence";

export interface DayStats {
  date: string;
  total: number;
  done: number;
  plannedMinutes: number;
  doneMinutes: number;
  byCategory: Record<Category, number>;
}

export function dayStats(data: PlannerData, date: string): DayStats {
  const entries = entriesForDate(data.entries, date);
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  let done = 0;
  let plannedMinutes = 0;
  let doneMinutes = 0;
  for (const entry of entries) {
    const minutes = entry.end - entry.start;
    plannedMinutes += minutes;
    byCategory[entry.category] += minutes;
    if (isDone(data, entry, date)) {
      done += 1;
      doneMinutes += minutes;
    }
  }
  return { date, total: entries.length, done, plannedMinutes, doneMinutes, byCategory };
}

export function isDone(data: PlannerData, entry: Entry, date: string): boolean {
  return data.completed[completionKey(entry.id, date)] === true;
}

export function completionRate(stats: DayStats): number {
  return stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);
}
