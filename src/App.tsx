import { useCallback, useEffect, useRef, useState } from "react";
import { DayView } from "./components/DayView";
import { EntryForm, type EditorState } from "./components/EntryForm";
import { ReviewView } from "./components/ReviewView";
import { SettingsView } from "./components/SettingsView";
import { TemplatesView } from "./components/TemplatesView";
import { WeekView } from "./components/WeekView";
import { Widget } from "./components/Widget";
import { formatDate, t, type Key } from "./lib/i18n";
import { dueReminders } from "./lib/reminders";
import { loadData, saveData } from "./lib/storage";
import { addDays, dateKey } from "./lib/time";
import type { PlannerData } from "./lib/types";

type Tab = "day" | "week" | "review" | "templates" | "settings";

const TABS: Array<{ id: Tab; key: Key }> = [
  { id: "day", key: "tabDay" },
  { id: "week", key: "tabWeek" },
  { id: "review", key: "tabReview" },
  { id: "templates", key: "tabTemplates" },
  { id: "settings", key: "tabSettings" },
];

interface Banner {
  id: number;
  text: string;
}

const STORAGE_KEY = "day-planner:v1";

export default function App() {
  const [data, setData] = useState<PlannerData>(() => loadData());
  const [tab, setTab] = useState<Tab>("day");
  const [today, setToday] = useState(() => dateKey(new Date()));
  const [date, setDate] = useState(today);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const firedRef = useRef(new Set<string>());
  const entriesRef = useRef(data.entries);
  entriesRef.current = data.entries;
  const isWidget = new URLSearchParams(window.location.search).has("widget");

  const update = useCallback((fn: (d: PlannerData) => PlannerData) => setData(fn), []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    const lang = data.lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    document.title = isWidget ? t(lang, "widgetTitle") : t(lang, "appName");
  }, [data.lang, isWidget]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setData(loadData());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setToday(dateKey(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const due = dueReminders(entriesRef.current, dateKey(now), now.getHours() * 60 + now.getMinutes(), firedRef.current);
      for (const reminder of due) {
        const text = t(data.lang, "reminderFired", { title: reminder.entry.title, time: reminder.time });
        setBanners((list) => [...list, { id: Date.now() + Math.random(), text }]);
        notify(text);
      }
    };
    check();
    const id = setInterval(check, 15_000);
    return () => clearInterval(id);
  }, [data.lang]);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setTimeout(() => setBanners((list) => list.slice(1)), 8_000);
    return () => clearTimeout(timer);
  }, [banners]);

  if (isWidget) {
    return <Widget data={data} lang={data.lang} update={update} />;
  }

  const lang = data.lang;
  const step = tab === "week" ? 7 : 1;
  const isToday = date === today;
  const sharedProps = { data, lang, date, update };

  return (
    <div className="app">
      <header className="topbar">
        <h1>{t(lang, "appName")}</h1>
        {tab !== "settings" && (
          <div className="date-nav">
            <button type="button" className="icon-btn" aria-label={t(lang, "previous")} onClick={() => setDate(addDays(date, -step))}>
              {lang === "fa" ? "›" : "‹"}
            </button>
            <button
              type="button"
              className="date-label"
              onClick={() => setDate(today)}
              disabled={isToday}
              title={t(lang, "today")}
            >
              {formatDate(lang, date)}
            </button>
            <button type="button" className="icon-btn" aria-label={t(lang, "next")} onClick={() => setDate(addDays(date, step))}>
              {lang === "fa" ? "‹" : "›"}
            </button>
          </div>
        )}
      </header>

      <div className="banners" aria-live="polite">
        {banners.map((b) => (
          <div key={b.id} className="banner">
            <span>{b.text}</span>
            <button type="button" className="ghost" onClick={() => setBanners((list) => list.filter((x) => x.id !== b.id))}>
              {t(lang, "dismiss")}
            </button>
          </div>
        ))}
      </div>

      <main className="content">
        {tab === "day" && (
          <DayView
            {...sharedProps}
            onEdit={(entry) => setEditor({ date, entry })}
            onCreate={(start) => setEditor({ date, start })}
          />
        )}
        {tab === "week" && (
          <WeekView
            {...sharedProps}
            onSelectDate={(d) => {
              setDate(d);
              setTab("day");
            }}
          />
        )}
        {tab === "review" && <ReviewView {...sharedProps} />}
        {tab === "templates" && <TemplatesView {...sharedProps} />}
        {tab === "settings" && <SettingsView data={data} lang={lang} update={update} />}
      </main>

      {tab === "day" && (
        <button
          type="button"
          className="fab"
          aria-label={t(lang, "addBlock")}
          onClick={() => setEditor({ date })}
        >
          +
        </button>
      )}

      <nav className="tabbar" aria-label="Main">
        {TABS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => setTab(item.id)}
          >
            {t(lang, item.key)}
          </button>
        ))}
      </nav>

      {editor && (
        <EntryForm
          lang={lang}
          data={data}
          editor={editor}
          update={update}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}

function notify(text: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(text);
  } catch {
    // Some mobile browsers only allow notifications through a service worker; the in-app banner still shows.
  }
}
