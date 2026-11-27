export type Category = "work" | "study" | "health" | "personal" | "rest";

export const CATEGORIES: Category[] = ["work", "study", "health", "personal", "rest"];

export type Repeat =
  | { type: "none" }
  | { type: "daily" }
  | { type: "weekdays" }
  | { type: "weekly"; days: number[] };

export interface Entry {
  id: string;
  title: string;
  start: number;
  end: number;
  category: Category;
  notes: string;
  reminder: number | null;
  repeat: Repeat;
  startDate: string;
}

export interface TemplateItem {
  title: string;
  start: number;
  end: number;
  category: Category;
  notes: string;
}

export interface Template {
  id: string;
  name: string;
  items: TemplateItem[];
}

export interface Todo {
  id: string;
  title: string;
  date: string;
  done: boolean;
}

/** Long-lived goals tracked as a simple checklist. */
export interface Goal {
  id: string;
  title: string;
  done: boolean;
}

/** A recurring good-deed habit the user can check off each day. */
export interface GoodDeed {
  id: string;
  title: string;
}

export type Lang = "fa" | "en";

export interface PlannerData {
  version: 1;
  entries: Entry[];
  templates: Template[];
  completed: Record<string, true>;
  reviews: Record<string, string>;
  todos: Todo[];
  goals: Goal[];
  goodDeeds: GoodDeed[];
  goodDeedDone: Record<string, true>;
  lang: Lang;
}
