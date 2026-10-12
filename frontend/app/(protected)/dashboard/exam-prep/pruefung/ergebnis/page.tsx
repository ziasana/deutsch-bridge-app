"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RotateCw } from "lucide-react";
import Loading from "@/componenets/Loading";
import SimResultView from "@/componenets/exam/simulation/SimResultView";
import { getSimulationHistory, getSimulationResult } from "@/services/examSimulationService";
import { simulationError, simulationErrorMessage } from "@/lib/examSimulation";

function ResultContent() {
    const router = useRouter();
    const attemptId = useSearchParams().get("attempt");

    const { data, isLoading, error } = useQuery({
        queryKey: ["exam-simulation", "result", attemptId],
        queryFn: async () => (await getSimulationResult(attemptId as string)).data,
        enabled: !!attemptId,
        retry: false,
        // While an assessment is outstanding the result changes; poll gently.
        refetchInterval: (query) => (query.state.data?.result.pendingAssessmentParts.length ? 60_000 : false),
    });

    // The attempt before this one, for the "better / worse than last time" chip.
    const history = useQuery({ queryKey: ["exam-simulation", "history"], queryFn: async () => (await getSimulationHistory()).data, enabled: !!data });
    const previous = data
        ? [...(history.data?.progress ?? [])]
              .filter((p) => p.attemptId !== data.attemptId && p.writtenComplete && p.writtenScore != null && p.endedAtMs < (data.endedAtMs ?? Number.MAX_SAFE_INTEGER))
              .sort((a, b) => b.endedAtMs - a.endedAtMs)[0]
        : undefined;

    // Still running: the result does not exist yet, continue the exam instead.
    const running = simulationError(error)?.code === "ATTEMPT_IN_PROGRESS";
    useEffect(() => {
        if (running && attemptId) router.replace(`/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(attemptId)}`);
    }, [running, attemptId, router]);

    if (!attemptId) return <p className="p-10 text-center text-foreground/70">Keine Prüfung ausgewählt.</p>;
    if (isLoading || running) return <Loading />;
    if (error || !data) {
        return (
            <div className="mx-auto max-w-lg p-10 text-center">
                <p className="text-foreground">{simulationErrorMessage(error, "Das Ergebnis konnte nicht geladen werden.")}</p>
                <Link href="/dashboard/exam-prep/pruefung" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                    Zur Übersicht
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-6" dir="ltr">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/dashboard/exam-prep/pruefung" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                        <ArrowLeft className="size-4" aria-hidden /> Zur Übersicht
                    </Link>
                    <p className="text-sm font-semibold text-foreground/60">{data.profileTitle}</p>
                </div>
                <SimResultView data={data} previousScore={previous?.writtenScore ?? null} />
                <div className="flex flex-wrap gap-3 pb-10">
                    <Link href="/dashboard/exam-prep/pruefung" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                        <RotateCw className="size-4" aria-hidden /> Weitere Prüfung starten
                    </Link>
                    <Link href="/dashboard/exam-prep/pruefung#verlauf" className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent">
                        Verlauf ansehen
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ExamResultPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ResultContent />
        </Suspense>
    );
}
