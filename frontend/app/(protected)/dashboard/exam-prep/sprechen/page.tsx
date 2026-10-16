"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import { getExamExercisesSummary } from "@/services/examService";
import { DTZ_LEVEL, parseSpeakingExam, speakingHubHref, speakingPartsOf } from "@/componenets/exam/speaking";
import SpeakingHubView, { SpeakingHubPart } from "@/componenets/exam/speaking/SpeakingHubView";
import { buildSpeakingStations } from "@/componenets/exam/speaking/learn/stations";
import { useSpeakingGuides } from "@/hooks/exam/useSpeakingGuides";
import { getSpeakingLearnProgress } from "@/services/speakingLearnProgressService";

function SprechenContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const exam = parseSpeakingExam(searchParams.get("exam"));
    // DTZ A2-B1 has one fixed level; its exercises and guides are stored at B1.
    const level = exam === "DTZ" ? DTZ_LEVEL : (searchParams.get("level") ?? profileLevel ?? "B1");

    const { data: exercises = [], isLoading } = useQuery({
        queryKey: ["exam", "exercises", "MUENDLICHER_AUSDRUCK", exam, level],
        queryFn: () => getExamExercisesSummary("MUENDLICHER_AUSDRUCK", level, undefined, exam).then((res) => res.data),
    });

    const { guideFor } = useSpeakingGuides(level, exam);
    const { data: progress = [] } = useQuery({
        queryKey: ["speaking", "learn-progress", exam, level],
        queryFn: () => getSpeakingLearnProgress(level, exam).then((r) => r.data),
        retry: 1,
    });
    /** Finished / total stations of the Teil's learning path; null while the Lernbereich is unavailable. */
    const pathOf = (part: number) => {
        const guide = guideFor(part);
        if (!guide) return null;
        const stations = buildSpeakingStations(guide.content, part, level);
        return { total: stations.length, done: stations.filter((s) => progress.some((p) => p.part === part && p.station === s.id)).length };
    };

    const parts: SpeakingHubPart[] = speakingPartsOf(exam).map((part) => {
        const items = exercises.filter((e) => (e.partNumber ?? 1) === part.part);
        return { part: part.part, path: pathOf(part.part), exercisesTotal: items.length, exercisesDone: items.filter((e) => e.completed).length };
    });

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir="ltr">
            <div className="mx-auto max-w-4xl">
                {isLoading ? (
                    <Loading />
                ) : (
                    <SpeakingHubView exam={exam} level={level} parts={parts} onLevelChange={(l) => router.replace(speakingHubHref(l, exam))} />
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
