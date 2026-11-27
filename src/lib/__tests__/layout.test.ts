import { describe, expect, it } from "vitest";
import { layoutSpans } from "../layout";

describe("layoutSpans", () => {
  it("gives non-overlapping spans a single full-width column", () => {
    const result = layoutSpans([
      { id: "a", start: 0, end: 60 },
      { id: "b", start: 60, end: 120 },
    ]);
    expect(result.every((s) => s.columns === 1 && s.column === 0)).toBe(true);
  });

  it("splits overlapping spans into side-by-side columns", () => {
    const result = layoutSpans([
      { id: "a", start: 540, end: 660 },
      { id: "b", start: 600, end: 720 },
    ]);
    const a = result.find((s) => s.id === "a")!;
    const b = result.find((s) => s.id === "b")!;
    expect(a.column).not.toBe(b.column);
    expect(a.columns).toBe(2);
    expect(b.columns).toBe(2);
  });
});
