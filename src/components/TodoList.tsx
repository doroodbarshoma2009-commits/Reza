import { useState } from "react";
import { t } from "../lib/i18n";
import { newId } from "../lib/storage";
import { sortTodos, todosForDate } from "../lib/todos";
import type { Lang, Todo } from "../lib/types";
import type { Update } from "./shared";

interface TodoListProps {
  lang: Lang;
  date: string;
  todos: Todo[];
  update: Update;
  large?: boolean;
}

export function TodoList({ lang, date, todos, update, large = false }: TodoListProps) {
  const [title, setTitle] = useState("");
  const items = sortTodos(todosForDate(todos, date));

  function add() {
    const value = title.trim();
    if (!value) return;
    update((d) => ({ ...d, todos: [...d.todos, { id: newId(), title: value, date, done: false }] }));
    setTitle("");
  }

  function toggle(id: string) {
    update((d) => ({ ...d, todos: d.todos.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
  }

  function remove(id: string) {
    update((d) => ({ ...d, todos: d.todos.filter((x) => x.id !== id) }));
  }

  return (
    <section className={`todo-list${large ? " is-large" : ""}`}>
      <h3 className="subsection-title">
        {t(lang, "todosTitle")} {items.length > 0 && <span className="muted">({items.filter((x) => !x.done).length})</span>}
      </h3>
      <form
        className="todo-add"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input value={title} placeholder={t(lang, "todoPlaceholder")} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit" className="primary" disabled={!title.trim()}>
          {t(lang, "addTodo")}
        </button>
      </form>
      {items.length === 0 ? (
        <p className="empty">{t(lang, "todosEmpty")}</p>
      ) : (
        <ul className="todo-items">
          {items.map((todo) => (
            <li key={todo.id} className={`todo-item${todo.done ? " is-done" : ""}`}>
              <button
                type="button"
                className="todo-check"
                aria-pressed={todo.done}
                aria-label={t(lang, todo.done ? "markUndone" : "markDone")}
                onClick={() => toggle(todo.id)}
              >
                {todo.done ? "✓" : ""}
              </button>
              <span className="todo-title">{todo.title}</span>
              <button type="button" className="todo-remove" aria-label={t(lang, "delete")} onClick={() => remove(todo.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
