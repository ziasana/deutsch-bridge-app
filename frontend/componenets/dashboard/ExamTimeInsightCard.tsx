"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { getExamTimeWeekSummary } from "@/services/examTimeService";
import { Card } from "@/componenets/ui/card";

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
        <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Target className="size-5 text-primary" /> TELC {level} Vorbereitung
            </h2>
            <p className="mt-3 text-sm font-medium text-foreground/70">Zeitmanagement</p>
            <p className="mt-1 text-foreground">{message}</p>
            <Link
                href={`/dashboard/exam-prep/zeitmanagement?level=${encodeURIComponent(level)}`}
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
                Zeitmanagement ansehen →
            </Link>
        </Card>
    );
}
