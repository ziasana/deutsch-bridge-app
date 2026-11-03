"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getExamExercisesSummary } from "@/services/examService";
import { ExamExercisePublicResponse } from "@/types/exam";

/** Previous / next Aufgabe of the same Teil, in the order of the Teil list. Renders nothing when there is no other Aufgabe. */
export default function ExerciseSiblingNav({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const examType = exercise.examType ?? "TELC";
    const { data: exercises = [] } = useQuery({
        queryKey: ["exam", "exercises", examType, exercise.section, exercise.level],
        queryFn: () => getExamExercisesSummary(exercise.section, exercise.level ?? undefined, undefined, examType).then((res) => res.data),
    });

    const siblings = exercises.filter((e) => e.teil === exercise.teil && e.taskType === exercise.taskType);
    const index = siblings.findIndex((e) => e.id === exercise.id);
    if (index < 0 || siblings.length < 2) return null;
    const previous = siblings[index - 1];
    const next = siblings[index + 1];
    const linkClass = "inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary shadow-card ring-1 ring-primary/15 transition hover:bg-primary/5";

    return (
        <nav aria-label="Aufgaben" className="flex items-center justify-between gap-3 pt-2">
            {previous ? (
                <Link href={`/dashboard/exam-prep/exercise?id=${previous.id}`} className={linkClass}>
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Vorherige Aufgabe
                </Link>
            ) : <span />}
            {next ? (
                <Link href={`/dashboard/exam-prep/exercise?id=${next.id}`} className={linkClass}>
                    Nächste Aufgabe
                    <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
            ) : <span />}
        </nav>
    );
}
