"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Flag, Layers, Target, Timer, TriangleAlert } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { getExamTimeManagement } from "@/services/examTimeService";
import { formatClock, formatDifference } from "@/lib/examTime";
import { EXAM_TYPE_META } from "@/componenets/exam";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import Loading from "@/componenets/Loading";
import { cn } from "@/lib/utils";
import { ExamTimeManagementRow } from "@/types/examTime";

function StatTile({ icon: Icon, value, label, tone }: Readonly<{ icon: typeof Timer; value: string; label: string; tone?: "good" | "warn" }>) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-border/50">
            <span
                className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    tone === "good" ? "bg-green-500/15 text-green-600 dark:text-green-400" : tone === "warn" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary",
                )}
            >
                <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <p className="text-2xl font-extrabold leading-tight tabular-nums text-foreground">{value}</p>
                <p className="text-xs text-foreground/55">{label}</p>
            </div>
        </div>
    );
}

/** Average time against the recommended time: a bar that fills up to the average, with a marker where the recommendation lies. */
function TimeBar({ average, target, within }: Readonly<{ average: number; target: number; within: boolean }>) {
    const max = Math.max(average, target) * 1.15 || 1;
    return (
        <div
            role="img"
            aria-label={`Durchschnitt ${formatClock(average)}, empfohlen ${formatClock(target)}`}
            className="relative mt-3 h-3 rounded-full bg-foreground/10"
        >
            <div
                className={cn("h-full rounded-full transition-all duration-700", within ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-amber-500 to-orange-400")}
                style={{ width: `${(average / max) * 100}%` }}
            />
            <span aria-hidden="true" className="absolute -top-1.5 h-6 w-0.5 rounded-full bg-foreground/60" style={{ left: `${(target / max) * 100}%` }} />
        </div>
    );
}

function TeilTimeRow({ row }: Readonly<{ row: ExamTimeManagementRow }>) {
    const meta = EXAM_TYPE_META[row.section];
    const Icon = meta.icon;
    const hasTarget = row.targetSeconds != null && row.differenceSeconds != null;
    const within = hasTarget && row.differenceSeconds! <= 0;
    return (
        <li className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-border/50 sm:p-5" style={{ borderInlineStart: `5px solid ${meta.color}` }}>
            <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: meta.color }}>
                    <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="font-bold leading-tight text-foreground">
                        {meta.label} · Teil {row.teil}
                    </p>
                    <p className="text-xs text-foreground/50">
                        {row.sessions} {row.sessions === 1 ? "Übung" : "Übungen"} gemessen
                    </p>
                </div>
                {hasTarget && (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                            within ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                        )}
                    >
                        {within ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <TriangleAlert className="size-3.5" aria-hidden="true" />}
                        {within ? "Innerhalb der Vorgabe" : "Etwas zu langsam"}
                    </span>
                )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center sm:text-start">
                <div>
                    <p className="text-xs text-foreground/50">Durchschnitt</p>
                    <p className="text-xl font-extrabold tabular-nums text-foreground">{formatClock(row.averageSeconds)}</p>
                </div>
                {hasTarget && (
                    <>
                        <div>
                            <p className="text-xs text-foreground/50">Empfohlen</p>
                            <p className="text-xl font-extrabold tabular-nums text-foreground">{formatClock(row.targetSeconds!)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-foreground/50">Unterschied</p>
                            <p className={cn("text-xl font-extrabold tabular-nums", within ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")}>
                                {formatDifference(row.differenceSeconds!)}
                            </p>
                        </div>
                    </>
                )}
            </div>
            {hasTarget && <TimeBar average={row.averageSeconds} target={row.targetSeconds!} within={within} />}
        </li>
    );
}

function TimeManagementContent() {
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const level = searchParams.get("level") ?? userProfile?.examLevel ?? "B1";
    const [filter, setFilter] = useState<string>("ALL");

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["exam", "time-management", level],
        queryFn: () => getExamTimeManagement(level).then((res) => res.data),
    });

    const stats = useMemo(() => {
        const measured = rows.filter((r) => r.targetSeconds != null && r.differenceSeconds != null);
        return {
            sessions: rows.reduce((n, r) => n + r.sessions, 0),
            measured: measured.length,
            within: measured.filter((r) => r.differenceSeconds! <= 0).length,
        };
    }, [rows]);
    const sections = useMemo(() => Array.from(new Set(rows.map((r) => r.section))), [rows]);
    const shown = filter === "ALL" ? rows : rows.filter((r) => r.section === filter);

    if (isLoading) return <Loading />;

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir="ltr">
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/dashboard/exam-prep" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Prüfungsvorbereitung
                </Link>

                <LearningPageHero
                    icon={Timer}
                    title="Mein Zeitmanagement"
                    subtitle={`Deine durchschnittliche Zeit pro Teil – im Vergleich zur Prüfungsvorgabe.`}
                    meta={<span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">TELC {level}</span>}
                />

                {rows.length === 0 ? (
                    <div className="rounded-3xl bg-card p-8 text-center shadow-card ring-1 ring-primary/15">
                        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Timer className="size-8" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-lg font-bold text-foreground">Noch keine Zeiten für {level}</p>
                        <p className="mx-auto mt-1 max-w-md text-sm text-foreground/60">
                            Öffne eine Übung und schließe sie ab – und deine Zeiten erscheinen hier.
                        </p>
                        <Link href="/dashboard/exam-prep" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                            Zu den Übungen
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <StatTile icon={Layers} value={String(stats.sessions)} label="Übungen mit Zeitmessung" />
                            <StatTile icon={Target} value={`${stats.within}/${stats.measured}`} label="Teile in der Vorgabe" tone={stats.measured > 0 && stats.within === stats.measured ? "good" : undefined} />
                            <StatTile icon={Flag} value={String(rows.length)} label="Teile geübt" />
                        </div>

                        {sections.length > 1 && (
                            <div role="group" aria-label="Bereich filtern" className="flex flex-wrap gap-2">
                                {["ALL", ...sections].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        aria-pressed={filter === s}
                                        onClick={() => setFilter(s)}
                                        className={cn(
                                            "cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                            filter === s ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground/70 hover:bg-accent",
                                        )}
                                    >
                                        {s === "ALL" ? "Alle" : EXAM_TYPE_META[s as keyof typeof EXAM_TYPE_META].label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <ul className="space-y-3">
                            {shown.map((row) => (
                                <TeilTimeRow key={`${row.section}-${row.teil}`} row={row} />
                            ))}
                        </ul>

                        <p className="flex items-center gap-2 px-1 text-xs text-foreground/50">
                            <span aria-hidden="true" className="inline-block h-4 w-0.5 rounded-full bg-foreground/60" /> Die Markierung im Balken zeigt die empfohlene Zeit.
                        </p>
                    </>
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
