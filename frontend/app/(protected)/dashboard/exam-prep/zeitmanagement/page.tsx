"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { getExamTimeManagement } from "@/services/examTimeService";
import { formatClock, formatDifference } from "@/lib/examTime";
import { EXAM_TYPE_META } from "@/componenets/exam";
import Loading from "@/componenets/Loading";

function TimeManagementContent() {
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const level = searchParams.get("level") ?? userProfile?.examLevel ?? "B1";

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["exam", "time-management", level],
        queryFn: () => getExamTimeManagement(level).then((res) => res.data),
    });

    if (isLoading) return <Loading />;

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard/exam-prep" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition">
                    <ArrowLeft className="size-4" />
                    Prüfungsvorbereitung
                </Link>

                <h1 className="mt-4 text-2xl font-bold text-foreground">Mein Zeitmanagement</h1>
                <p className="text-foreground/60 mt-0.5">TELC {level} – deine durchschnittliche Zeit pro Teil</p>

                {rows.length === 0 ? (
                    <div className="mt-6 rounded-[10px] bg-card shadow-card p-5 text-sm text-foreground/60">
                        Noch keine abgeschlossenen Übungen mit Zeitmessung für {level}. Öffne eine Übung, schließe sie ab – und deine Zeiten erscheinen hier.
                    </div>
                ) : (
                    <div className="mt-6 space-y-3">
                        {rows.map((row) => {
                            const meta = EXAM_TYPE_META[row.section];
                            const within = row.differenceSeconds != null && row.differenceSeconds <= 0;
                            return (
                                <div key={`${row.section}-${row.teil}`} className="rounded-[10px] bg-card shadow-card p-4 sm:p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-foreground">
                                            {meta.label} · Teil {row.teil}
                                        </div>
                                        <span className="text-xs text-foreground/40">
                                            {row.sessions} {row.sessions === 1 ? "Übung" : "Übungen"}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
                                        <div>
                                            <div className="text-xs text-foreground/50">Durchschnitt</div>
                                            <div className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{formatClock(row.averageSeconds)}</div>
                                        </div>
                                        {row.targetSeconds != null && row.differenceSeconds != null && (
                                            <>
                                                <div>
                                                    <div className="text-xs text-foreground/50">Empfohlen</div>
                                                    <div className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{formatClock(row.targetSeconds)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-foreground/50">Unterschied</div>
                                                    <div className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{formatDifference(row.differenceSeconds)}</div>
                                                </div>
                                                {within && (
                                                    <span className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
                                                        <CheckCircle2 className="size-4" /> Innerhalb der Vorgabe
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TimeManagementPage() {
    return (
        <Suspense fallback={<Loading />}>
            <TimeManagementContent />
        </Suspense>
    );
}
