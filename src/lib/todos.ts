import type { Todo } from "./types";

export function todosForDate(todos: Todo[], date: string): Todo[] {
  return todos.filter((todo) => todo.date === date);
}

export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => Number(a.done) - Number(b.done));
}
