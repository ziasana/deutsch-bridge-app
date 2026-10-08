"use client";

import { ExamContentStatus, ExercisePreviewData } from "@/types/examContent";

export const cardClass =
    "bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)]";
export const labelClass = "block text-gray-700 dark:text-gray-300 mb-1.5 text-sm font-medium";
export const fieldClass =
    "w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none";

export const errorMessage = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

const STATUS_STYLES: Record<ExamContentStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    ARCHIVED: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export function StatusBadge({ status }: Readonly<{ status: ExamContentStatus | null }>) {
    const value = status ?? "DRAFT";
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[value]}`}>
            {value.charAt(0) + value.slice(1).toLowerCase()}
        </span>
    );
}

/** Copies text to the clipboard; falls back to a hidden textarea where the async API is unavailable. */
export async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const area = document.createElement("textarea");
            area.value = text;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            const ok = document.execCommand("copy");
            area.remove();
            return ok;
        } catch {
            return false;
        }
    }
}

export function downloadTextFile(filename: string, text: string, mime = "text/plain") {
    const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/** Plain text of the rich-text HTML an exercise passage is stored as (paragraph/line breaks kept). */
export function htmlToText(html: string | null | undefined): string {
    if (!html) return "";
    const withBreaks = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p[^>]*>/gi, "\n\n");
    const doc = new DOMParser().parseFromString(withBreaks, "text/html");
    return (doc.body.textContent ?? "").trim();
}

/**
 * An exercise exactly as a learner sees it (instructions, lettered headings, numbered texts), plus - for
 * the admin only - the answer key and which headings stay unused.
 */
export function ExerciseView({ preview, showAnswers = true }: Readonly<{ preview: ExercisePreviewData; showAnswers?: boolean }>) {
    const used = new Set(preview.texts.map((t) => t.correctHeadingId).filter(Boolean));
    return (
        <div className="space-y-5">
            {preview.instructions && <p className="text-sm italic text-gray-600 dark:text-gray-300">{preview.instructions}</p>}

            <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Überschriften</h4>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                    {preview.headings.map((h) => (
                        <li
                            key={h.id}
                            className={`rounded-md border px-3 py-1.5 text-sm ${
                                showAnswers && !used.has(h.id)
                                    ? "border-dashed border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400"
                                    : "border-gray-200 text-gray-900 dark:border-gray-700 dark:text-gray-100"
                            }`}
                        >
                            <span className="font-semibold mr-1.5">{h.id})</span>
                            {h.text}
                            {showAnswers && !used.has(h.id) && <span className="ml-2 text-xs">(unused)</span>}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-3">
                {preview.texts.map((t, i) => (
                    <div key={t.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Text {i + 1}</h4>
                            {showAnswers && (
                                <span className="text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 px-2 py-0.5">
                                    → {t.correctHeadingId || "?"}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">{t.content}</p>
                    </div>
                ))}
            </div>

            {showAnswers && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Correct answers (admin only): </span>
                    {preview.texts.map((t, i) => `Text ${i + 1} → ${t.correctHeadingId || "?"}`).join("  ·  ")}
                </div>
            )}
        </div>
    );
}
