"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ClipboardCheck, Clock, Headphones, Mic, Pause, PenLine, Play, RotateCw, Timer } from "lucide-react";
import Loading from "@/componenets/Loading";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import SimProgressChart from "@/componenets/exam/simulation/SimProgressChart";
import SimResultBadge from "@/componenets/exam/simulation/SimResultBadge";
import { cancelSimulationAttempt, getSimulationHistory, getSimulationProfiles, startSimulationAttempt } from "@/services/examSimulationService";
import { BLOCKED_REASON, formatDateTime, formatDuration, formatPoints, simulationError, simulationErrorMessage } from "@/lib/examSimulation";
import { enterFullscreen, exitFullscreen } from "@/lib/fullscreen";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { AttemptSummary, ProfileOverview } from "@/types/examSimulation";

const STATUS_LABEL: Record<string, string> = { IN_PROGRESS: "Läuft", COMPLETED: "Abgeschlossen", EXPIRED: "Zeit abgelaufen", CANCELLED: "Abgebrochen" };

function ProfileCard({ profile }: Readonly<{ profile: ProfileOverview }>) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [confirmCancel, setConfirmCancel] = useState(false);

    const start = useMutation({
        mutationFn: () => startSimulationAttempt(profile.id),
        onSuccess: (res) => router.push(`/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(res.data.attemptId)}&fresh=1`),
        onError: (error) => {
            const body = simulationError(error);
            if (body?.code !== "ACTIVE_ATTEMPT_EXISTS") exitFullscreen();
            if (body?.code === "ACTIVE_ATTEMPT_EXISTS" && typeof body.details?.attemptId === "string") {
                router.push(`/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(body.details.attemptId)}`);
                return;
            }
            toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht gestartet werden."));
            void queryClient.invalidateQueries({ queryKey: ["exam-simulation"] });
        },
    });

    const cancel = useMutation({
        mutationFn: () => cancelSimulationAttempt(profile.activeAttemptId as string),
        onSuccess: () => {
            toast.info("Die Prüfung wurde abgebrochen. Die verwendeten Aufgaben bleiben verbraucht.");
            void queryClient.invalidateQueries({ queryKey: ["exam-simulation"] });
        },
        onError: (error) => toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht abgebrochen werden.")),
        onSettled: () => setConfirmCancel(false),
    });

    const written = profile.parts.filter((p) => p.module === "WRITTEN");
    const oral = profile.parts.filter((p) => p.module === "ORAL");
    const lowContent = profile.parts.filter((p) => p.unused < p.required);

    return (
        <article className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6" aria-label={profile.title}>
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">
                        {profile.provider} · {profile.level} · Version {profile.version}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-foreground">{profile.title}</h2>
                    {profile.description && <p className="mt-1 max-w-2xl text-sm text-foreground/70">{profile.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                    {profile.activeAttemptId ? (
                        <>
                            {profile.activeAttemptPaused && (
                                <span className="inline-flex items-center gap-1.5 self-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    <Pause className="size-3.5" aria-hidden /> Pausiert – die Zeit steht
                                </span>
                            )}
                            <Link onClick={enterFullscreen} href={`/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(profile.activeAttemptId)}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                                <RotateCw className="size-4" aria-hidden /> {profile.activeAttemptPaused ? "Pause beenden und fortsetzen" : "Prüfung fortsetzen"}
                            </Link>
                            <button type="button" onClick={() => setConfirmCancel(true)} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-accent">
                                Abbrechen
                            </button>
                        </>
                    ) : (
                        <button type="button" disabled={!profile.canStart || start.isPending} onClick={() => {
                            // Must happen inside the click: browsers only allow fullscreen after a user gesture.
                            enterFullscreen();
                            start.mutate();
                        }} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
                            <Play className="size-4" aria-hidden /> {start.isPending ? "Wird vorbereitet …" : "Prüfung starten"}
                        </button>
                    )}
                </div>
            </header>

            {profile.blockedReason && profile.blockedReason !== "ACTIVE_ATTEMPT" && (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                        {BLOCKED_REASON[profile.blockedReason]}
                        {profile.blockedReason === "INSUFFICIENT_CONTENT" && lowContent.length > 0 && <> Betroffen: {lowContent.map((p) => p.label).join(", ")}.</>}
                    </span>
                </p>
            )}

            <dl className="mt-5 grid gap-3 sm:grid-cols-4">
                {[
                    { icon: Timer, label: "Gesamtdauer", value: `${profile.totalMinutes} Min.` },
                    { icon: ClipboardCheck, label: "Schriftlich", value: `${formatPoints(profile.writtenMaxPoints)} Punkte` },
                    { icon: Mic, label: "Mündlich", value: profile.oralScoringEnabled ? `${formatPoints(profile.oralMaxPoints)} Punkte` : "Übung, nicht bewertet" },
                    { icon: Clock, label: "Bestehen schriftlich", value: `ab ${formatPoints(profile.writtenPassThreshold)} Punkten` },
                ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl bg-accent/40 p-3">
                        <dt className="flex items-center gap-1.5 text-xs text-foreground/60">
                            <Icon className="size-3.5" aria-hidden /> {label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-bold text-foreground">{value}</dd>
                    </div>
                ))}
            </dl>

            <section className="mt-6" aria-label="Ablauf">
                <h3 className="text-sm font-bold text-foreground">Ablauf und Zeiten</h3>
                <ol className="mt-3 grid gap-3 p-0 md:grid-cols-2">
                    {profile.stages.map((stage, index) => {
                        const parts = profile.parts.filter((p) => stage.partKeys.includes(p.key));
                        return (
                            <li key={stage.key} className="list-none rounded-2xl border border-border/60 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-bold text-foreground">
                                        {index + 1}. {stage.label}
                                    </p>
                                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">{stage.minutes} Min.</span>
                                </div>
                                {stage.kind === "PREPARATION" && <p className="mt-1 text-xs text-foreground/60">Du siehst die Aufgaben, sprechen kommt danach.</p>}
                                {stage.kind === "WORKING" && (
                                    <ul className="mt-2 space-y-1 p-0">
                                        {parts.map((p) => (
                                            <li key={p.key} className="flex list-none items-center justify-between gap-2 text-xs text-foreground/75">
                                                <span>
                                                    {p.label}
                                                    {p.scoringMethod === "PER_QUESTION" && <span className="text-foreground/50"> · {p.questionCount} Fragen</span>}
                                                </span>
                                                <span className="tabular-nums">
                                                    {p.module === "ORAL" && !profile.oralScoringEnabled ? "Übung" : `${formatPoints(p.maxPoints)} P.`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ol>
                <p className="mt-3 text-xs leading-relaxed text-foreground/60">
                    Die Zeit läuft auf dem Server. Wenn du die Seite neu lädst, geht es mit deinen gespeicherten Antworten und der verbleibenden Zeit weiter. Ist ein Abschnitt beendet,
                    kannst du nicht zurück. Die Prüfung enthält {written.length} schriftliche und {oral.length} mündliche Teile; jede Aufgabe wird dir nur einmal vorgelegt.
                </p>
            </section>

            <section className="mt-6" aria-label="Bewertung">
                <h3 className="text-sm font-bold text-foreground">Bewertung und Bestehen</h3>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-foreground/75">
                    <li>
                        Schriftlich: {formatPoints(profile.writtenMaxPoints)} Punkte, bestanden ab {formatPoints(profile.writtenPassThreshold)} Punkten. Der Schriftliche Ausdruck wird von Hand bewertet; bis dahin steht das Ergebnis aus.
                    </li>
                    <li>
                        Mündlich: {formatPoints(profile.oralMaxPoints)} Punkte
                        {profile.oralScoringEnabled ? `, bestanden ab ${formatPoints(profile.oralPassThreshold)} Punkten.` : ". In dieser Simulation übst du nur – es gibt keine Punkte und kein Bestehen."}
                    </li>
                    <li>Das Gesamtergebnis „bestanden“ erscheint erst, wenn alle verlangten Teile bewertet sind.</li>
                </ul>
            </section>

            <section className="mt-6" aria-label="Verfügbare Aufgaben">
                <h3 className="text-sm font-bold text-foreground">Noch nicht verwendete Aufgaben für dich</h3>
                <ul className="mt-2 grid gap-x-6 gap-y-1 p-0 sm:grid-cols-2">
                    {profile.parts.map((p) => (
                        <li key={p.key} className="flex list-none items-center justify-between gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 text-foreground/75">
                                {p.section === "HOERVERSTEHEN" && <Headphones className="size-3" aria-hidden />}
                                {p.section === "SCHRIFTLICHER_AUSDRUCK" && <PenLine className="size-3" aria-hidden />}
                                {p.label}
                            </span>
                            <span className={cn("font-semibold tabular-nums", p.unused < p.required ? "text-red-600 dark:text-red-400" : p.unused <= 1 ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
                                {p.unused} von {p.eligible}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            {(profile.latest || profile.best) && (
                <section className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Deine Ergebnisse">
                    {([["Letztes Ergebnis", profile.latest], ["Bestes Ergebnis", profile.best]] as const).map(
                        ([title, a]) =>
                            a && (
                                <Link key={title} href={`/dashboard/exam-prep/pruefung/ergebnis?attempt=${encodeURIComponent(a.id)}`} className="rounded-2xl border border-border/60 p-4 transition hover:bg-accent/40">
                                    <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">{title}</p>
                                    <p className="mt-1 text-lg font-extrabold tabular-nums text-foreground">
                                        {a.writtenComplete ? formatPoints(a.writtenScore) : "–"} <span className="text-sm font-semibold text-foreground/50">/ {formatPoints(a.writtenMax)} schriftlich</span>
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <SimResultBadge status={a.writtenResult} />
                                        <span className="text-xs text-foreground/60">{formatDateTime(a.endedAtMs ?? a.startedAtMs)}</span>
                                    </div>
                                </Link>
                            ),
                    )}
                </section>
            )}

            <ConfirmDialog
                isOpen={confirmCancel}
                title="Prüfung abbrechen?"
                message="Die Prüfung wird beendet und nicht gewertet. Die bereits zugeteilten Aufgaben werden dir nicht noch einmal angeboten."
                confirmLabel="Prüfung abbrechen"
                cancelLabel="Zurück"
                onConfirm={() => cancel.mutate()}
                onCancel={() => setConfirmCancel(false)}
            />
        </article>
    );
}

function HistoryTable({ attempts }: Readonly<{ attempts: AttemptSummary[] }>) {
    if (attempts.length === 0) return <p className="text-sm text-foreground/60">Du hast noch keine Prüfung gemacht.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
                <thead>
                    <tr className="text-xs uppercase tracking-wide text-foreground/50">
                        <th className="py-2 text-start font-medium">Datum</th>
                        <th className="py-2 text-start font-medium">Status</th>
                        <th className="py-2 text-end font-medium">Schriftlich</th>
                        <th className="py-2 ps-4 text-start font-medium">Ergebnis</th>
                        <th className="py-2 text-end font-medium">Dauer</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {attempts.map((a) => (
                        <tr key={a.id} className="border-t border-border/50">
                            <td className="py-2.5">{formatDateTime(a.startedAtMs)}</td>
                            <td className="py-2.5">{STATUS_LABEL[a.status] ?? a.status}</td>
                            <td className="py-2.5 text-end tabular-nums">
                                {a.status === "CANCELLED" ? "–" : `${a.writtenComplete ? "" : "≥ "}${formatPoints(a.writtenScore)} / ${formatPoints(a.writtenMax)}`}
                            </td>
                            <td className="py-2.5 ps-4">{a.status === "CANCELLED" ? null : <SimResultBadge status={a.overallResult} />}</td>
                            <td className="py-2.5 text-end tabular-nums">{formatDuration(a.durationSeconds)}</td>
                            <td className="py-2.5 ps-4 text-end">
                                {a.status === "IN_PROGRESS" && (
                                    <Link className="font-semibold text-primary hover:underline" href={`/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(a.id)}`}>
                                        Fortsetzen
                                    </Link>
                                )}
                                {(a.status === "COMPLETED" || a.status === "EXPIRED") && (
                                    <Link className="font-semibold text-primary hover:underline" href={`/dashboard/exam-prep/pruefung/ergebnis?attempt=${encodeURIComponent(a.id)}`}>
                                        Ansehen
                                    </Link>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function OverviewContent() {
    const profiles = useQuery({ queryKey: ["exam-simulation", "profiles"], queryFn: () => getSimulationProfiles().then((r) => r.data) });
    const history = useQuery({ queryKey: ["exam-simulation", "history"], queryFn: () => getSimulationHistory().then((r) => r.data) });

    if (profiles.isLoading || history.isLoading) return <Loading />;
    const list = profiles.data ?? [];
    const first = list[0];

    return (
        <div className="min-h-screen bg-background px-4 py-10 sm:px-6" dir="ltr">
            <div className="mx-auto max-w-5xl space-y-6">
                <LearningPageHero icon={ClipboardCheck} title="Prüfungssimulation" subtitle="Eine vollständige Prüfung unter realistischen Bedingungen – mit Zeitlimit, ohne Lösungen vor der Abgabe." />
                <Link href="/dashboard/exam-prep" className="inline-block text-sm font-medium text-primary hover:underline">
                    ← Zurück zur Prüfungsvorbereitung
                </Link>

                {profiles.error && <p className="text-sm text-red-600">{simulationErrorMessage(profiles.error, "Die Prüfungsprofile konnten nicht geladen werden.")}</p>}
                {list.length === 0 && !profiles.error && (
                    <p className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-foreground/70">Derzeit ist keine Prüfungssimulation verfügbar.</p>
                )}
                {list.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} />
                ))}

                <section id="verlauf" className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6" aria-label="Verlauf">
                    <h2 className="text-lg font-bold text-foreground">Dein Verlauf</h2>
                    <div className="mt-4">
                        <SimProgressChart points={history.data?.progress ?? []} max={first?.writtenMaxPoints ?? 225} threshold={first?.writtenPassThreshold ?? 135} />
                    </div>
                    <div className="mt-6">
                        <HistoryTable attempts={history.data?.attempts ?? []} />
                    </div>
                </section>
            </div>
        </div>
    );
}

export default function ExamSimulationOverviewPage() {
    return (
        <Suspense fallback={<Loading />}>
            <OverviewContent />
        </Suspense>
    );
}
