"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getRedemittelReviewSession } from "@/services/redemittelService";
import RedemittelSession from "@/componenets/redemittel/RedemittelSession";
import Loading from "@/componenets/Loading";
import { REDEMITTEL_ACCENT } from "@/componenets/redemittel/redemittelMeta";
import { ACCENT_TITLE_COLOR, levelThemeVars } from "@/componenets/learning/levelMeta";

export default function RedemittelReviewPage() {
    // Fetched once per visit: answering moves items out of "due" and the session must not reshuffle under the learner.
    const { data, isLoading } = useQuery({
        queryKey: ["redemittel", "review-session"],
        queryFn: () => getRedemittelReviewSession(10).then((res) => res.data),
        staleTime: Infinity,
        gcTime: 0,
    });

    if (isLoading || !data) return <Loading />;

    return (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10" dir="ltr" style={levelThemeVars(REDEMITTEL_ACCENT)}>
            <div className="mx-auto max-w-2xl">
                {data.exercises.length === 0 ? (
                    <div className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
                        <p className="text-lg font-semibold text-foreground">✓ Keine Wiederholungen</p>
                        <p className="mt-2 text-sm text-foreground/60">Du hast momentan keine Redemittel zur Wiederholung.</p>
                        <Link href="/dashboard/redemittel" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                            Zur Übersicht
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1 className="mb-1 text-2xl font-extrabold" style={{ color: ACCENT_TITLE_COLOR }}>🔄 Wiederholung</h1>
                        <p className="mb-6 text-sm text-foreground/60">
                            {data.total} Redemittel warten auf dich{data.total > data.exercises.length ? ` – heute ${data.exercises.length}` : ""}.
                        </p>
                        <RedemittelSession mode="review" title="Wiederholung" exercises={data.exercises} backHref="/dashboard/redemittel" />
                    </>
                )}
            </div>
        </div>
    );
}
