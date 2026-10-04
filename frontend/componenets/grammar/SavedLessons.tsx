"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronDown, X } from "lucide-react";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { useI18n } from "@/componenets/I18nProvider";
import { localizedLessonHeading } from "@/lib/grammarLocalization";
import { cn } from "@/lib/utils";
import { GrammarPendingBookmark } from "@/types/grammar";

const CHIP_MIN_WIDTH = 112;
const CHIP_GAP = 24;
const MORE_LINK_WIDTH = 40;
const MAX_PREVIEW = 4;

/** How many preview chips fit on one row of this width, leaving room for the "+N more" link when some are left out. */
function chipsThatFit(width: number, total: number) {
    const fit = (w: number) => Math.floor((w + CHIP_GAP) / (CHIP_MIN_WIDTH + CHIP_GAP));
    const all = Math.min(fit(width), MAX_PREVIEW);
    if (all >= total) return total;
    return Math.max(1, Math.min(fit(width - MORE_LINK_WIDTH - CHIP_GAP), MAX_PREVIEW));
}

interface SavedLessonsButtonProps {
    lessons: GrammarPendingBookmark[];
    open: boolean;
    onToggle: () => void;
}

/**
 * Hero card: "Saved for later" with a count, as many of the oldest lessons as fit on one row, and a compact "+N"
 * link. The header toggles the full list under the hero (which then replaces the previews).
 */
export function SavedLessonsButton({ lessons, open, onToggle }: Readonly<SavedLessonsButtonProps>) {
    const router = useRouter();
    const { language, t } = useI18n();
    const rowRef = useRef<HTMLDivElement>(null);
    const [fitCount, setFitCount] = useState(2);

    // Re-measured whenever the row resizes (screen size, rotation, panel toggling), so the row never wraps.
    useEffect(() => {
        const row = rowRef.current;
        if (!row) return;
        const update = () => setFitCount(chipsThatFit(row.clientWidth, lessons.length));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(row);
        return () => observer.disconnect();
    }, [lessons.length, open]);

    const preview = lessons.slice(0, fitCount);
    const moreCount = lessons.length - preview.length;

    return (
        <div className="mt-2 w-full">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="relative flex w-fit cursor-pointer items-center gap-2 rounded-full bg-primary py-2 pl-4 pr-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                <span aria-hidden="true" className="absolute -right-1 -top-1 flex size-3">
                    <span className="absolute inline-flex size-full rounded-full bg-learning-expression opacity-70 motion-safe:animate-ping" />
                    <span className="relative inline-flex size-3 rounded-full bg-learning-expression ring-2 ring-card" />
                </span>
                <Bookmark className="size-4" aria-hidden="true" />
                <span>{t.grammar.savedTitle}</span>
                <span className="flex min-w-6 items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-semibold">
                    {lessons.length}
                </span>
                <ChevronDown className={cn("size-4 opacity-80 transition-transform", open && "rotate-180")} aria-hidden="true" />
            </button>

            {!open && (
                <div ref={rowRef} className="mt-2 flex items-center gap-6">
                    {preview.map((lesson) => {
                        const { title, dir } = localizedLessonHeading(lesson, language);
                        const levelColor = getLevelMeta(lesson.level).color;
                        return (
                            <button
                                key={lesson.id}
                                type="button"
                                dir={dir}
                                onClick={() => router.push(`/dashboard/grammar/lesson?id=${lesson.id}`)}
                                className="group flex min-w-0 flex-1 basis-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            >
                                <span
                                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none"
                                    style={{ backgroundColor: `${levelColor}1a`, color: levelColor }}
                                >
                                    {lesson.level}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm text-foreground/85 group-hover:text-primary">{title}</span>
                            </button>
                        );
                    })}
                    {moreCount > 0 && (
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-label={t.grammar.savedMore(moreCount)}
                            title={t.grammar.savedMore(moreCount)}
                            className="shrink-0 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium text-primary hover:underline"
                        >
                            +{moreCount}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

const STALE_AFTER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

interface SavedLessonsPanelProps {
    lessons: GrammarPendingBookmark[];
    onRemoveBookmark: (lessonId: string) => void;
    removingId: string | null;
}

/** Slim list of the saved lessons still to finish, oldest first. Scrolls instead of growing past ~5 rows. */
export function SavedLessonsPanel({ lessons, onRemoveBookmark, removingId }: Readonly<SavedLessonsPanelProps>) {
    const router = useRouter();
    const { language, t } = useI18n();
    // Captured once so every row is measured against the same moment (and render stays pure).
    const [now] = useState(() => Date.now());

    return (
        <section aria-label={t.grammar.savedTitle} className="mt-3 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <p className="px-4 pb-1 pt-3 text-xs text-foreground/55">{t.grammar.savedSubtitle(lessons.length)}</p>
            <ul className="max-h-72 divide-y divide-border/50 overflow-y-auto">
                {lessons.map((lesson) => {
                    const { title, dir } = localizedLessonHeading(lesson, language);
                    const levelColor = getLevelMeta(lesson.level).color;
                    const waitingDays = Math.floor((now - new Date(lesson.bookmarkedAt).getTime()) / DAY_MS);
                    return (
                        <li key={lesson.id} className="flex items-center gap-1 pr-2 transition-colors hover:bg-primary/5">
                            <button
                                type="button"
                                dir={dir}
                                onClick={() => router.push(`/dashboard/grammar/lesson?id=${lesson.id}`)}
                                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                            >
                                <span
                                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                                    style={{ backgroundColor: `${levelColor}1a`, color: levelColor }}
                                >
                                    {lesson.level}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{title}</span>
                                {waitingDays >= STALE_AFTER_DAYS && (
                                    <span className="shrink-0 text-xs text-learning-review">{t.grammar.savedWaiting(waitingDays)}</span>
                                )}
                            </button>
                            <button
                                type="button"
                                disabled={removingId === lesson.id}
                                onClick={() => onRemoveBookmark(lesson.id)}
                                aria-label={t.grammar.unbookmark}
                                title={t.grammar.unbookmark}
                                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/35 transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="size-4" />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
