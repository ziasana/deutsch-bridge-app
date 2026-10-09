"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpen, Mic } from "lucide-react";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import { getExamExercisesSummary } from "@/services/examService";
import { WritingLevelChips } from "@/componenets/exam/writing";
import { SPEAKING_COLOR, SPEAKING_PARTS, learnHref } from "@/componenets/exam/speaking";
import { buildSpeakingStations } from "@/componenets/exam/speaking/learn/stations";
import { useSpeakingGuides } from "@/hooks/exam/useSpeakingGuides";
import { getSpeakingLearnProgress } from "@/services/speakingLearnProgressService";

function SprechenContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const level = searchParams.get("level") ?? profileLevel ?? "B1";

    const { data: exercises = [], isLoading } = useQuery({
        queryKey: ["exam", "exercises", "MUENDLICHER_AUSDRUCK", level],
        queryFn: () => getExamExercisesSummary("MUENDLICHER_AUSDRUCK", level).then((res) => res.data),
    });

    const { guideFor } = useSpeakingGuides(level);
    const { data: progress = [] } = useQuery({
        queryKey: ["speaking", "learn-progress", level],
        queryFn: () => getSpeakingLearnProgress(level).then((r) => r.data),
        retry: 1,
    });
    /** Finished / total stations of the Teil's learning path; null while the Lernbereich is unavailable. */
    const pathOf = (part: number) => {
        const guide = guideFor(part);
        if (!guide) return null;
        const stations = buildSpeakingStations(guide.content, part, level);
        return { total: stations.length, done: stations.filter((s) => progress.some((p) => p.part === part && p.station === s.id)).length };
    };

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard/exam-prep" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition">
                    <ArrowLeft className="size-4" />
                    Prüfungsvorbereitung
                </Link>

                <div className="mt-4 flex items-start gap-4 rounded-[10px] bg-card p-5 shadow-card sm:p-6">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${SPEAKING_COLOR}1a` }}>
                        <Mic className="size-6" style={{ color: SPEAKING_COLOR }} />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Mündlicher Ausdruck</h1>
                        <p className="text-sm font-semibold text-primary">{level}</p>
                        <p className="mt-1 text-sm text-foreground/60">Erst lernen, dann üben: Jeder Teil hat einen Lernbereich mit Redemitteln und Tipps.</p>
                    </div>
                </div>

                <WritingLevelChips
                    className="mt-6"
                    level={level}
                    onChange={(l) => router.replace(`/dashboard/exam-prep/sprechen?level=${encodeURIComponent(l)}`)}
                />

                {isLoading ? (
                    <Loading />
                ) : (
                    <ul className="mt-6 space-y-4">
                        {SPEAKING_PARTS.map((part) => {
                            const items = exercises.filter((e) => (e.partNumber ?? 1) === part.part);
                            const done = items.filter((e) => e.completed).length;
                            const path = pathOf(part.part);
                            return (
                                <li key={part.part} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
                                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: SPEAKING_COLOR }}>Teil {part.part}</p>
                                    <h2 className="text-lg font-semibold text-foreground">{part.title}</h2>
                                    <p className="mt-1 text-sm text-foreground/60">{part.description}</p>
                                    {path && path.total > 0 && (
                                        <div className="mt-3 flex items-center gap-2" aria-label={`Lernpfad: ${path.done} von ${path.total} Stationen`}>
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
                                                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(path.done / path.total) * 100}%` }} />
                                            </div>
                                            <span className="text-xs tabular-nums text-foreground/55">{path.done}/{path.total} Stationen</span>
                                        </div>
                                    )}
                                    <p className="mt-2 text-xs text-foreground/50">
                                        {items.length === 0 ? "Noch keine Übungen" : `${items.length} ${items.length === 1 ? "Übung" : "Übungen"} · ${done} erledigt`}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Link
                                            href={learnHref(level, part.part)}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                        >
                                            <BookOpen className="size-4" aria-hidden="true" />
                                            {path && path.done > 0 && path.done < path.total ? "Weiterlernen" : "Lernen"}
                                        </Link>
                                        {items.length > 0 ? (
                                            <Link
                                                href={`/dashboard/exam-prep/teil?section=MUENDLICHER_AUSDRUCK&level=${encodeURIComponent(level)}&part=${part.part}`}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                                            >
                                                Übungen <ArrowRight className="size-4" aria-hidden="true" />
                                            </Link>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full border border-dashed border-border px-4 py-2 text-sm text-foreground/40">
                                                Übungen folgen
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default function SprechenPage() {
    return (
        <Suspense fallback={<Loading />}>
            <SprechenContent />
        </Suspense>
    );
}
