"use client";

import { Pause, Send } from "lucide-react";

interface Props {
    busy: boolean;
    onPause: () => void;
    onFinish: () => void;
    onCancel: () => void;
}

/** What "Verlassen" means: take a break (the clock stops, continue later) or end the exam now and see the result. */
export default function SimExitDialog({ busy, onPause, onFinish, onCancel }: Readonly<Props>) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="sim-exit-title">
            <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 shadow-lg">
                <h2 id="sim-exit-title" className="text-lg font-bold text-foreground">
                    Prüfung verlassen
                </h2>
                <p className="mt-1 text-sm text-foreground/70">Was möchtest du tun?</p>

                <div className="mt-5 grid gap-3">
                    <button type="button" disabled={busy} onClick={onPause} className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-border bg-background p-4 text-start transition hover:border-primary/60 hover:bg-accent disabled:opacity-50">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Pause className="size-5" aria-hidden />
                        </span>
                        <span>
                            <span className="block font-bold text-foreground">Pause machen</span>
                            <span className="mt-0.5 block text-sm text-foreground/70">
                                Die Zeit wird angehalten und deine Antworten sind gespeichert. Du machst später genau dort weiter, wo du aufgehört hast.
                            </span>
                        </span>
                    </button>
                    <button type="button" disabled={busy} onClick={onFinish} className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-border bg-background p-4 text-start transition hover:border-red-500/60 hover:bg-red-500/5 disabled:opacity-50">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                            <Send className="size-5" aria-hidden />
                        </span>
                        <span>
                            <span className="block font-bold text-foreground">Prüfung beenden</span>
                            <span className="mt-0.5 block text-sm text-foreground/70">
                                Die Prüfung wird abgegeben und ausgewertet. Danach kannst du nichts mehr ändern. Offene Fragen zählen 0 Punkte.
                            </span>
                        </span>
                    </button>
                </div>

                <div className="mt-5 flex justify-end">
                    <button type="button" disabled={busy} onClick={onCancel} className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50">
                        Zurück zur Prüfung
                    </button>
                </div>
            </div>
        </div>
    );
}
