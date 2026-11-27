import { useEffect, useMemo, useRef, useState } from "react";
import { categoryLabel, t } from "../lib/i18n";
import { completionKey, entriesForDate } from "../lib/recurrence";
import { layoutSpans } from "../lib/layout";
import { dayStats, completionRate, isDone } from "../lib/stats";
import { durationLabel, dateKey, minutesToHHMM, pad2 } from "../lib/time";
import type { Entry } from "../lib/types";
import { HOUR_PX, type ViewProps } from "./shared";
import { TodoList } from "./TodoList";
import { deedsDoneToday } from "../lib/goals";

interface DayViewProps extends ViewProps {
  onEdit: (entry: Entry) => void;
  onCreate: (start: number) => void;
}

export function DayView({ data, lang, date, update, onEdit, onCreate }: DayViewProps) {
  const entries = useMemo(() => entriesForDate(data.entries, date), [data.entries, date]);
  const stats = dayStats(data, date);
  const rate = completionRate(stats);
  const isToday = date === dateKey(new Date());
  const nowMinutes = useNowMinutes(isToday);
  const placed = useMemo(
    () => layoutSpans(entries.map((e) => ({ id: e.id, start: e.start, end: e.end }))),
    [entries],
  );
  const placedById = new Map(placed.map((p) => [p.id, p]));
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isToday || !timelineRef.current) return;
    const timelineTop = timelineRef.current.getBoundingClientRect().top + window.scrollY;
    const target = timelineTop + Math.max(0, nowMinutes / 60 - 2) * HOUR_PX;
    window.scrollTo({ top: target });
  }, [date]);

  function toggleDone(entry: Entry) {
    const key = completionKey(entry.id, date);
    update((d) => {
      const completed = { ...d.completed };
      if (completed[key]) delete completed[key];
      else completed[key] = true;
      return { ...d, completed };
    });
  }

  return (
    <section className="day-view">
      <div className="stats-row">
        <Stat label={t(lang, "blocksDone", { done: stats.done, total: stats.total })} value={`${rate}%`} />
        <Stat label={t(lang, "plannedHours")} value={durationLabel(stats.plannedMinutes, lang)} />
        <Stat label={t(lang, "doneHours")} value={durationLabel(stats.doneMinutes, lang)} />
      </div>

      {data.goodDeeds.length > 0 && (
        <div className="good-deeds-strip">
          <span className="muted small">{t(lang, "goodDeedsTitle")}</span>
          <strong>
            {deedsDoneToday(data.goodDeeds, data.goodDeedDone, date)}/{data.goodDeeds.length}
          </strong>
        </div>
      )}

      <TodoList lang={lang} date={date} todos={data.todos} update={update} />

      <div className="timeline" ref={timelineRef} style={{ height: 24 * HOUR_PX }}>
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            className="hour-row"
            style={{ top: h * HOUR_PX, height: HOUR_PX }}
            role="button"
            tabIndex={0}
            aria-label={`${pad2(h)}:00`}
            onClick={() => onCreate(h * 60)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCreate(h * 60);
            }}
          >
            <span className="hour-label">{pad2(h)}:00</span>
          </div>
        ))}

        {entries.map((entry) => {
          const p = placedById.get(entry.id);
          const column = p?.column ?? 0;
          const columns = p?.columns ?? 1;
          const width = 100 / columns;
          const done = isDone(data, entry, date);
          const height = Math.max(34, ((entry.end - entry.start) / 60) * HOUR_PX - 3);
          return (
            <div
              key={entry.id}
              className={`block cat-${entry.category}${done ? " is-done" : ""}`}
              style={{
                top: (entry.start / 60) * HOUR_PX + 1,
                height,
                left: `calc(${column * width}% + 52px)`,
                width: `calc(${width}% - 58px)`,
              }}
            >
              <button type="button" className="block-main" onClick={() => onEdit(entry)}>
                <span className="block-title">{entry.title}</span>
                <span className="block-time">
                  {minutesToHHMM(entry.start)} – {minutesToHHMM(entry.end)}
                </span>
              </button>
              <button
                type="button"
                className="check"
                aria-label={done ? t(lang, "markUndone") : t(lang, "markDone")}
                aria-pressed={done}
                onClick={() => toggleDone(entry)}
              >
                {done ? "✓" : ""}
              </button>
            </div>
          );
        })}

        {isToday && <div className="now-line" style={{ top: (nowMinutes / 60) * HOUR_PX }} />}
      </div>

      {entries.length === 0 && <p className="empty">{t(lang, "noBlocks")}</p>}

      {entries.length > 0 && (
        <ul className="category-legend">
          {Array.from(new Set(entries.map((e) => e.category))).map((c) => (
            <li key={c} className={`cat-${c}`}>
              {categoryLabel(lang, c)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function useNowMinutes(enabled: boolean): number {
  const compute = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };
  const [minutes, setMinutes] = useState(compute);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setMinutes(compute()), 30_000);
    return () => clearInterval(id);
  }, [enabled]);
  return minutes;
}
