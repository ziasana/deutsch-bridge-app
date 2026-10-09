"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import { getWritingLearning } from "@/services/writingService";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import ThemedLearnPath from "@/componenets/exam/writing/learn/ThemedLearnPath";
import { lessonThemeVars } from "@/componenets/exam/lessonTheme";
import { cn } from "@/lib/utils";
import LessonPlayer from "@/componenets/exam/writing/learn/LessonPlayer";
import { buildStations } from "@/componenets/exam/writing/learn/stations";
import { useLearnProgress } from "@/componenets/exam/writing/learn/useLearnProgress";
import { LEARN_SECTIONS, LearnSectionId, WRITING_LEVELS } from "@/componenets/exam/writing/writingMeta";
import { WritingLearningResponse } from "@/types/writing";

interface LearnViewProps {
    level: string;
    data: WritingLearningResponse;
    stationId: LearnSectionId | null;
    onNavigate: (station: LearnSectionId | null) => void;
}

/** Path overview or one lesson, chosen by ?station=. Keyed by level so progress state never leaks between levels. */
function LearnView({ level, data, stationId, onNavigate }: LearnViewProps) {
    const stations = useMemo(() => buildStations(data, level), [data, level]);
    const { done, markDone, reset } = useLearnProgress(level);
    const router = useRouter();

    const current = stationId ? stations.find((s) => s.id === stationId) : undefined;
    if (current) {
        const idx = stations.findIndex((s) => s.id === current.id);
        const nextId = stations[idx + 1]?.id ?? null;
        return (
            <LessonPlayer
                key={current.id}
                station={current}
                nextStationId={nextId}
                accent="writing"
                onFinished={(id, r) => markDone(id as LearnSectionId, r)}
                onNext={(id) => (id ? onNavigate(id as LearnSectionId) : router.push(`/dashboard/exam-prep?section=SCHRIFTLICHER_AUSDRUCK&level=${encodeURIComponent(level)}`))}
                onExit={() => onNavigate(null)}
            />
        );
    }
    if (stations.length === 0) {
        return <div className="rounded-[10px] bg-card p-8 text-center text-sm text-foreground/55 shadow-card">Für {level} sind noch keine Lerninhalte verfügbar.</div>;
    }
    const exerciseHref = `/dashboard/exam-prep?section=SCHRIFTLICHER_AUSDRUCK&level=${encodeURIComponent(level)}`;
    return (
        <ThemedLearnPath
            accent="writing"
            stations={stations}
            done={done}
            onOpen={(id) => onNavigate(id as LearnSectionId)}
            onReset={reset}
            sections={LEARN_SECTIONS}
            exerciseHref={exerciseHref}
            exerciseLabel="Zu den Schreibaufgaben →"
            allDoneHint="Du kennst jetzt die Methode. Wende sie in den Schreibaufgaben an."
            remainingHint={(n) => `Noch ${n} ${n === 1 ? "Station" : "Stationen"} bis zum Schreib-Profi.`}
        />
    );
}

function LernenContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const level = searchParams.get("level") ?? profileLevel ?? "B1";
    const stationParam = searchParams.get("station");
    const stationId = LEARN_SECTIONS.find((s) => s.id === stationParam)?.id ?? null;

    const { data, isLoading, error } = useQuery({
        queryKey: ["writing", "learn", level],
        queryFn: () => getWritingLearning(level).then((res) => res.data),
    });

    useEffect(() => {
        if (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Lerninhalte konnten nicht geladen werden.");
        }
    }, [error]);

    const base = `/dashboard/exam-prep/schreiben/lernen?level=${encodeURIComponent(level)}`;
    const navigate = (station: LearnSectionId | null) => router.push(station ? `${base}&station=${station}` : base);
    const inLesson = stationId !== null && !!data;

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-6 sm:px-6 sm:py-10" dir="ltr" style={lessonThemeVars("writing")}>
            <div className="mx-auto max-w-4xl">
                {!inLesson && (
                    <>
                        <Link href={`/dashboard/exam-prep/schreiben?level=${encodeURIComponent(level)}`} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition hover:text-foreground">
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Schreiben
                        </Link>

                        <header className="relative mt-4 overflow-hidden rounded-3xl border border-primary/15 bg-card p-5 shadow-card sm:p-6">
                            <span aria-hidden="true" className="pointer-events-none absolute -end-10 -top-12 size-44 rounded-full bg-gradient-to-br from-(--lesson-from)/20 to-(--lesson-to)/20" />
                            <span aria-hidden="true" className="pointer-events-none absolute end-6 top-4 text-7xl opacity-15 sm:text-8xl">📚</span>
                            <div className="relative">
                                <p className="inline-flex rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-primary">Lernen · {level}</p>
                                <h1 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">Schreiben lernen</h1>
                                <p className="mt-0.5 text-sm text-foreground/65">Kleine Schritte, Aufgaben zum Ausprobieren – und du siehst sofort, was du schon kannst.</p>
                            </div>
                            <div role="group" aria-label="Niveau" className="relative mt-4 flex flex-wrap gap-2">
                                {WRITING_LEVELS.map((l) => (
                                    <button
                                        key={l}
                                        type="button"
                                        aria-pressed={l === level}
                                        onClick={() => router.replace(`/dashboard/exam-prep/schreiben/lernen?level=${encodeURIComponent(l)}`)}
                                        className={cn(
                                            "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                            l === level ? "border-transparent bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) text-white shadow-sm" : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:bg-primary/5",
                                        )}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </header>
                    </>
                )}

                <div className={inLesson ? "" : "mt-6"}>
                    {isLoading ? <Loading /> : data ? <LearnView key={level} level={level} data={data} stationId={stationId} onNavigate={navigate} /> : null}
                </div>
            </div>
        </div>
    );
}

export default function LernenPage() {
    return (
        <Suspense fallback={<Loading />}>
            <LernenContent />
        </Suspense>
    );
}
