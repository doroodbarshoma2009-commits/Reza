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

export type Lang = "fa" | "en";

export interface PlannerData {
  version: 1;
  entries: Entry[];
  templates: Template[];
  completed: Record<string, true>;
  reviews: Record<string, string>;
  lang: Lang;
}
