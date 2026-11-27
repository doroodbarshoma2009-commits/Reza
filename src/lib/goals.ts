import type { Goal, GoodDeed } from "./types";
import { addDays } from "./time";

export function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => Number(a.done) - Number(b.done));
}

export function deedDoneKey(deedId: string, date: string): string {
  return `${deedId}@${date}`;
}

export function isDeedDone(done: Record<string, true>, deedId: string, date: string): boolean {
  return done[deedDoneKey(deedId, date)] === true;
}

/**
 * Counts consecutive days ending on `anchor` where the deed was checked.
 * If today is not done yet, the streak still counts through yesterday.
 */
export function deedStreak(done: Record<string, true>, deedId: string, anchor: string): number {
  let date = anchor;
  if (!isDeedDone(done, deedId, date)) {
    date = addDays(anchor, -1);
  }
  let streak = 0;
  while (isDeedDone(done, deedId, date)) {
    streak += 1;
    date = addDays(date, -1);
  }
  return streak;
}

export function openGoalsCount(goals: Goal[]): number {
  return goals.filter((g) => !g.done).length;
}

export function deedsDoneToday(deeds: GoodDeed[], done: Record<string, true>, date: string): number {
  return deeds.filter((d) => isDeedDone(done, d.id, date)).length;
}
