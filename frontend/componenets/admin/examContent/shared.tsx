"use client";

import { ExamContentStatus, ExercisePreviewData, PreviewAdvertisement } from "@/types/examContent";

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
    if (preview.advertisements?.length || preview.situations?.length) return <SituationExerciseView preview={preview} showAnswers={showAnswers} />;
    if (preview.questions?.length || preview.readingText) return <ReadingExerciseView preview={preview} showAnswers={showAnswers} />;
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

/** Lesen Teil 2: the reading text followed by its numbered multiple-choice questions (admin sees the key). */
function ReadingExerciseView({ preview, showAnswers }: Readonly<{ preview: ExercisePreviewData; showAnswers: boolean }>) {
    const questions = preview.questions ?? [];
    return (
        <div className="space-y-5">
            {preview.instructions && <p className="text-sm italic text-gray-600 dark:text-gray-300">{preview.instructions}</p>}

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">{preview.readingText}</p>
            </div>

            <div className="space-y-3">
                {questions.map((q, i) => (
                    <div key={q.id ?? i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{q.number ?? i + 1}. {q.question}</h4>
                            {showAnswers && q.questionType && (
                                <span className="shrink-0 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-2 py-0.5">
                                    {q.questionType.replaceAll("_", " ").toLowerCase()}
                                </span>
                            )}
                        </div>
                        <ul className="space-y-1">
                            {q.options.map((o) => {
                                const correct = showAnswers && o.id === q.correctOptionId;
                                return (
                                    <li
                                        key={o.id}
                                        className={`rounded-md border px-3 py-1.5 text-sm ${
                                            correct
                                                ? "border-green-400 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-900/30 dark:text-green-100"
                                                : "border-gray-200 text-gray-900 dark:border-gray-700 dark:text-gray-100"
                                        }`}
                                    >
                                        <span className="font-semibold mr-1.5">{o.id})</span>
                                        {o.text}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {showAnswers && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Correct answers (admin only): </span>
                    {questions.map((q, i) => `${q.number ?? i + 1} → ${q.correctOptionId || "?"}`).join("  ·  ")}
                </div>
            )}
        </div>
    );
}

/**
 * One advertisement as the learner sees it: letter, optional picture (or a placeholder showing the image brief),
 * headline, subheadline, description, details, price, opening hours and contact. Fields an ad does not use are
 * simply skipped. With {@code showAdminInfo} the matching profile and the situations it is the answer for are listed.
 */
export function AdvertisementCard({
    ad,
    correctFor = [],
    showAdminInfo = false,
}: Readonly<{ ad: PreviewAdvertisement; correctFor?: number[]; showAdminInfo?: boolean }>) {
    const { content, visual } = ad;
    const compact = ad.layout === "COMPACT";
    const contact = Object.values(content.contact ?? {}).filter(Boolean);
    const image = visual?.hasImage ? (
        visual.imageUrl ? (
            <img src={visual.imageUrl} alt={visual.altText ?? ""} className="w-full rounded-md object-cover max-h-40" />
        ) : (
            <div
                role="img"
                aria-label={visual.altText ?? "Bild"}
                className="flex min-h-[72px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-2 text-center text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-400"
            >
                {showAdminInfo ? `${visual.imageType ?? "IMAGE"}: ${visual.imagePrompt ?? visual.altText ?? ""}` : (visual.altText ?? "")}
            </div>
        )
    ) : null;

    return (
        <article aria-label={`Anzeige ${ad.id ?? ""}`} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{ad.id}</span>
                {showAdminInfo && (ad.type || ad.layout) && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{[ad.type, ad.layout].filter(Boolean).join(" · ")}</span>
                )}
            </div>
            <div className={`space-y-2 ${compact ? "text-sm" : ""}`}>
                {ad.layout !== "COMPACT" && image}
                {content.headline && <h4 className="text-base font-bold text-gray-900 dark:text-white">{content.headline}</h4>}
                {content.subheadline && <p className="text-sm italic text-gray-600 dark:text-gray-300">{content.subheadline}</p>}
                {content.description && <p className="text-sm text-gray-800 dark:text-gray-200">{content.description}</p>}
                {!!content.details?.length && (
                    <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-200">
                        {content.details.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                )}
                {content.price && <p className="text-sm font-semibold text-gray-900 dark:text-white">Preis: {content.price}</p>}
                {content.openingHours && <p className="text-sm text-gray-800 dark:text-gray-200">Öffnungszeiten: {content.openingHours}</p>}
                {contact.length > 0 && <p className="text-sm text-gray-600 dark:text-gray-300">{contact.join(" · ")}</p>}
            </div>
            {showAdminInfo && (
                <div className="mt-3 space-y-1 border-t border-dashed border-gray-300 pt-2 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-300">
                    <p>
                        <span className="font-semibold">Matching profile:</span>{" "}
                        {ad.matchingProfile?.primaryService ?? "—"}
                        {!!ad.matchingProfile?.features?.length && ` · ${ad.matchingProfile.features.join(", ")}`}
                    </p>
                    <p>
                        <span className="font-semibold">Correct for:</span>{" "}
                        {correctFor.length ? correctFor.map((n) => `Situation ${n}`).join(", ") : "unused (distractor)"}
                    </p>
                </div>
            )}
        </article>
    );
}

/** Lesen Teil 3: numbered situations with the admin-only answer, then the advertisement cards. */
function SituationExerciseView({ preview, showAnswers }: Readonly<{ preview: ExercisePreviewData; showAnswers: boolean }>) {
    const situations = preview.situations ?? [];
    const ads = preview.advertisements ?? [];
    const answersByAd = new Map<string, number[]>();
    situations.forEach((s) => {
        if (s.correctAdvertisementId && s.number != null) {
            answersByAd.set(s.correctAdvertisementId, [...(answersByAd.get(s.correctAdvertisementId) ?? []), s.number]);
        }
    });
    const unused = ads.filter((a) => a.id && !answersByAd.has(a.id)).map((a) => a.id);

    return (
        <div className="space-y-5">
            {preview.instructions && <p className="text-sm italic text-gray-600 dark:text-gray-300">{preview.instructions}</p>}

            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Situationen</h4>
                {situations.map((s, i) => (
                    <div key={s.id ?? i} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                            <span className="mr-1.5 font-semibold">{s.number ?? i + 1}.</span>
                            {s.text}
                            {showAnswers && s.matchingProfile?.primaryNeed && (
                                <span className="ml-2 text-xs text-gray-500">
                                    [{s.matchingProfile.primaryNeed}
                                    {!!s.matchingProfile.requirements?.length && ` · ${s.matchingProfile.requirements.join(", ")}`}]
                                </span>
                            )}
                        </p>
                        {showAnswers && (
                            <span className="shrink-0 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-200">
                                → {s.correctAdvertisementId || "?"}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Anzeigen</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {ads.map((a, i) => (
                        <AdvertisementCard key={a.id ?? i} ad={a} showAdminInfo={showAnswers} correctFor={a.id ? (answersByAd.get(a.id) ?? []) : []} />
                    ))}
                </div>
            </div>

            {showAnswers && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                    <span className="font-semibold">Correct answers (admin only): </span>
                    {situations.map((s, i) => `${s.number ?? i + 1} → ${s.correctAdvertisementId || "?"}`).join("  ·  ")}
                    {unused.length > 0 && <span className="block mt-1">Unused advertisements: {unused.join(", ")}</span>}
                </div>
            )}
        </div>
    );
}
