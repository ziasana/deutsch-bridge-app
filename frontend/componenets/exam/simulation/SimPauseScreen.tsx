"use client";

import { Pause, Play, Send } from "lucide-react";
import { formatClock } from "@/lib/examTime";

interface Props {
    stageLabel: string;
    remainingSeconds: number;
    busy: boolean;
    onContinue: () => void;
    onFinish: () => void;
    onLeave: () => void;
}

/** Shown instead of the tasks while the exam is paused: the clock is stopped and nothing of the exam is visible. */
export default function SimPauseScreen({ stageLabel, remainingSeconds, busy, onContinue, onFinish, onLeave }: Readonly<Props>) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card text-center shadow-card ring-1 ring-border/60">
                <div className="relative overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-6 py-8 text-white">
                    <span aria-hidden className="absolute -end-8 -top-10 size-36 rounded-full bg-white/10" />
                    <span className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/20">
                        <Pause className="size-7" aria-hidden />
                    </span>
                    <h1 className="relative mt-3 text-xl font-bold">Prüfung pausiert</h1>
                    <p className="relative mt-1 text-sm text-white/90">Die Zeit steht. Deine Antworten sind gespeichert.</p>
                </div>
                <div className="space-y-5 p-6">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">{stageLabel}</p>
                        <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-foreground" role="timer" aria-label={`Verbleibende Zeit ${formatClock(remainingSeconds)}`}>
                            {formatClock(remainingSeconds)}
                        </p>
                        <p className="text-xs text-foreground/60">verbleibende Zeit</p>
                    </div>
                    <div className="grid gap-2.5">
                        <button type="button" disabled={busy} onClick={onContinue} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50">
                            <Play className="size-4" aria-hidden /> Prüfung fortsetzen
                        </button>
                        <button type="button" disabled={busy} onClick={onFinish} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50">
                            <Send className="size-4" aria-hidden /> Prüfung beenden
                        </button>
                        <button type="button" disabled={busy} onClick={onLeave} className="text-sm font-medium text-foreground/60 transition hover:text-foreground disabled:opacity-50">
                            Zur Übersicht
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
