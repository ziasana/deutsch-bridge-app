export type DayBucket = 'today' | 'yesterday' | 'earlier';

export const BUCKET_LABEL: Record<DayBucket, string> = {
  today: 'Heute',
  yesterday: 'Gestern',
  earlier: 'Früher',
};

/** Groups by the viewer's local calendar day. */
export function dayBucket(iso: string, now = new Date()): DayBucket {
  const date = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (date >= startOfToday) return 'today';
  if (date >= startOfYesterday) return 'yesterday';
  return 'earlier';
}

// [singular, plural, seconds, article for "vor einer/einem …"]
const UNITS: [string, string, number, 'einer' | 'einem'][] = [
  ['Jahr', 'Jahren', 365 * 24 * 3600, 'einem'],
  ['Monat', 'Monaten', 30 * 24 * 3600, 'einem'],
  ['Woche', 'Wochen', 7 * 24 * 3600, 'einer'],
  ['Tag', 'Tagen', 24 * 3600, 'einem'],
  ['Stunde', 'Stunden', 3600, 'einer'],
  ['Minute', 'Minuten', 60, 'einer'],
];

/** "vor 5 Minuten" / "vor einer Stunde" (German, without depending on Intl.RelativeTimeFormat being available). */
export function relativeTimeDe(iso: string, now = new Date()): string {
  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  for (const [singular, plural, size, article] of UNITS) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return n === 1 ? `vor ${article} ${singular}` : `vor ${n} ${plural}`;
    }
  }
  return 'gerade eben';
}

export const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}
