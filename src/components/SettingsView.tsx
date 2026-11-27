import { useRef, useState } from "react";
import { buildIcs, importedToEntry, parseIcs } from "../lib/ics";
import { t } from "../lib/i18n";
import { emptyData } from "../lib/storage";
import type { Lang } from "../lib/types";
import type { Update } from "./shared";
import type { PlannerData } from "../lib/types";

interface SettingsViewProps {
  data: PlannerData;
  lang: Lang;
  update: Update;
}

export function SettingsView({ data, lang, update }: SettingsViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    "Notification" in window ? Notification.permission : "unsupported",
  );

  function setLang(next: Lang) {
    update((d) => ({ ...d, lang: next }));
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  function exportCalendar() {
    const blob = new Blob([buildIcs(data.entries)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "day-planner.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importCalendar(file: File) {
    const events = parseIcs(await file.text());
    if (events.length === 0) {
      setMessage(t(lang, "importNone"));
      return;
    }
    const entries = events.map(importedToEntry);
    update((d) => ({ ...d, entries: [...d.entries, ...entries] }));
    setMessage(t(lang, "importedCount", { n: entries.length }));
  }

  function clearAll() {
    if (!window.confirm(t(lang, "clearDataConfirm"))) return;
    update(() => ({ ...emptyData(), lang }));
  }

  const notificationText =
    permission === "granted"
      ? t(lang, "notificationsOn")
      : permission === "denied"
        ? t(lang, "notificationsDenied")
        : permission === "unsupported"
          ? t(lang, "notificationsUnsupported")
          : t(lang, "notificationsEnable");

  return (
    <section className="settings-view">
      <h2 className="section-title">{t(lang, "tabSettings")}</h2>

      <div className="card">
        <h3 className="subsection-title">{t(lang, "language")}</h3>
        <div className="segmented">
          <button type="button" className={data.lang === "fa" ? "selected" : ""} onClick={() => setLang("fa")}>
            فارسی
          </button>
          <button type="button" className={data.lang === "en" ? "selected" : ""} onClick={() => setLang("en")}>
            English
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="subsection-title">{t(lang, "notifications")}</h3>
        <button
          type="button"
          className="primary wide"
          onClick={enableNotifications}
          disabled={permission === "granted" || permission === "denied" || permission === "unsupported"}
        >
          {notificationText}
        </button>
        <p className="hint">{t(lang, "notificationsNote")}</p>
      </div>

      <div className="card">
        <h3 className="subsection-title">{t(lang, "exportIcs")}</h3>
        <div className="stack">
          <button type="button" className="secondary wide" onClick={exportCalendar}>
            {t(lang, "exportIcs")}
          </button>
          <button type="button" className="secondary wide" onClick={() => fileRef.current?.click()}>
            {t(lang, "importIcs")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".ics,text/calendar"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importCalendar(file);
              e.target.value = "";
            }}
          />
        </div>
        {message && <p className="hint">{message}</p>}
        <p className="hint">{t(lang, "calendarNote")}</p>
      </div>

      <div className="card">
        <h3 className="subsection-title">{t(lang, "homeScreenTitle")}</h3>
        <p className="hint">{t(lang, "homeScreenTip")}</p>
      </div>

      <div className="card">
        <h3 className="subsection-title">{t(lang, "installTitle")}</h3>
        <p className="hint">{t(lang, "installSteps")}</p>
        <p className="hint">{t(lang, "widgetHint")}</p>
        <a className="secondary wide link-button" href="/?widget=1">
          {t(lang, "openWidget")}
        </a>
      </div>

      <div className="card">
        <p className="hint">{t(lang, "dataNote")}</p>
        <button type="button" className="danger wide" onClick={clearAll}>
          {t(lang, "clearData")}
        </button>
      </div>
    </section>
  );
}
