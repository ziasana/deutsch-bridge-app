"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Circle, Play, RotateCw } from "lucide-react";
import { getExamExercisesSummary } from "@/services/examService";
import { ExamSection } from "@/types/exam";
import Loading from "@/componenets/Loading";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { EXAM_TYPE_META, EXAM_TYPE_ORDER, effectiveScore, findGroupByKey } from "@/componenets/exam";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | "OPEN" | "COMPLETED";
const PAGE_SIZE = 10;
const VALID_SECTIONS = new Set<string>(EXAM_TYPE_ORDER);

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "Alle" },
    { value: "OPEN", label: "Offen" },
    { value: "COMPLETED", label: "Abgeschlossen" },
];

function NotFound() {
    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto text-center text-foreground/50 py-20">
                Dieser Prüfungsteil konnte nicht gefunden werden.
                <div className="mt-4">
                    <Link href="/dashboard/exam-prep" className="text-primary font-medium hover:underline">
                        ← Zurück zur Prüfungsvorbereitung
                    </Link>
                </div>
            </div>
        </div>
    );
}

function TeilContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const section = searchParams.get("section");
    const level = searchParams.get("level");
    const partKey = searchParams.get("part");

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [page, setPage] = useState(1);

    const isValid = !!section && !!level && !!partKey && VALID_SECTIONS.has(section);
    const typedSection = section as ExamSection;

    const { data: exercises = [], isLoading } = useQuery({
        queryKey: ["exam", "exercises", typedSection, level],
        queryFn: () => getExamExercisesSummary(typedSection, level!).then((res) => res.data),
        enabled: isValid,
    });

    if (!section || !level || !partKey || !VALID_SECTIONS.has(section)) return <NotFound />;
    if (isLoading) return <Loading />;

    const meta = EXAM_TYPE_META[typedSection];
    const group = findGroupByKey(exercises, typedSection, level, partKey);
    if (!group) return <NotFound />;

    const totalQuestions = group.items.reduce((sum, item) => sum + item.questionsCount, 0);
    const firstUnmasteredIndex = group.items.findIndex((item) => effectiveScore(item) < 100);
    const continueIndex = firstUnmasteredIndex === -1 ? 0 : firstUnmasteredIndex;
    const continueItem = group.items[continueIndex];
    const continueLabel =
        group.state === "completed"
            ? `Review: Übung ${continueIndex + 1}`
            : group.mastered === 0 && !group.items.some((item) => item.completed)
              ? `Starten: Übung ${continueIndex + 1}`
              : `Weiter: Übung ${continueIndex + 1}`;

    const numberedItems = group.items.map((item, i) => ({ item, number: i + 1 }));
    const filteredItems = numberedItems.filter(
        ({ item }) => statusFilter === "ALL" || (statusFilter === "COMPLETED" ? effectiveScore(item) === 100 : effectiveScore(item) < 100),
    );
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const backHref = `/dashboard/exam-prep?section=${typedSection}&level=${encodeURIComponent(level)}`;

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition">
                    <ArrowLeft className="size-4" />
                    {meta.label}
                </Link>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-foreground">{group.heading}</h1>
                    {group.subheading && <p className="text-foreground/60 mt-0.5">{group.subheading}</p>}
                    <p className="text-sm text-foreground/50 mt-1">
                        {group.total} {group.total === 1 ? "Übung" : "Übungen"} · {totalQuestions} {totalQuestions === 1 ? "Frage" : "Fragen"}
                    </p>
                </div>

                <div className="mt-6 rounded-[10px] bg-card shadow-card p-4 sm:p-5">
                    <div className="text-sm font-semibold text-foreground">Dein Fortschritt</div>
                    <div className="mt-3 flex items-center gap-3">
                        <LearningProgressBar value={group.avgScore} color={meta.color} className="flex-1" ariaLabel="Dein Fortschritt" />
                        <span className="shrink-0 text-sm font-medium text-foreground/70">
                            {group.mastered} / {group.total}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push(`/dashboard/exam-prep/exercise?id=${continueItem.id}`)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                        <Play className="size-4" fill="currentColor" />
                        {continueLabel}
                    </button>
                </div>

                <h2 className="mt-8 text-sm font-semibold text-foreground/70">Übungen</h2>

                <div className="mt-3 inline-flex rounded-full bg-card shadow-card p-1 gap-1">
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
                    {pageItems.map(({ item, number }) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => router.push(`/dashboard/exam-prep/exercise?id=${item.id}`)}
                            className="w-full flex items-center gap-3 rounded-[10px] bg-card p-4 text-left transition hover:bg-accent/40"
                        >
                            {item.completed ? (
                                <CheckCircle2 className="size-6 shrink-0" style={{ color: meta.color }} strokeWidth={2.5} />
                            ) : (
                                <Circle className="size-6 shrink-0 text-foreground/25" />
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold text-foreground">Übung {number}</div>
                                <div className="text-xs text-foreground/50">
                                    {item.questionsCount} {item.questionsCount === 1 ? "Frage" : "Fragen"}
                                </div>
                            </div>
                            {item.completed && (
                                <span className="flex items-center gap-1.5 text-sm font-semibold shrink-0" style={{ color: meta.color }}>
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
                            <ChevronRight className="size-4 text-foreground/30 shrink-0" />
                        </button>
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
        </div>
    );
}

export default function TeilPage() {
    return (
        <Suspense fallback={<Loading />}>
            <TeilContent />
        </Suspense>
    );
}
