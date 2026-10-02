"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Target } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { getExamTimeWeekSummary } from "@/services/examTimeService";

/**
 * Small exam-preparation nudge for TELC learners. It states one number and links on; the detailed
 * time analytics live on their own page, so the dashboard stays action-oriented.
 */
export default function ExamTimeInsightCard() {
    const { userProfile, hasHydrated } = useAuthStore();
    const level = userProfile?.examLevel;
    const isTelcLearner = hasHydrated && userProfile?.examType === "TELC" && !!level;

    const { data } = useQuery({
        queryKey: ["exam", "time-week-summary"],
        queryFn: () => getExamTimeWeekSummary().then((res) => res.data),
        enabled: isTelcLearner,
        staleTime: 60 * 1000,
    });

    if (!isTelcLearner) return null;

    const count = data?.timedExercisesThisWeek;
    let message = "Übe mit der Zeitmessung, um ein Gefühl für die Prüfungszeit zu bekommen.";
    if (count === 1) message = "Du hast diese Woche 1 Prüfungsübung mit Zeitlimit abgeschlossen.";
    else if (count != null && count > 1) message = `Du hast diese Woche ${count} Prüfungsübungen mit Zeitlimit abgeschlossen.`;

    return (
        <Link
            href={`/dashboard/exam-prep/zeitmanagement?level=${encodeURIComponent(level)}`}
            className="group flex items-center gap-4 rounded-2xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-learning-exam/12">
                <Target className="size-5 text-learning-exam" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">TELC {level} Vorbereitung</span>
                <span className="mt-0.5 block text-sm text-foreground/65">{message}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-learning-exam transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
    );
}
