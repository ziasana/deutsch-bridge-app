"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ClipboardCheck, Flag, Mic, Pause, Play, RotateCw, Target, Timer, Trophy } from "lucide-react";
import Loading from "@/componenets/Loading";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import ExamSetList from "@/componenets/exam/simulation/overview/ExamSetList";
import ExamJourney from "@/componenets/exam/simulation/overview/ExamJourney";
import StartDialog from "@/componenets/exam/simulation/overview/StartDialog";
import { cancelSimulationAttempt, getSimulationProfiles, startSimulationAttempt } from "@/services/examSimulationService";
import { BLOCKED_REASON, formatPoints, simulationError, simulationErrorMessage } from "@/lib/examSimulation";
import { enterFullscreen, exitFullscreen } from "@/lib/fullscreen";
import { toast } from "@/lib/toast";
import type { ProfileOverview } from "@/types/examSimulation";

function ProfileSection({ profile }: Readonly<{ profile: ProfileOverview }>) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [startSetId, setStartSetId] = useState<string | null>(null);

    const start = useMutation({
        mutationFn: (setId: string) => startSimulationAttempt(profile.id, setId),
        onSuccess: (res) => router.push(`/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(res.data.attemptId)}&fresh=1`),
        onError: (error) => {
            setStartSetId(null);
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
            toast.info("Die Prüfung wurde abgebrochen. Diese Prüfung kannst du nicht noch einmal starten.");
            void queryClient.invalidateQueries({ queryKey: ["exam-simulation"] });
        },
        onError: (error) => toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht abgebrochen werden.")),
        onSettled: () => setConfirmCancel(false),
    });

    const nextSet = profile.sets.find((x) => x.status === "NEW");
    const running = Boolean(profile.activeAttemptId);
    const stats = [
        { icon: Timer, label: "Dauer", value: `${profile.totalMinutes} Min.` },
        { icon: Target, label: "Schriftlich", value: `${formatPoints(profile.writtenMaxPoints)} P.` },
        { icon: Flag, label: "Bestehen ab", value: `${formatPoints(profile.writtenPassThreshold)} P.` },
        { icon: Trophy, label: "Versuche", value: String(profile.attemptCount) },
    ];

    return (
        <div className="space-y-6">
            <LearningPageHero
                icon={ClipboardCheck}
                title={profile.title}
                subtitle={profile.description ?? "Eine vollständige Prüfung unter realistischen Bedingungen – mit Zeitlimit, ohne Lösungen vor der Abgabe."}
                meta={
                    <span className="inline-flex items-center rounded-full bg-[#f2b544] px-2.5 py-0.5 text-xs font-bold text-[#16324f]">
                        {profile.provider} · {profile.level}
                    </span>
                }
                actions={
                    running ? (
                        <>
                            <Link onClick={enterFullscreen} href={`/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(profile.activeAttemptId as string)}`} className="inline-flex items-center gap-2 rounded-full bg-[#f2b544] px-5 py-2.5 text-sm font-semibold text-[#16324f] shadow-sm transition hover:bg-[#f5c26b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                                <RotateCw className="size-4" aria-hidden /> {profile.activeAttemptPaused ? "Pause beenden und fortsetzen" : "Prüfung fortsetzen"}
                            </Link>
                            <button type="button" onClick={() => setConfirmCancel(true)} className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                                Abbrechen
                            </button>
                        </>
                    ) : (
                        <button type="button" disabled={!profile.canStart || !nextSet || start.isPending} onClick={() => nextSet && setStartSetId(nextSet.id)} className="inline-flex items-center gap-2 rounded-full bg-[#f2b544] px-5 py-2.5 text-sm font-semibold text-[#16324f] shadow-sm transition hover:bg-[#f5c26b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60">
                            <Play className="size-4" aria-hidden /> {nextSet ? `${nextSet.title} starten` : "Prüfung starten"}
                        </button>
                    )
                }
            >
                <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {stats.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="rounded-2xl bg-white/[0.07] px-3.5 py-2.5 ring-1 ring-white/10">
                            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-[#b9c7d6]">
                                <Icon className="size-3.5 text-[#f2b544]" aria-hidden /> {label}
                            </dt>
                            <dd className="text-lg font-semibold tabular-nums text-white">{value}</dd>
                        </div>
                    ))}
                </dl>
                {running && profile.activeAttemptPaused && (
                    <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#f2b544] px-3 py-1.5 text-xs font-bold text-[#16324f]">
                        <Pause className="size-3.5" aria-hidden /> Pausiert – die Zeit steht
                    </p>
                )}
            </LearningPageHero>

            {profile.blockedReason && profile.blockedReason !== "ACTIVE_ATTEMPT" && (
                <p role="alert" className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{BLOCKED_REASON[profile.blockedReason]}</span>
                </p>
            )}

            <ExamJourney profile={profile} />

            <section aria-label="Bewertung" className="grid gap-3 md:grid-cols-3">
                {[
                    { icon: ClipboardCheck, tone: "bg-brand-slate/15 text-brand-slate", title: "Schriftlich", text: `${formatPoints(profile.writtenMaxPoints)} Punkte, bestanden ab ${formatPoints(profile.writtenPassThreshold)}. Der Schriftliche Ausdruck wird von Hand bewertet – bis dahin steht das Ergebnis aus.` },
                    { icon: Mic, tone: "bg-exam-muendlich/15 text-exam-muendlich", title: "Mündlich", text: profile.oralScoringEnabled ? `${formatPoints(profile.oralMaxPoints)} Punkte, bestanden ab ${formatPoints(profile.oralPassThreshold)}.` : "In dieser Simulation übst du nur – es gibt keine Punkte und kein Bestehen." },
                    { icon: Trophy, tone: "bg-brand-amber/20 text-amber-800 dark:text-brand-amber", title: "Gesamtergebnis", text: "„Bestanden“ erscheint erst, wenn alle verlangten Teile bewertet sind. Jede Prüfung kannst du einmal machen." },
                ].map(({ icon: Icon, tone, title, text }) => (
                    <div key={title} className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                        <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" aria-hidden /></span>
                        <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/70">{text}</p>
                    </div>
                ))}
            </section>

            <ExamSetList profile={profile} starting={start.isPending} onStart={setStartSetId} />

            {startSetId && (
                <StartDialog
                    totalMinutes={profile.totalMinutes}
                    starting={start.isPending}
                    onCancel={() => setStartSetId(null)}
                    onStart={() => {
                        // Must happen inside the click: browsers only allow fullscreen after a user gesture.
                        enterFullscreen();
                        start.mutate(startSetId);
                    }}
                />
            )}
            <ConfirmDialog
                isOpen={confirmCancel}
                title="Prüfung abbrechen?"
                message="Die Prüfung wird beendet und nicht gewertet. Diese Prüfung kannst du danach nicht noch einmal starten."
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

    if (profiles.isLoading) return <Loading />;
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
