import { describe, expect, it } from "vitest";
import { sortTodos, todosForDate } from "../todos";
import type { Todo } from "../types";

const todos: Todo[] = [
  { id: "1", title: "نان", date: "2026-11-27", done: true },
  { id: "2", title: "ایمیل", date: "2026-11-28", done: false },
  { id: "3", title: "دارو", date: "2026-11-27", done: false },
];

describe("todos", () => {
  it("filters todos to a single date", () => {
    expect(todosForDate(todos, "2026-11-27").map((t) => t.id)).toEqual(["1", "3"]);
  });

  it("puts open tasks before completed ones without mutating input", () => {
    const sorted = sortTodos(todos);
    expect(sorted.map((t) => t.id)).toEqual(["2", "3", "1"]);
    expect(todos[0].id).toBe("1");
  });
});
