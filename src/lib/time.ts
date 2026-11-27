export const MINUTES_PER_DAY = 24 * 60;

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function minutesToHHMM(minutes: number): string {
  const m = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(minutes)));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(h === 24 ? 0 : h)}:${pad2(mm)}`;
}

export function hhmmToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
  return h * 60 + m;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function weekdayOf(key: string): number {
  return parseDateKey(key).getDay();
}

export function overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

export function durationLabel(minutes: number, lang: "fa" | "en"): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === "fa") {
    if (h && m) return `${h} ساعت و ${m} دقیقه`;
    if (h) return `${h} ساعت`;
    return `${m} دقیقه`;
  }
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
