"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import Loading from "@/componenets/Loading";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import SimResultView from "@/componenets/exam/simulation/SimResultView";
import { getSimulationResult } from "@/services/examSimulationService";
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
        <div className="min-h-screen bg-background px-4 py-10 sm:px-6" dir="ltr">
            <div className="mx-auto max-w-5xl space-y-6">
                <LearningPageHero icon={ClipboardCheck} title="Dein Prüfungsergebnis" subtitle={data.profileTitle} />
                <SimResultView data={data} />
                <div className="flex flex-wrap gap-3 pb-10">
                    <Link href="/dashboard/exam-prep/pruefung" className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                        Weitere Prüfung starten
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
