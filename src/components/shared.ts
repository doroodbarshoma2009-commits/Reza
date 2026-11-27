import type { Lang, PlannerData } from "../lib/types";

export type Update = (fn: (data: PlannerData) => PlannerData) => void;

export interface ViewProps {
  data: PlannerData;
  lang: Lang;
  date: string;
  update: Update;
}

export const HOUR_PX = 60;
