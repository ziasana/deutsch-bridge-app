import type { Dictionary } from '@/i18n';

export type DayBucket = 'today' | 'yesterday' | 'earlier';

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

const UNITS: [Parameters<Dictionary['notifications']['time']['ago']>[1], number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "5 minutes ago" in the interface language (no dependency on Intl.RelativeTimeFormat being available). */
export function relativeTime(
  iso: string,
  time: Dictionary['notifications']['time'],
  now = new Date(),
): string {
  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return time.ago(Math.floor(seconds / size), unit);
  }
  return time.now;
}

export const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}
