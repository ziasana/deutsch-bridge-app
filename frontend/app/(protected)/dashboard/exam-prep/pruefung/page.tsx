"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ClipboardCheck, Flag, Mic, Pause, Play, RotateCw, Target, Timer, Trophy } from "lucide-react";
import Loading from "@/componenets/Loading";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import ContentSupply from "@/componenets/exam/simulation/overview/ContentSupply";
import ExamJourney from "@/componenets/exam/simulation/overview/ExamJourney";
import ResultsPanel from "@/componenets/exam/simulation/overview/ResultsPanel";
import StartDialog from "@/componenets/exam/simulation/overview/StartDialog";
import { cancelSimulationAttempt, getSimulationHistory, getSimulationProfiles, startSimulationAttempt } from "@/services/examSimulationService";
import { BLOCKED_REASON, formatPoints, simulationError, simulationErrorMessage } from "@/lib/examSimulation";
import { enterFullscreen, exitFullscreen } from "@/lib/fullscreen";
import { toast } from "@/lib/toast";
import type { ProfileOverview } from "@/types/examSimulation";

function ProfileSection({ profile }: Readonly<{ profile: ProfileOverview }>) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [confirmStart, setConfirmStart] = useState(false);

    const start = useMutation({
        mutationFn: () => startSimulationAttempt(profile.id),
        onSuccess: (res) => router.push(`/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(res.data.attemptId)}&fresh=1`),
        onError: (error) => {
            setConfirmStart(false);
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

    const lowContent = profile.parts.filter((p) => p.unused < p.required);
    const running = Boolean(profile.activeAttemptId);
    const stats = [
        { icon: Timer, label: "Dauer", value: `${profile.totalMinutes} Min.` },
        { icon: Target, label: "Schriftlich", value: `${formatPoints(profile.writtenMaxPoints)} P.` },
        { icon: Flag, label: "Bestehen ab", value: `${formatPoints(profile.writtenPassThreshold)} P.` },
        { icon: Trophy, label: "Versuche", value: String(profile.attemptCount) },
    ];

    return (
        <div className="space-y-6">
            <article aria-label={profile.title} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-6 text-primary-foreground shadow-md sm:p-8">
                <span aria-hidden className="absolute -end-12 -top-16 size-64 rounded-full bg-white/10" />
                <span aria-hidden className="absolute -bottom-20 end-1/4 size-48 rounded-full bg-white/[0.07]" />
                <span aria-hidden className="absolute end-8 top-6 hidden text-7xl opacity-20 sm:block">📝</span>
                <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/80">
                        {profile.provider} · {profile.level}
                    </p>
                    <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{profile.title}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-primary-foreground/90">
                        {profile.description ?? "Eine vollständige Prüfung unter realistischen Bedingungen – mit Zeitlimit, ohne Lösungen vor der Abgabe."}
                    </p>

                    <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {stats.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="rounded-2xl bg-white/15 px-3.5 py-2.5 backdrop-blur-sm">
                                <dt className="flex items-center gap-1.5 text-[11px] font-medium text-primary-foreground/80">
                                    <Icon className="size-3.5" aria-hidden /> {label}
                                </dt>
                                <dd className="text-lg font-extrabold tabular-nums">{value}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        {running ? (
                            <>
                                <Link onClick={enterFullscreen} href={`/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(profile.activeAttemptId as string)}`} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-primary shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                                    <RotateCw className="size-4" aria-hidden /> {profile.activeAttemptPaused ? "Pause beenden und fortsetzen" : "Prüfung fortsetzen"}
                                </Link>
                                <button type="button" onClick={() => setConfirmCancel(true)} className="rounded-full border border-white/50 px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-white/15">
                                    Abbrechen
                                </button>
                                {profile.activeAttemptPaused && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-1.5 text-xs font-bold text-amber-950">
                                        <Pause className="size-3.5" aria-hidden /> Pausiert – die Zeit steht
                                    </span>
                                )}
                            </>
                        ) : (
                            <button type="button" disabled={!profile.canStart || start.isPending} onClick={() => setConfirmStart(true)} className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-bold text-primary shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                                <Play className="size-5" aria-hidden /> Prüfung starten
                            </button>
                        )}
                    </div>
                </div>
            </article>

            {profile.blockedReason && profile.blockedReason !== "ACTIVE_ATTEMPT" && (
                <p role="alert" className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                        {BLOCKED_REASON[profile.blockedReason]}
                        {profile.blockedReason === "INSUFFICIENT_CONTENT" && lowContent.length > 0 && <> Betroffen: {lowContent.map((p) => p.label).join(", ")}.</>}
                    </span>
                </p>
            )}

            <ExamJourney profile={profile} />

            <section aria-label="Bewertung" className="grid gap-3 md:grid-cols-3">
                {[
                    { icon: ClipboardCheck, tone: "bg-teal-500/10 text-teal-700 dark:text-teal-300", title: "Schriftlich", text: `${formatPoints(profile.writtenMaxPoints)} Punkte, bestanden ab ${formatPoints(profile.writtenPassThreshold)}. Der Schriftliche Ausdruck wird von Hand bewertet – bis dahin steht das Ergebnis aus.` },
                    { icon: Mic, tone: "bg-pink-500/10 text-pink-700 dark:text-pink-300", title: "Mündlich", text: profile.oralScoringEnabled ? `${formatPoints(profile.oralMaxPoints)} Punkte, bestanden ab ${formatPoints(profile.oralPassThreshold)}.` : "In dieser Simulation übst du nur – es gibt keine Punkte und kein Bestehen." },
                    { icon: Trophy, tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300", title: "Gesamtergebnis", text: "„Bestanden“ erscheint erst, wenn alle verlangten Teile bewertet sind. Jede Aufgabe wird dir nur einmal vorgelegt." },
                ].map(({ icon: Icon, tone, title, text }) => (
                    <div key={title} className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                        <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" aria-hidden /></span>
                        <h3 className="mt-3 font-bold text-foreground">{title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/70">{text}</p>
                    </div>
                ))}
            </section>

            <ContentSupply profile={profile} />

            {confirmStart && (
                <StartDialog
                    totalMinutes={profile.totalMinutes}
                    starting={start.isPending}
                    onCancel={() => setConfirmStart(false)}
                    onStart={() => {
                        // Must happen inside the click: browsers only allow fullscreen after a user gesture.
                        enterFullscreen();
                        start.mutate();
                    }}
                />
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
        </div>
    );
}

function OverviewContent() {
    const profiles = useQuery({ queryKey: ["exam-simulation", "profiles"], queryFn: () => getSimulationProfiles().then((r) => r.data) });
    const history = useQuery({ queryKey: ["exam-simulation", "history"], queryFn: () => getSimulationHistory().then((r) => r.data) });

    if (profiles.isLoading || history.isLoading) return <Loading />;
    const list = profiles.data ?? [];

    return (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-6" dir="ltr">
            <div className="mx-auto max-w-5xl space-y-6">
                <Link href="/dashboard/exam-prep" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <ArrowLeft className="size-4" aria-hidden /> Zurück zur Prüfungsvorbereitung
                </Link>

                {profiles.error && <p className="text-sm text-red-600">{simulationErrorMessage(profiles.error, "Die Prüfungsprofile konnten nicht geladen werden.")}</p>}
                {list.length === 0 && !profiles.error && (
                    <p className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-foreground/70">Derzeit ist keine Probeprüfung verfügbar.</p>
                )}
                {list.map((profile) => (
                    <ProfileSection key={profile.id} profile={profile} />
                ))}

                <ResultsPanel profile={list[0]} attempts={history.data?.attempts ?? []} progress={history.data?.progress ?? []} />
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
