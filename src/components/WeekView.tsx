import { weekDates, entriesForDate } from "../lib/recurrence";
import { t, weekdayShort } from "../lib/i18n";
import { completionRate, dayStats } from "../lib/stats";
import { minutesToHHMM, parseDateKey } from "../lib/time";
import type { ViewProps } from "./shared";

interface WeekViewProps extends ViewProps {
  onSelectDate: (date: string) => void;
}

export function WeekView({ data, lang, date, onSelectDate }: WeekViewProps) {
  const days = weekDates(date);
  return (
    <section className="week-view">
      {days.map((day) => {
        const entries = entriesForDate(data.entries, day);
        const stats = dayStats(data, day);
        const rate = completionRate(stats);
        const parsed = parseDateKey(day);
        return (
          <button
            type="button"
            key={day}
            className={`week-day${day === date ? " is-selected" : ""}`}
            onClick={() => onSelectDate(day)}
          >
            <span className="week-day-head">
              <span className="week-weekday">{weekdayShort(lang, parsed.getDay())}</span>
              <span className="week-date">{parsed.getDate()}</span>
              <span className="week-rate">{stats.total > 0 ? `${rate}%` : ""}</span>
            </span>
            {entries.length === 0 ? (
              <span className="week-empty">{t(lang, "noData")}</span>
            ) : (
              <span className="week-list">
                {entries.slice(0, 4).map((e) => (
                  <span key={e.id} className={`week-item cat-${e.category}`}>
                    <span className="week-item-time">{minutesToHHMM(e.start)}</span>
                    <span className="week-item-title">{e.title}</span>
                  </span>
                ))}
                {entries.length > 4 && <span className="week-more">+{entries.length - 4}</span>}
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}
