import { useEffect, useState } from "react";
import { categoryLabel, formatDate, t, weekdayShort } from "../lib/i18n";
import { lastNDates } from "../lib/recurrence";
import { completionRate, dayStats } from "../lib/stats";
import { durationLabel, parseDateKey } from "../lib/time";
import { CATEGORIES } from "../lib/types";
import type { ViewProps } from "./shared";

export function ReviewView({ data, lang, date, update }: ViewProps) {
  const stats = dayStats(data, date);
  const rate = completionRate(stats);
  const savedNote = data.reviews[date] ?? "";
  const [note, setNote] = useState(savedNote);

  useEffect(() => {
    setNote(savedNote);
  }, [date, savedNote]);

  function saveNote() {
    update((d) => ({ ...d, reviews: { ...d.reviews, [date]: note.trim() } }));
  }

  const last7 = lastNDates(date, 7).map((day) => ({ day, stats: dayStats(data, day) }));

  return (
    <section className="review-view">
      <h2 className="section-title">
        {t(lang, "dayReview")} · {formatDate(lang, date)}
      </h2>

      <div className="stats-row">
        <div className="stat">
          <span className="stat-value">{rate}%</span>
          <span className="stat-label">{t(lang, "completion")}</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {stats.done}/{stats.total}
          </span>
          <span className="stat-label">{t(lang, "blocksCount")}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{durationLabel(stats.doneMinutes, lang)}</span>
          <span className="stat-label">{t(lang, "doneHours")}</span>
        </div>
      </div>

      <h3 className="subsection-title">{t(lang, "byCategory")}</h3>
      {stats.plannedMinutes === 0 ? (
        <p className="empty">{t(lang, "noData")}</p>
      ) : (
        <ul className="bars">
          {CATEGORIES.filter((c) => stats.byCategory[c] > 0).map((c) => {
            const pct = Math.round((stats.byCategory[c] / stats.plannedMinutes) * 100);
            return (
              <li key={c} className={`bar-row cat-${c}`}>
                <span className="bar-label">{categoryLabel(lang, c)}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${pct}%` }} />
                </span>
                <span className="bar-value">{durationLabel(stats.byCategory[c], lang)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <label className="field">
        <span>{t(lang, "reviewNote")}</span>
        <textarea
          rows={4}
          value={note}
          placeholder={t(lang, "reviewNotePlaceholder")}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button type="button" className="primary wide" onClick={saveNote} disabled={note.trim() === savedNote}>
        {t(lang, "saveNote")}
      </button>

      <h3 className="subsection-title">{t(lang, "last7")}</h3>
      <ul className="bars">
        {last7.map(({ day, stats: s }) => {
          const r = completionRate(s);
          return (
            <li key={day} className={`bar-row${day === date ? " is-current" : ""}`}>
              <span className="bar-label">{weekdayShort(lang, parseDateKey(day).getDay())}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${r}%` }} />
              </span>
              <span className="bar-value">{s.total > 0 ? `${r}%` : "—"}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
