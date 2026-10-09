"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import { useSpeakingGuides } from "@/hooks/exam/useSpeakingGuides";
import { GuideLearnView, SPEAKING_COLOR, SPEAKING_PARTS, SPEAKING_SECTIONS, learnHref, speakingPathTexts } from "@/componenets/exam/speaking";
import { buildSpeakingStations } from "@/componenets/exam/speaking/learn/stations";
import { useSpeakingLearnProgress } from "@/componenets/exam/speaking/learn/useSpeakingLearnProgress";
import LearnPath from "@/componenets/exam/writing/learn/LearnPath";
import LessonPlayer from "@/componenets/exam/writing/learn/LessonPlayer";
import { SpeakingGuideContent } from "@/types/exam";
import { cn } from "@/lib/utils";

interface PathProps {
    level: string;
    part: number;
    guide: SpeakingGuideContent;
    stationId: string | null;
    onNavigate: (station: string | null) => void;
}

/** The path overview or one lesson, chosen by ?station=. Keyed by level + Teil so progress never leaks between them. */
function PathView({ level, part, guide, stationId, onNavigate }: PathProps) {
    const stations = useMemo(() => buildSpeakingStations(guide, part, level), [guide, part, level]);
    const { done, markDone, reset } = useSpeakingLearnProgress(level, part);
    const router = useRouter();
    const texts = speakingPathTexts(level, part);

    const current = stationId ? stations.find((s) => s.id === stationId) : undefined;
    if (current) {
        const idx = stations.findIndex((s) => s.id === current.id);
        return (
            <LessonPlayer
                key={current.id}
                station={current}
                nextStationId={stations[idx + 1]?.id ?? null}
                sections={SPEAKING_SECTIONS}
                finishLabel="Jetzt Sprechübungen üben →"
                onFinished={markDone}
                onNext={(id) => (id ? onNavigate(id) : router.push(texts.exerciseHref))}
                onExit={() => onNavigate(null)}
            />
        );
    }
    if (stations.length === 0) {
        return <div className="rounded-[10px] bg-card p-8 text-center text-sm text-foreground/55 shadow-card">Für diesen Teil sind noch keine Lerninhalte verfügbar.</div>;
    }
    return <LearnPath level={level} stations={stations} done={done} onOpen={onNavigate} onReset={reset} sections={SPEAKING_SECTIONS} texts={texts} />;
}

function LernenContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const level = searchParams.get("level") ?? profileLevel ?? "B1";
    const requested = Number(searchParams.get("part") ?? "1");
    const part = SPEAKING_PARTS.some((p) => p.part === requested) ? requested : 1;
    const meta = SPEAKING_PARTS.find((p) => p.part === part)!;
    const stationParam = searchParams.get("station");
    const reference = searchParams.get("view") === "nachschlagen";

    const { guideFor, isLoading, isError } = useSpeakingGuides(level);
    const guide = guideFor(part);

    const go = (params: Record<string, string | null>) => {
        const q = new URLSearchParams({ level, part: String(part) });
        Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
        router.replace(`/dashboard/exam-prep/sprechen/lernen?${q.toString()}`);
    };

    // Links like ...&view=nachschlagen#goal-REPORT_OPINION point into the reference view; scroll once it has rendered.
    useEffect(() => {
        if (!reference || !guide || !window.location.hash) return;
        document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ block: "start" });
    }, [reference, guide]);

    const inLesson = !reference && !!stationParam;

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                {!inLesson && (
                    <>
                        <Link
                            href={`/dashboard/exam-prep/sprechen?level=${encodeURIComponent(level)}`}
                            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition"
                        >
                            <ArrowLeft className="size-4" />
                            Mündlicher Ausdruck
                        </Link>

                        <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: SPEAKING_COLOR }}>
                                Lernen · {level}
                            </p>
                            <h1 className="text-2xl font-bold text-foreground">
                                Teil {part}: {meta.title}
                            </h1>
                        </div>

                        <nav className="mt-4 flex flex-wrap items-center gap-2" aria-label="Teil wählen">
                            {SPEAKING_PARTS.map((p) => (
                                <button
                                    key={p.part}
                                    type="button"
                                    aria-current={p.part === part ? "page" : undefined}
                                    onClick={() => router.replace(learnHref(level, p.part) + (reference ? "&view=nachschlagen" : ""))}
                                    className={cn(
                                        "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                                        p.part === part ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground/70 hover:bg-accent",
                                    )}
                                >
                                    Teil {p.part}
                                </button>
                            ))}
                            <button
                                type="button"
                                aria-pressed={reference}
                                onClick={() => go(reference ? {} : { view: "nachschlagen" })}
                                className="ms-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground/70 transition hover:bg-accent"
                            >
                                <BookOpen className="size-4" aria-hidden="true" />
                                {reference ? "Zum Lernpfad" : "Nachschlagen"}
                            </button>
                        </nav>
                    </>
                )}

                <div className="mt-6">
                    {isLoading ? (
                        <Loading />
                    ) : isError ? (
                        <div className="rounded-[10px] bg-card p-8 text-center text-sm text-foreground/55 shadow-card">Der Lernbereich konnte nicht geladen werden.</div>
                    ) : !guide ? (
                        <div className="rounded-[10px] bg-card p-8 text-center text-sm text-foreground/55 shadow-card">
                            Für {level} gibt es noch keinen Lernbereich für diesen Teil.
                        </div>
                    ) : reference ? (
                        <GuideLearnView guide={guide.content} part={part} />
                    ) : (
                        <PathView key={`${level}-${part}`} level={level} part={part} guide={guide.content} stationId={stationParam} onNavigate={(s) => go(s ? { station: s } : {})} />
                    )}
                </div>

                {!inLesson && (
                    <div className="mt-6 flex justify-end">
                        <Link
                            href={speakingPathTexts(level, part).exerciseHref}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                            Zu den Übungen <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                    </div>
                )}
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
