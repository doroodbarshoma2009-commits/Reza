import { useEffect, useMemo, useState } from "react";
import { categoryLabel, formatDate, t } from "../lib/i18n";
import { completionKey, entriesForDate } from "../lib/recurrence";
import { isDone } from "../lib/stats";
import { dateKey, durationLabel, minutesToHHMM } from "../lib/time";
import type { Entry, Lang, PlannerData } from "../lib/types";
import type { Update } from "./shared";
import { TodoList } from "./TodoList";

interface WidgetProps {
  data: PlannerData;
  lang: Lang;
  update: Update;
}

export function Widget({ data, lang, update }: WidgetProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const today = dateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const entries = useMemo(() => entriesForDate(data.entries, today), [data.entries, today]);
  const current = entries.find((e) => e.start <= nowMinutes && nowMinutes < e.end);
  const next = entries.find((e) => e.start > nowMinutes);
  const doneCount = entries.filter((e) => isDone(data, e, today)).length;
  const percent = entries.length ? Math.round((doneCount / entries.length) * 100) : 0;

  function toggle(entry: Entry) {
    const key = completionKey(entry.id, today);
    update((d) => {
      const completed = { ...d.completed };
      if (completed[key]) delete completed[key];
      else completed[key] = true;
      return { ...d, completed };
    });
  }

  return (
    <main className="board">
      <header className="board-head">
        <div>
          <h1 className="board-title">{t(lang, "boardTitle")}</h1>
          <span className="muted">{formatDate(lang, today)}</span>
        </div>
        <span className="board-clock">{minutesToHHMM(nowMinutes)}</span>
      </header>

      <div className="progress" aria-label={`${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="muted small">{t(lang, "blocksDone", { done: doneCount, total: entries.length })}</p>

      <div className="board-now">
        <NowCard
          lang={lang}
          label={t(lang, "widgetNow")}
          entry={current}
          fallback={t(lang, "widgetNothingNow")}
          done={current ? isDone(data, current, today) : false}
          onToggle={toggle}
        />
        <NowCard
          lang={lang}
          label={t(lang, "widgetNext")}
          entry={next}
          fallback={t(lang, "widgetNothingNext")}
          done={next ? isDone(data, next, today) : false}
          onToggle={toggle}
          remaining={next ? next.start - nowMinutes : undefined}
        />
      </div>

      <section className="board-section">
        <h2 className="section-title">{t(lang, "scheduleTitle")}</h2>
        {entries.length === 0 ? (
          <p className="empty">{t(lang, "noScheduleToday")}</p>
        ) : (
          <ul className="agenda">
            {entries.map((e) => {
              const done = isDone(data, e, today);
              const isCurrent = current?.id === e.id;
              return (
                <li key={e.id} className={`agenda-item cat-${e.category}${done ? " is-done" : ""}${isCurrent ? " is-current" : ""}`}>
                  <button
                    type="button"
                    className="agenda-check"
                    aria-pressed={done}
                    aria-label={t(lang, done ? "markUndone" : "markDone")}
                    onClick={() => toggle(e)}
                  >
                    {done ? "✓" : ""}
                  </button>
                  <span className="agenda-time">
                    {minutesToHHMM(e.start)}–{minutesToHHMM(e.end)}
                  </span>
                  <span className="agenda-title">
                    {e.title}
                    <span className="muted small"> · {categoryLabel(lang, e.category)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <TodoList lang={lang} date={today} todos={data.todos} update={update} large />
    </main>
  );
}

interface NowCardProps {
  lang: Lang;
  label: string;
  entry: Entry | undefined;
  fallback: string;
  done: boolean;
  onToggle: (entry: Entry) => void;
  remaining?: number;
}

function NowCard({ lang, label, entry, fallback, done, onToggle, remaining }: NowCardProps) {
  if (!entry) {
    return (
      <section className="now-card is-empty">
        <span className="widget-label">{label}</span>
        <p className="muted">{fallback}</p>
      </section>
    );
  }
  return (
    <section className={`now-card cat-${entry.category}${done ? " is-done" : ""}`}>
      <span className="widget-label">
        {label} · {categoryLabel(lang, entry.category)}
      </span>
      <strong className="now-title">{entry.title}</strong>
      <span className="muted small">
        {minutesToHHMM(entry.start)} – {minutesToHHMM(entry.end)}
        {remaining !== undefined && remaining > 0 ? ` · ${durationLabel(remaining, lang)}` : ""}
      </span>
      <button type="button" className={done ? "secondary wide" : "primary wide"} onClick={() => onToggle(entry)}>
        {done ? t(lang, "markUndone") : t(lang, "markDone")}
      </button>
    </section>
  );
}
