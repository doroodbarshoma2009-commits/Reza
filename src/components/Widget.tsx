import { useEffect, useMemo, useState } from "react";
import { categoryLabel, formatDate, t } from "../lib/i18n";
import { completionKey, entriesForDate } from "../lib/recurrence";
import { isDone } from "../lib/stats";
import { dateKey, durationLabel, minutesToHHMM } from "../lib/time";
import type { Entry, Lang, PlannerData } from "../lib/types";
import type { Update } from "./shared";

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
    <main className="widget">
      <header className="widget-head">
        <span className="muted">{formatDate(lang, today)}</span>
        <span className="widget-clock">{minutesToHHMM(nowMinutes)}</span>
      </header>
      <div className="progress" aria-label={`${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="muted small">{t(lang, "blocksDone", { done: doneCount, total: entries.length })}</p>

      {entries.length > 0 && doneCount === entries.length && !next && !current ? (
        <p className="widget-finished">{t(lang, "widgetDayDone")}</p>
      ) : null}

      <WidgetCard
        lang={lang}
        label={t(lang, "widgetNow")}
        entry={current}
        fallback={t(lang, "widgetNothingNow")}
        done={current ? isDone(data, current, today) : false}
        onToggle={toggle}
      />
      <WidgetCard
        lang={lang}
        label={t(lang, "widgetNext")}
        entry={next}
        fallback={t(lang, "widgetNothingNext")}
        done={next ? isDone(data, next, today) : false}
        onToggle={toggle}
        showRemaining={next ? next.start - nowMinutes : undefined}
      />
    </main>
  );
}

interface WidgetCardProps {
  lang: Lang;
  label: string;
  entry: Entry | undefined;
  fallback: string;
  done: boolean;
  onToggle: (entry: Entry) => void;
  showRemaining?: number;
}

function WidgetCard({ lang, label, entry, fallback, done, onToggle, showRemaining }: WidgetCardProps) {
  if (!entry) {
    return (
      <section className="widget-card empty-card">
        <span className="widget-label">{label}</span>
        <p className="muted">{fallback}</p>
      </section>
    );
  }
  return (
    <section className={`widget-card cat-${entry.category}${done ? " is-done" : ""}`}>
      <span className="widget-label">
        {label} · {categoryLabel(lang, entry.category)}
      </span>
      <strong className="widget-title">{entry.title}</strong>
      <span className="muted small">
        {minutesToHHMM(entry.start)} – {minutesToHHMM(entry.end)}
        {showRemaining !== undefined && showRemaining > 0 ? ` · ${durationLabel(showRemaining, lang)}` : ""}
      </span>
      <button type="button" className={done ? "secondary wide" : "primary wide"} onClick={() => onToggle(entry)}>
        {done ? t(lang, "markUndone") : t(lang, "markDone")}
      </button>
    </section>
  );
}
