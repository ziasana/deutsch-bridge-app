import { AppLanguage } from "@/lib/i18n/translations";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
];

/** "5 min ago" / "vor 5 Minuten" / "۵ دقیقه پیش" using the browser's built-in localization. */
export function formatRelativeTime(iso: string, language: AppLanguage, now: Date = new Date()): string {
    const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
    const formatter = new Intl.RelativeTimeFormat(language === "fa" ? "fa" : "en", { numeric: "auto", style: "short" });
    for (const [unit, unitSeconds] of UNITS) {
        if (Math.abs(seconds) >= unitSeconds) {
            return formatter.format(Math.round(seconds / unitSeconds), unit);
        }
    }
    return formatter.format(0, "minute");
}

export type DayBucket = "today" | "yesterday" | "earlier";

/** Groups by the viewer's local calendar day. */
export function dayBucket(iso: string, now: Date = new Date()): DayBucket {
    const date = new Date(iso);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    if (date >= startOfToday) return "today";
    if (date >= startOfYesterday) return "yesterday";
    return "earlier";
}
