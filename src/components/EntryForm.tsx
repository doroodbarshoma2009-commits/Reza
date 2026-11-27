import { useMemo, useState } from "react";
import { categoryLabel, t, weekdayShort } from "../lib/i18n";
import { entriesForDate } from "../lib/recurrence";
import { newId } from "../lib/storage";
import { hhmmToMinutes, minutesToHHMM, overlaps, parseDateKey } from "../lib/time";
import { CATEGORIES, type Category, type Entry, type PlannerData, type Repeat, type Lang } from "../lib/types";
import type { Update } from "./shared";

export interface EditorState {
  date: string;
  entry?: Entry;
  start?: number;
}

interface EntryFormProps {
  lang: Lang;
  data: PlannerData;
  editor: EditorState;
  update: Update;
  onClose: () => void;
}

const REMINDER_OPTIONS = [null, 0, 5, 10, 15, 30, 60] as const;

export function EntryForm({ lang, data, editor, update, onClose }: EntryFormProps) {
  const existing = editor.entry;
  const initialStart = existing?.start ?? editor.start ?? 9 * 60;
  const initialEnd = existing?.end ?? Math.min(24 * 60, initialStart + 60);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [start, setStart] = useState(minutesToHHMM(initialStart));
  const [end, setEnd] = useState(minutesToHHMM(initialEnd));
  const [category, setCategory] = useState<Category>(existing?.category ?? "work");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [reminder, setReminder] = useState<string>(existing?.reminder == null ? "none" : String(existing.reminder));
  const [repeatType, setRepeatType] = useState<Repeat["type"]>(existing?.repeat.type ?? "none");
  const [weekdays, setWeekdays] = useState<number[]>(
    existing?.repeat.type === "weekly" ? existing.repeat.days : [parseDateKey(editor.date).getDay()],
  );
  const [error, setError] = useState<string | null>(null);

  const startMin = hhmmToMinutes(start);
  const endRaw = hhmmToMinutes(end);
  const endMin = endRaw === 0 && startMin !== null && startMin > 0 ? 24 * 60 : endRaw;

  const conflict = useMemo(() => {
    if (startMin === null || endMin === null || endMin <= startMin) return null;
    const others = entriesForDate(data.entries, editor.date).filter((e) => e.id !== existing?.id);
    return others.find((e) => overlaps({ start: startMin, end: endMin }, e)) ?? null;
  }, [data.entries, editor.date, existing?.id, startMin, endMin]);

  function buildRepeat(): Repeat {
    if (repeatType === "daily") return { type: "daily" };
    if (repeatType === "weekdays") return { type: "weekdays" };
    if (repeatType === "weekly") return { type: "weekly", days: [...weekdays].sort((a, b) => a - b) };
    return { type: "none" };
  }

  function save() {
    if (!title.trim()) return setError(t(lang, "noTitle"));
    if (startMin === null || endMin === null || endMin <= startMin) return setError(t(lang, "invalidTime"));
    if (repeatType === "weekly" && weekdays.length === 0) return setError(t(lang, "weekdaysPick"));

    const entry: Entry = {
      id: existing?.id ?? newId(),
      title: title.trim(),
      start: startMin,
      end: endMin,
      category,
      notes: notes.trim(),
      reminder: reminder === "none" ? null : Number(reminder),
      repeat: buildRepeat(),
      startDate: existing?.startDate ?? editor.date,
    };

    update((d) => ({
      ...d,
      entries: existing
        ? d.entries.map((e) => (e.id === existing.id ? entry : e))
        : [...d.entries, entry],
    }));
    onClose();
  }

  function remove() {
    if (!existing) return;
    const message = existing.repeat.type === "none" ? t(lang, "deleteConfirm") : t(lang, "recurringDeleteConfirm");
    if (!window.confirm(message)) return;
    update((d) => {
      const completed = Object.fromEntries(
        Object.entries(d.completed).filter(([key]) => !key.startsWith(`${existing.id}@`)),
      );
      return { ...d, entries: d.entries.filter((e) => e.id !== existing.id), completed };
    });
    onClose();
  }

  function toggleWeekday(day: number) {
    setWeekdays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]));
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <h2>{existing ? t(lang, "editBlock") : t(lang, "addBlock")}</h2>
          <button type="button" className="ghost" onClick={onClose}>
            {t(lang, "close")}
          </button>
        </header>

        <label className="field">
          <span>{t(lang, "title")}</span>
          <input
            value={title}
            placeholder={t(lang, "titlePlaceholder")}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={!existing}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>{t(lang, "start")}</span>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="field">
            <span>{t(lang, "end")}</span>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>

        <div className="field">
          <span>{t(lang, "category")}</span>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                className={`chip cat-${c}${category === c ? " selected" : ""}`}
                onClick={() => setCategory(c)}
              >
                {categoryLabel(lang, c)}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <label className="field">
            <span>{t(lang, "repeat")}</span>
            <select value={repeatType} onChange={(e) => setRepeatType(e.target.value as Repeat["type"])}>
              <option value="none">{t(lang, "repeatNone")}</option>
              <option value="daily">{t(lang, "repeatDaily")}</option>
              <option value="weekdays">{t(lang, "repeatWeekdays")}</option>
              <option value="weekly">{t(lang, "repeatWeekly")}</option>
            </select>
          </label>
          <label className="field">
            <span>{t(lang, "reminder")}</span>
            <select value={reminder} onChange={(e) => setReminder(e.target.value)}>
              {REMINDER_OPTIONS.map((opt) => (
                <option key={String(opt)} value={opt === null ? "none" : String(opt)}>
                  {opt === null ? t(lang, "reminderNone") : t(lang, "reminderAt", { n: opt })}
                </option>
              ))}
            </select>
          </label>
        </div>

        {repeatType === "weekly" && (
          <div className="field">
            <span>{t(lang, "weekdaysPick")}</span>
            <div className="chips">
              {[6, 0, 1, 2, 3, 4, 5].map((day) => (
                <button
                  type="button"
                  key={day}
                  className={`chip${weekdays.includes(day) ? " selected" : ""}`}
                  onClick={() => toggleWeekday(day)}
                >
                  {weekdayShort(lang, day)}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          <span>{t(lang, "notes")}</span>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {conflict && (
          <p className="warning">{t(lang, "overlapWarning", { title: conflict.title })}</p>
        )}
        {error && <p className="error">{error}</p>}

        <div className="sheet-actions">
          {existing && (
            <button type="button" className="danger" onClick={remove}>
              {t(lang, "delete")}
            </button>
          )}
          <button type="button" className="ghost" onClick={onClose}>
            {t(lang, "cancel")}
          </button>
          <button type="button" className="primary" onClick={save}>
            {t(lang, "save")}
          </button>
        </div>
      </div>
    </div>
  );
}
