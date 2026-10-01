"use client";

import { ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { StepApi } from "../types";
import Feedback from "../Feedback";
import { CORRECT_MESSAGES, haptic, pickMessage } from "../reactions";
import { seededRandom, shuffledDifferent } from "../random";

interface OrderGameProps {
    api: StepApi;
    prompt: ReactNode;
    /** Items in their correct order. */
    items: string[];
    /** "list" = numbered vertical steps; "words" = inline wrapped words forming a sentence. */
    variant: "list" | "words";
    seed: string;
    explanation?: string | null;
}

const MAX_TRIES_BEFORE_SOLUTION = 2;

/** Tap items to build the right order. Wrong answers can be retried; after two misses the solution is offered. */
export default function OrderGame({ api, prompt, items, variant, seed, explanation }: OrderGameProps) {
    const pool = useMemo(() => {
        const order = items.map((_, i) => i);
        return shuffledDifferent(order, seededRandom(seed));
    }, [items, seed]);

    const [placed, setPlaced] = useState<number[]>([]);
    const [misses, setMisses] = useState(0);
    const [status, setStatus] = useState<"idle" | "wrong" | "correct" | "revealed">("idle");
    const [shakeKey, setShakeKey] = useState(0);

    const solved = api.solved || status === "correct" || status === "revealed";
    const shownPlaced = api.solved && status === "idle" ? items.map((_, i) => i) : placed;
    const remaining = pool.filter((i) => !shownPlaced.includes(i));

    const wrongAt = new Set<number>(
        status === "wrong" ? shownPlaced.map((idx, pos) => (items[idx] === items[pos] ? -1 : pos)).filter((p) => p >= 0) : [],
    );

    const place = (idx: number) => {
        if (solved) return;
        setStatus("idle");
        setPlaced((p) => [...p, idx]);
    };
    const unplace = (pos: number) => {
        if (solved) return;
        setStatus("idle");
        setPlaced((p) => p.filter((_, i) => i !== pos));
    };

    const check = () => {
        const ok = placed.every((idx, pos) => items[idx] === items[pos]);
        if (ok) {
            setStatus("correct");
            haptic(12);
            api.complete(misses === 0);
        } else {
            setStatus("wrong");
            setMisses((m) => m + 1);
            setShakeKey((k) => k + 1);
            haptic(30);
        }
    };

    const reveal = () => {
        setPlaced(items.map((_, i) => i));
        setStatus("revealed");
        api.complete(false);
    };

    const chipBase = "min-h-11 rounded-xl border-2 px-3 py-2 text-sm font-medium transition cursor-pointer active:scale-[0.98]";
    const slotClass = variant === "list" ? "flex flex-col gap-2" : "flex flex-wrap gap-2";

    return (
        <div className="space-y-4">
            <p className="text-lg font-semibold text-foreground">{prompt}</p>

            <div
                key={shakeKey}
                aria-label="Deine Reihenfolge"
                className={cn("min-h-16 rounded-2xl border-2 border-dashed border-border bg-accent/30 p-3", status === "wrong" && "anim-shake", slotClass)}
            >
                {shownPlaced.length === 0 && <span className="self-center text-sm text-foreground/40">Tippe auf die Karten unten …</span>}
                {shownPlaced.map((idx, pos) => (
                    <button
                        key={`${idx}-${pos}`}
                        type="button"
                        disabled={solved}
                        onClick={() => unplace(pos)}
                        aria-label={`${pos + 1}. ${items[idx]} – tippen zum Entfernen`}
                        className={cn(
                            chipBase,
                            "anim-pop flex items-center gap-2 text-left disabled:cursor-default",
                            solved ? "border-emerald-500 bg-emerald-500/10" : wrongAt.has(pos) ? "border-orange-500 bg-orange-500/10" : "border-primary/40 bg-card",
                        )}
                    >
                        {variant === "list" && (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{pos + 1}</span>
                        )}
                        {items[idx]}
                    </button>
                ))}
            </div>

            {!solved && (
                <>
                    <div className={slotClass} aria-label="Karten">
                        {remaining.map((idx) => (
                            <button key={idx} type="button" onClick={() => place(idx)} className={cn(chipBase, "border-border bg-card text-left hover:border-primary/50 hover:bg-primary/5")}>
                                {items[idx]}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={placed.length !== items.length}
                            onClick={check}
                            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                        >
                            Prüfen
                        </button>
                        {placed.length > 0 && (
                            <button type="button" onClick={() => { setPlaced([]); setStatus("idle"); }} className="rounded-full px-3 py-2 text-sm text-foreground/60 hover:text-foreground cursor-pointer">
                                Zurücksetzen
                            </button>
                        )}
                        {misses >= MAX_TRIES_BEFORE_SOLUTION && (
                            <button type="button" onClick={reveal} className="rounded-full px-3 py-2 text-sm font-medium text-primary hover:underline cursor-pointer">
                                Lösung zeigen
                            </button>
                        )}
                    </div>
                </>
            )}

            {status === "wrong" && <Feedback correct={false} message="Noch nicht ganz – die orange markierten Karten stehen an der falschen Stelle." />}
            {status === "correct" && <Feedback correct message={pickMessage(CORRECT_MESSAGES, items.length)} explanation={explanation} />}
            {status === "revealed" && <Feedback correct={false} message="Das ist die richtige Reihenfolge. Beim nächsten Mal klappt es!" explanation={explanation} />}
        </div>
    );
}
