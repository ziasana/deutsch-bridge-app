"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { useMarketing } from "./useMarketing";

type Answer = "right" | "wrong";

/** A single try-it question on the home page: lets a visitor feel the exercise format without an account. */
export default function SampleQuestion() {
    const { m } = useMarketing();
    const s = m.home.sample;
    const [picked, setPicked] = useState<Answer | null>(null);
    const [checked, setChecked] = useState(false);
    const isCorrect = picked === "wrong"; // the statement is false: it is the son who is sick

    const reset = () => {
        setPicked(null);
        setChecked(false);
    };

    return (
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
            <p className="text-sm font-semibold text-primary">{s.kind}</p>

            <blockquote lang="de" dir="ltr" className="mt-4 rounded-2xl bg-muted p-5 text-start leading-relaxed text-foreground/90">
                {s.text}
            </blockquote>

            <p lang="de" dir="ltr" className="mt-5 text-start text-lg font-semibold text-foreground">
                {s.statement}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label={s.statement}>
                {(["right", "wrong"] as const).map((value) => {
                    const active = picked === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={checked}
                            onClick={() => setPicked(value)}
                            className={`rounded-xl border px-4 py-3 font-semibold transition ${
                                active ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50"
                            } disabled:cursor-default`}
                        >
                            {value === "right" ? s.right : s.wrong}
                        </button>
                    );
                })}
            </div>

            {checked && picked && (
                <div
                    role="status"
                    className={`mt-5 flex items-start gap-3 rounded-xl p-4 text-sm ${
                        isCorrect ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    }`}
                >
                    {isCorrect ? <CheckCircle2 className="mt-0.5 size-5 shrink-0" /> : <XCircle className="mt-0.5 size-5 shrink-0" />}
                    <div>
                        <p className="font-semibold">{isCorrect ? s.correct : s.incorrect}</p>
                        <p className="mt-1 opacity-90">{s.wrongExplain}</p>
                    </div>
                </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
                {checked ? (
                    <button type="button" onClick={reset} className="btn-outline rounded-xl px-5 py-2.5">
                        {s.retry}
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled={!picked}
                        onClick={() => setChecked(true)}
                        className="btn-primary rounded-xl px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        {s.check}
                    </button>
                )}
                <Link href="/signup" className="text-sm font-semibold text-primary hover:underline">
                    {s.cta}
                </Link>
            </div>
        </div>
    );
}
