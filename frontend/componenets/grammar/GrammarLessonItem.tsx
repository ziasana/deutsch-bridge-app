"use client";

import { ArrowRight, Bookmark, BookmarkCheck, Check, RotateCw } from "lucide-react";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";

interface Props {
    /** Position on the path (1-based); shown in the circle until the lesson is learned. */
    number: number;
    title: string;
    summary: string;
    dir: "ltr" | "rtl";
    level: string;
    learned: boolean;
    bookmarked: boolean;
    bookmarkPending: boolean;
    hasQuiz: boolean;
    /** The lesson to do next: highlighted with a label. */
    nextLabel?: string;
    isLast: boolean;
    labels: { bookmark: string; unbookmark: string; practice: string; review: string };
    onOpen: () => void;
    onPractice: () => void;
    onToggleBookmark: () => void;
}

/**
 * One lesson on a topic's learning path: a numbered circle (a check once learned) joined to the next one by a line,
 * and a card with the title, the summary and quick actions (bookmark, practice / review).
 */
export default function GrammarLessonItem({ number, title, summary, dir, level, learned, bookmarked, bookmarkPending, hasQuiz, nextLabel, isLast, labels, onOpen, onPractice, onToggleBookmark }: Readonly<Props>) {
    const color = getLevelMeta(level).color;
    return (
        <li className="flex gap-3 sm:gap-4">
            <div className="flex flex-col items-center">
                <span
                    className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold", learned ? "text-white" : "border-2 border-dashed")}
                    style={learned ? { backgroundColor: color } : { borderColor: `${color}80`, color }}
                    aria-hidden="true"
                >
                    {learned ? <Check className="size-5" strokeWidth={3} /> : number}
                </span>
                {!isLast && <span aria-hidden="true" className="my-1 w-0.5 flex-1 rounded-full" style={{ backgroundColor: learned ? color : `${color}33` }} />}
            </div>

            <div className={cn("min-w-0 flex-1", !isLast && "pb-3")}>
                <article
                    role="button"
                    tabIndex={0}
                    dir={dir}
                    onClick={onOpen}
                    onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            onOpen();
                        }
                    }}
                    aria-label={title}
                    className={cn(
                        "group flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        nextLabel ? "border-primary/50 bg-primary/[0.06] shadow-card" : learned ? "border-transparent bg-foreground/[0.03]" : "border-border/60 bg-background",
                    )}
                >
                    <div className="min-w-0 flex-1 text-start">
                        {nextLabel && (
                            <span className="mb-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">{nextLabel}</span>
                        )}
                        <p className="truncate font-semibold text-foreground transition group-hover:text-primary">{title}</p>
                        {summary && <p className="mt-0.5 line-clamp-2 text-sm text-foreground/55">{summary}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5" dir="ltr">
                        <button
                            type="button"
                            disabled={bookmarkPending}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleBookmark();
                            }}
                            aria-pressed={bookmarked}
                            aria-label={bookmarked ? labels.unbookmark : labels.bookmark}
                            title={bookmarked ? labels.unbookmark : labels.bookmark}
                            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-foreground/45 transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {bookmarked ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
                        </button>
                        {hasQuiz && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPractice();
                                }}
                                className={cn(
                                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    learned ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
                                )}
                            >
                                {learned ? (
                                    <>
                                        <RotateCw className="size-3.5" aria-hidden="true" />
                                        {labels.review}
                                    </>
                                ) : (
                                    <>
                                        {labels.practice}
                                        <ArrowRight className="size-3.5" aria-hidden="true" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </article>
            </div>
        </li>
    );
}
