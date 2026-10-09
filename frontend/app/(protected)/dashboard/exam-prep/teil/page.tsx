"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play } from "lucide-react";
import { getExamExercisesSummary } from "@/services/examService";
import { ExamSection } from "@/types/exam";
import Loading from "@/componenets/Loading";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import {
    EXAM_TYPE_META,
    EXAM_TYPE_ORDER,
    ExamExerciseList,
    effectiveScore,
    findGroupByKey,
} from "@/componenets/exam";
import TeilTimeCard from "@/componenets/exam/TeilTimeCard";
import ExamTeilOverview from "@/componenets/exam/ExamTeilOverview";
import { SECTION_THEME } from "@/componenets/exam/lessonTheme";
import SpeakingTeilOverview from "@/componenets/exam/speaking/SpeakingTeilOverview";
import { useExerciseLastTimes } from "@/hooks/exam/useExerciseLastTimes";
import { TIMED_SECTIONS } from "@/lib/examTime";

const VALID_SECTIONS = new Set<string>(EXAM_TYPE_ORDER);

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

    const isValid = !!section && !!level && !!partKey && VALID_SECTIONS.has(section);
    const typedSection = section as ExamSection;

    const lastTimes = useExerciseLastTimes(typedSection, level);

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
            ? `Review: ${continueItem.title}`
            : group.mastered === 0 && !group.items.some((item) => item.completed)
              ? `Starten: ${continueItem.title}`
              : `Weiter: ${continueItem.title}`;

    const teil = group.items[0]?.teil ?? null;

    const backHref = `/dashboard/exam-prep?section=${typedSection}&level=${encodeURIComponent(level)}`;

    const sectionTheme = SECTION_THEME[typedSection];
    if (sectionTheme && teil != null) {
        return (
            <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir="ltr">
                <div className="mx-auto max-w-4xl">
                    <ExamTeilOverview
                        section={typedSection}
                        accent={sectionTheme.accent}
                        sectionLabel={meta.label}
                        emoji={sectionTheme.emoji}
                        items={group.items}
                        level={level}
                        teil={teil}
                        heading={group.heading}
                        subheading={group.subheading}
                        backHref={backHref}
                        lastTimes={lastTimes}
                    />
                </div>
            </div>
        );
    }

    if (typedSection === "MUENDLICHER_AUSDRUCK" && teil != null) {
        return (
            <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir="ltr">
                <div className="mx-auto max-w-4xl">
                    <SpeakingTeilOverview
                        items={group.items}
                        level={level}
                        teil={teil}
                        heading={group.heading}
                        subheading={group.subheading}
                        backHref={backHref}
                        backLabel={meta.label}
                        lastTimes={lastTimes}
                    />
                </div>
            </div>
        );
    }

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

                {teil != null && TIMED_SECTIONS.includes(typedSection) && (
                    <div className="mt-4">
                        <TeilTimeCard section={typedSection} level={level} teil={teil} />
                    </div>
                )}

                <h2 className="mt-8 text-sm font-semibold text-foreground/70">Übungen</h2>

                <ExamExerciseList className="mt-3" items={group.items} color={meta.color} lastTimes={lastTimes} />
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
