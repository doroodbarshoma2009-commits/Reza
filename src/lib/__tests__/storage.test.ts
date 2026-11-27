import { describe, expect, it } from "vitest";
import { emptyData, loadData, saveData } from "../storage";

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
}

describe("storage", () => {
  it("returns empty data when nothing is stored", () => {
    expect(loadData(memoryStorage())).toEqual(emptyData());
  });

  it("round-trips saved data", () => {
    const storage = memoryStorage();
    const data = { ...emptyData(), completed: { "x@2026-11-27": true as const }, lang: "en" as const };
    saveData(data, storage);
    expect(loadData(storage)).toEqual(data);
  });

  it("recovers from corrupted JSON", () => {
    expect(loadData(memoryStorage({ "day-planner:v1": "{not json" }))).toEqual(emptyData());
  });
});
