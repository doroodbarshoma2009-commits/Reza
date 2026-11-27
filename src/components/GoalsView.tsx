import { useState } from "react";
import { deedDoneKey, deedStreak, isDeedDone, openGoalsCount, sortGoals } from "../lib/goals";
import { t, type Key } from "../lib/i18n";
import { newId } from "../lib/storage";
import type { Goal, GoodDeed, Lang, PlannerData } from "../lib/types";
import type { Update } from "./shared";

interface GoalsViewProps {
  data: PlannerData;
  lang: Lang;
  date: string;
  update: Update;
}

const GOAL_SUGGESTIONS: Key[] = ["suggest_goal_1", "suggest_goal_2", "suggest_goal_3", "suggest_goal_4"];
const DEED_SUGGESTIONS: Key[] = ["suggest_deed_1", "suggest_deed_2", "suggest_deed_3", "suggest_deed_4"];

export function GoalsView({ data, lang, date, update }: GoalsViewProps) {
  const [goalTitle, setGoalTitle] = useState("");
  const [deedTitle, setDeedTitle] = useState("");
  const goals = sortGoals(data.goals);

  function addGoal(title: string) {
    const value = title.trim();
    if (!value) return;
    update((d) => ({ ...d, goals: [...d.goals, { id: newId(), title: value, done: false }] }));
    setGoalTitle("");
  }

  function toggleGoal(id: string) {
    update((d) => ({
      ...d,
      goals: d.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    }));
  }

  function removeGoal(id: string) {
    update((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }

  function addDeed(title: string) {
    const value = title.trim();
    if (!value) return;
    if (data.goodDeeds.some((d) => d.title === value)) {
      setDeedTitle("");
      return;
    }
    update((d) => ({ ...d, goodDeeds: [...d.goodDeeds, { id: newId(), title: value }] }));
    setDeedTitle("");
  }

  function toggleDeed(deed: GoodDeed) {
    const key = deedDoneKey(deed.id, date);
    update((d) => {
      const goodDeedDone = { ...d.goodDeedDone };
      if (goodDeedDone[key]) delete goodDeedDone[key];
      else goodDeedDone[key] = true;
      return { ...d, goodDeedDone };
    });
  }

  function removeDeed(id: string) {
    update((d) => {
      const goodDeedDone = Object.fromEntries(
        Object.entries(d.goodDeedDone).filter(([key]) => !key.startsWith(`${id}@`)),
      );
      return { ...d, goodDeeds: d.goodDeeds.filter((x) => x.id !== id), goodDeedDone };
    });
  }

  return (
    <section className="goals-view">
      <div className="card">
        <h2 className="section-title">
          {t(lang, "goalsTitle")}{" "}
          {data.goals.length > 0 && (
            <span className="muted small">· {t(lang, "goalsOpen", { n: openGoalsCount(data.goals) })}</span>
          )}
        </h2>
        <p className="hint">{t(lang, "goalsHint")}</p>
        <form
          className="todo-add"
          onSubmit={(e) => {
            e.preventDefault();
            addGoal(goalTitle);
          }}
        >
          <input
            value={goalTitle}
            placeholder={t(lang, "goalPlaceholder")}
            onChange={(e) => setGoalTitle(e.target.value)}
          />
          <button type="submit" className="primary" disabled={!goalTitle.trim()}>
            {t(lang, "addGoal")}
          </button>
        </form>
        {goals.length === 0 && (
          <>
            <p className="empty">{t(lang, "goalsEmpty")}</p>
            <SuggestionChips
              label={t(lang, "suggestGoals")}
              keys={GOAL_SUGGESTIONS}
              lang={lang}
              onPick={(text) => addGoal(text)}
            />
          </>
        )}
        {goals.length > 0 && (
          <ul className="todo-items">
            {goals.map((goal) => (
              <GoalRow key={goal.id} goal={goal} lang={lang} onToggle={toggleGoal} onRemove={removeGoal} />
            ))}
          </ul>
        )}
        {goals.length > 0 && goals.every((g) => g.done) && (
          <SuggestionChips
            label={t(lang, "suggestGoals")}
            keys={GOAL_SUGGESTIONS}
            lang={lang}
            onPick={(text) => addGoal(text)}
          />
        )}
      </div>

      <div className="card">
        <h2 className="section-title">{t(lang, "goodDeedsTitle")}</h2>
        <p className="hint">{t(lang, "goodDeedsHint")}</p>
        <form
          className="todo-add"
          onSubmit={(e) => {
            e.preventDefault();
            addDeed(deedTitle);
          }}
        >
          <input
            value={deedTitle}
            placeholder={t(lang, "goodDeedPlaceholder")}
            onChange={(e) => setDeedTitle(e.target.value)}
          />
          <button type="submit" className="primary" disabled={!deedTitle.trim()}>
            {t(lang, "addGoodDeed")}
          </button>
        </form>
        {data.goodDeeds.length === 0 ? (
          <>
            <p className="empty">{t(lang, "goodDeedsEmpty")}</p>
            <SuggestionChips
              label={t(lang, "suggestDeeds")}
              keys={DEED_SUGGESTIONS}
              lang={lang}
              onPick={(text) => addDeed(text)}
            />
          </>
        ) : (
          <ul className="deed-items">
            {data.goodDeeds.map((deed) => {
              const done = isDeedDone(data.goodDeedDone, deed.id, date);
              const streak = deedStreak(data.goodDeedDone, deed.id, date);
              return (
                <li key={deed.id} className={`deed-item${done ? " is-done" : ""}`}>
                  <button
                    type="button"
                    className="todo-check"
                    aria-pressed={done}
                    aria-label={t(lang, done ? "markUndone" : "markDone")}
                    onClick={() => toggleDeed(deed)}
                  >
                    {done ? "✓" : ""}
                  </button>
                  <div className="deed-body">
                    <span className="todo-title">{deed.title}</span>
                    <span className="streak">{streak > 0 ? t(lang, "streakDays", { n: streak }) : t(lang, "streakNone")}</span>
                  </div>
                  <button type="button" className="todo-remove" aria-label={t(lang, "delete")} onClick={() => removeDeed(deed.id)}>
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function GoalRow({
  goal,
  lang,
  onToggle,
  onRemove,
}: {
  goal: Goal;
  lang: Lang;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <li className={`todo-item${goal.done ? " is-done" : ""}`}>
      <button
        type="button"
        className="todo-check"
        aria-pressed={goal.done}
        aria-label={t(lang, goal.done ? "markUndone" : "markDone")}
        onClick={() => onToggle(goal.id)}
      >
        {goal.done ? "✓" : ""}
      </button>
      <span className="todo-title">{goal.title}</span>
      <button type="button" className="todo-remove" aria-label={t(lang, "delete")} onClick={() => onRemove(goal.id)}>
        ×
      </button>
    </li>
  );
}

function SuggestionChips({
  label,
  keys,
  lang,
  onPick,
}: {
  label: string;
  keys: Key[];
  lang: Lang;
  onPick: (text: string) => void;
}) {
  return (
    <div className="suggestions">
      <span className="muted small">{label}</span>
      <div className="chips">
        {keys.map((key) => (
          <button type="button" key={key} className="chip" onClick={() => onPick(t(lang, key))}>
            {t(lang, key)}
          </button>
        ))}
      </div>
    </div>
  );
}
