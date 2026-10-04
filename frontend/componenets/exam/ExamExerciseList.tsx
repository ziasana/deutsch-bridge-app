"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Circle, RotateCw } from "lucide-react";
import { ExamExerciseSummaryResponse } from "@/types/exam";
import { effectiveScore } from "./examData";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/examTime";
import { ExamExerciseLastTime } from "@/types/examTime";
import { useExamBookmark } from "@/hooks/exam/useExamBookmark";

type StatusFilter = "ALL" | "OPEN" | "COMPLETED";
const PAGE_SIZE = 10;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "Alle" },
    { value: "OPEN", label: "Offen" },
    { value: "COMPLETED", label: "Abgeschlossen" },
];

interface ExamExerciseListProps {
    items: ExamExerciseSummaryResponse[];
    color: string;
    className?: string;
    /** Last finished time per exercise id, shown under the title. */
    lastTimes?: Record<string, ExamExerciseLastTime>;
}

/** Status-filterable, paginated list of exercises (title, progress, click-through) shared by the Teil page and Schriftlicher Ausdruck. */
export default function ExamExerciseList({ items, color, className, lastTimes }: Readonly<ExamExerciseListProps>) {
    const router = useRouter();
    const { toggle: toggleBookmark, pendingId: bookmarkPendingId } = useExamBookmark();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [page, setPage] = useState(1);

    const filteredItems = items.filter(
        (item) => statusFilter === "ALL" || (statusFilter === "COMPLETED" ? effectiveScore(item) === 100 : effectiveScore(item) < 100),
    );
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className={className}>
            <div className="inline-flex rounded-full bg-card shadow-card p-1 gap-1">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => {
                            setStatusFilter(tab.value);
                            setPage(1);
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition",
                            statusFilter === tab.value ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground",
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-4 space-y-2">
                {pageItems.map((item) => (
                    <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/dashboard/exam-prep/exercise?id=${item.id}`)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") router.push(`/dashboard/exam-prep/exercise?id=${item.id}`);
                        }}
                        className="w-full flex cursor-pointer items-center gap-3 rounded-[10px] bg-card p-4 text-left transition hover:bg-accent/40"
                    >
                        {item.completed ? (
                            <CheckCircle2 className="size-6 shrink-0" style={{ color }} strokeWidth={2.5} />
                        ) : (
                            <Circle className="size-6 shrink-0 text-foreground/25" />
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground">{item.title}</div>
                            {(item.questionsCount > 0 || lastTimes?.[item.id]) && (
                                <div className="text-xs text-foreground/50">
                                    {item.questionsCount > 0 && `${item.questionsCount} ${item.questionsCount === 1 ? "Frage" : "Fragen"}`}
                                    {item.questionsCount > 0 && lastTimes?.[item.id] && " · "}
                                    {lastTimes?.[item.id] && (
                                        <>
                                            Letzte Zeit: {formatClock(lastTimes[item.id].elapsedSeconds)}
                                            {lastTimes[item.id].targetSeconds != null &&
                                                ` von ${formatClock(lastTimes[item.id].targetSeconds!)} empfohlen`}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        {item.completed && (
                            <span className="flex items-center gap-1.5 text-sm font-semibold shrink-0" style={{ color }}>
                                {item.lastScore != null && item.lastScore < 100 ? (
                                    <>
                                        <RotateCw className="size-3.5" />
                                        Wiederholen ({Math.round(item.lastScore)}%)
                                    </>
                                ) : (
                                    "Erledigt ✓"
                                )}
                            </span>
                        )}
                        <button
                            type="button"
                            disabled={bookmarkPendingId === item.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(item.id, item.bookmarked);
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                            aria-pressed={item.bookmarked}
                            aria-label={item.bookmarked ? "Merkzeichen entfernen" : "Aufgabe merken"}
                            title={item.bookmarked ? "Merkzeichen entfernen" : "Aufgabe merken"}
                            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/45 transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {item.bookmarked ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
                        </button>
                        <ChevronRight className="size-4 text-foreground/30 shrink-0" />
                    </div>
                ))}
                {pageItems.length === 0 && (
                    <div className="text-center text-foreground/50 py-10 text-sm">Keine Übungen für diesen Filter gefunden.</div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-1 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex size-8 items-center justify-center rounded-lg text-foreground/60 transition hover:bg-accent/50 disabled:opacity-40"
                        aria-label="Vorherige Seite"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                            type="button"
                            key={n}
                            onClick={() => setPage(n)}
                            className={cn(
                                "size-8 rounded-lg text-sm font-medium transition",
                                n === currentPage ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:bg-accent/50",
                            )}
                        >
                            {n}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex size-8 items-center justify-center rounded-lg text-foreground/60 transition hover:bg-accent/50 disabled:opacity-40"
                        aria-label="Nächste Seite"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
