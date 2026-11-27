import type { PlannerData } from "./types";

const STORAGE_KEY = "day-planner:v1";

export function emptyData(): PlannerData {
  return { version: 1, entries: [], templates: [], completed: {}, reviews: {}, todos: [], goals: [], goodDeeds: [], goodDeedDone: {}, lang: "fa" };
}

export function loadData(storage: Pick<Storage, "getItem"> = localStorage): PlannerData {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<PlannerData>;
    return {
      ...emptyData(),
      ...parsed,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
      completed: parsed.completed ?? {},
      reviews: parsed.reviews ?? {},
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      goodDeeds: Array.isArray(parsed.goodDeeds) ? parsed.goodDeeds : [],
      goodDeedDone: parsed.goodDeedDone ?? {},
      version: 1,
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: PlannerData, storage: Pick<Storage, "setItem"> = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
