import { useState } from "react";
import { categoryLabel, t } from "../lib/i18n";
import { entriesForDate } from "../lib/recurrence";
import { newId } from "../lib/storage";
import { minutesToHHMM } from "../lib/time";
import type { Entry, Template } from "../lib/types";
import type { ViewProps } from "./shared";

export function TemplatesView({ data, lang, date, update }: ViewProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const dayEntries = entriesForDate(data.entries, date);

  function saveTemplate() {
    if (dayEntries.length === 0) return setMessage(t(lang, "noBlocksToSave"));
    if (!name.trim()) return setMessage(t(lang, "templateName"));
    const template: Template = {
      id: newId(),
      name: name.trim(),
      items: dayEntries.map(({ title, start, end, category, notes }) => ({ title, start, end, category, notes })),
    };
    update((d) => ({ ...d, templates: [...d.templates, template] }));
    setName("");
    setMessage(null);
  }

  function applyTemplate(template: Template) {
    if (!window.confirm(t(lang, "applyTemplateConfirm"))) return;
    const created: Entry[] = template.items.map((item) => ({
      ...item,
      id: newId(),
      reminder: null,
      repeat: { type: "none" },
      startDate: date,
    }));
    update((d) => ({ ...d, entries: [...d.entries, ...created] }));
  }

  function deleteTemplate(id: string) {
    update((d) => ({ ...d, templates: d.templates.filter((tpl) => tpl.id !== id) }));
  }

  return (
    <section className="templates-view">
      <h2 className="section-title">{t(lang, "templatesTitle")}</h2>
      <p className="hint">{t(lang, "templatesHint")}</p>

      <div className="template-create">
        <input
          value={name}
          placeholder={t(lang, "templateName")}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="button" className="primary" onClick={saveTemplate}>
          {t(lang, "saveAsTemplate")}
        </button>
      </div>
      {message && <p className="error">{message}</p>}

      {data.templates.length === 0 ? (
        <p className="empty">{t(lang, "noTemplates")}</p>
      ) : (
        <ul className="template-list">
          {data.templates.map((tpl) => (
            <li key={tpl.id} className="template-card">
              <div className="template-head">
                <strong>{tpl.name}</strong>
                <span className="muted">{t(lang, "templateItems", { n: tpl.items.length })}</span>
              </div>
              <ul className="template-items">
                {tpl.items.map((item, i) => (
                  <li key={i} className={`cat-${item.category}`}>
                    <span>
                      {minutesToHHMM(item.start)}–{minutesToHHMM(item.end)}
                    </span>{" "}
                    {item.title}{" "}
                    <span className="muted">({categoryLabel(lang, item.category)})</span>
                  </li>
                ))}
              </ul>
              <div className="template-actions">
                <button type="button" className="primary" onClick={() => applyTemplate(tpl)}>
                  {t(lang, "applyTemplate")}
                </button>
                <button type="button" className="danger" onClick={() => deleteTemplate(tpl.id)}>
                  {t(lang, "delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
