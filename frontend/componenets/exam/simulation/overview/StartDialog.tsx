"use client";

import { useState } from "react";
import { Check, Headphones, Maximize2, Play, ShieldAlert, Timer, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    totalMinutes: number;
    starting: boolean;
    onStart: () => void;
    onCancel: () => void;
}

/** A short pre-flight checklist before the clock starts. It never blocks: it only makes the learner think about the conditions. */
export default function StartDialog({ totalMinutes, starting, onStart, onCancel }: Readonly<Props>) {
    const items = [
        { icon: Timer, text: `Ich habe etwa ${totalMinutes} Minuten ungestört Zeit.` },
        { icon: Headphones, text: "Kopfhörer oder Lautsprecher funktionieren, der Ton ist an." },
        { icon: Volume2, text: "Ich bin an einem ruhigen Ort, das Handy ist weg." },
        { icon: ShieldAlert, text: "Ich weiß: Ist ein Abschnitt beendet, gibt es kein Zurück." },
    ];
    const [checked, setChecked] = useState<boolean[]>(items.map(() => false));
    const ready = checked.filter(Boolean).length;
    const toggle = (i: number) => setChecked((c) => c.map((v, j) => (j === i ? !v : v)));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="sim-start-title">
            <div className="anim-pop w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-lg ring-1 ring-border/60">
                <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 px-6 py-5 text-primary-foreground">
                    <span aria-hidden className="absolute -end-6 -top-8 size-28 rounded-full bg-white/10" />
                    <h2 id="sim-start-title" className="relative text-lg font-bold">Bereit für die Prüfung?</h2>
                    <p className="relative mt-0.5 text-sm text-primary-foreground/85">Die Prüfung öffnet sich im Vollbild, damit du dich nur auf die Aufgaben konzentrierst.</p>
                </div>
                <div className="p-5">
                    <ul className="space-y-2 p-0">
                        {items.map(({ icon: Icon, text }, i) => (
                            <li key={text} className="list-none">
                                <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={checked[i]}
                                    onClick={() => toggle(i)}
                                    className={cn("flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-sm transition", checked[i] ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground/80 hover:bg-accent")}
                                >
                                    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition", checked[i] ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25")}>
                                        {checked[i] && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                                    </span>
                                    <Icon className="size-4 shrink-0 text-foreground/50" aria-hidden />
                                    <span>{text}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-label="Vorbereitung" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={ready}>
                            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(ready / items.length) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums text-foreground/60">{ready}/{items.length}</span>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground/60">
                        <Maximize2 className="size-3.5" aria-hidden /> Mit „Verlassen“ kannst du später eine Pause machen – dann steht die Zeit.
                    </p>
                    <div className="mt-5 flex justify-end gap-2.5">
                        <button type="button" onClick={onCancel} disabled={starting} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50">
                            <X className="size-4" aria-hidden /> Noch nicht
                        </button>
                        <button type="button" onClick={onStart} disabled={starting} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50">
                            <Play className="size-4" aria-hidden /> {starting ? "Wird vorbereitet …" : ready === items.length ? "Los geht’s" : "Trotzdem starten"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
