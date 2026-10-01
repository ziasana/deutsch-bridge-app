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
import { WritingLevelChips } from "@/componenets/exam/writing";
import LearnPath from "@/componenets/exam/writing/learn/LearnPath";
import LessonPlayer from "@/componenets/exam/writing/learn/LessonPlayer";
import { buildStations } from "@/componenets/exam/writing/learn/stations";
import { useLearnProgress } from "@/componenets/exam/writing/learn/useLearnProgress";
import { LEARN_SECTIONS, LearnSectionId } from "@/componenets/exam/writing/writingMeta";
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
                onFinished={(id, r) => markDone(id, r)}
                onNext={(id) => (id ? onNavigate(id) : router.push(`/dashboard/exam-prep?section=SCHRIFTLICHER_AUSDRUCK&level=${encodeURIComponent(level)}`))}
                onExit={() => onNavigate(null)}
            />
        );
    }
    if (stations.length === 0) {
        return <div className="rounded-[10px] bg-card p-8 text-center text-sm text-foreground/55 shadow-card">Für {level} sind noch keine Lerninhalte verfügbar.</div>;
    }
    return <LearnPath level={level} stations={stations} done={done} onOpen={onNavigate} onReset={reset} />;
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
        <div className="min-h-screen bg-background px-6 py-6 sm:py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                {!inLesson && (
                    <>
                        <Link href={`/dashboard/exam-prep/schreiben?level=${encodeURIComponent(level)}`} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition">
                            <ArrowLeft className="size-4" />
                            Schreiben
                        </Link>

                        <div className="mt-4">
                            <h1 className="text-2xl font-bold text-foreground">📚 Schreiben lernen</h1>
                            <p className="mt-1 text-sm text-foreground/60">{level} · Kleine Schritte, Aufgaben zum Ausprobieren – und du siehst sofort, was du schon kannst.</p>
                        </div>

                        <WritingLevelChips className="mt-5" level={level} onChange={(l) => router.replace(`/dashboard/exam-prep/schreiben/lernen?level=${encodeURIComponent(l)}`)} />
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
