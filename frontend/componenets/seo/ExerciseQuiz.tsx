"use client";

import AuthAwareLink from "@/componenets/AuthAwareLink";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import type { SampleQuestion } from "@/lib/sampleExercises";

/** Interactive public sample: pick answers, check, see solutions with explanations. No account, nothing is stored. */
export default function ExerciseQuiz({ questions, more }: Readonly<{ questions: SampleQuestion[]; more: { href: string; label: string } }>) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const score = questions.filter((q, i) => picked[i] === q.answer).length;

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <fieldset key={q.prompt} className="rounded-2xl border border-border bg-card p-5">
          <legend className="px-1 font-semibold text-foreground" lang="de">{i + 1}. {q.prompt}</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {q.options.map((opt, o) => {
              const active = picked[i] === o;
              const right = checked && o === q.answer;
              const wrong = checked && active && o !== q.answer;
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={active}
                  disabled={checked}
                  lang="de"
                  onClick={() => setPicked((p) => p.map((v, k) => (k === i ? o : v)))}
                  className={`rounded-xl border px-4 py-2 font-medium transition disabled:cursor-default ${
                    right ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : wrong ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    : active ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {checked && (
            <p lang="de" className="mt-3 flex items-start gap-2 text-sm text-foreground/75">
              {picked[i] === q.answer ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />}
              <span>{q.explanation}</span>
            </p>
          )}
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        {checked ? (
          <button type="button" className="btn-outline rounded-xl px-5 py-2.5" onClick={() => { setPicked(questions.map(() => null)); setChecked(false); }}>
            Nochmal versuchen
          </button>
        ) : (
          <button type="button" className="btn-primary rounded-xl px-5 py-2.5 disabled:opacity-50" disabled={picked.some((p) => p === null)} onClick={() => setChecked(true)}>
            Lösungen anzeigen
          </button>
        )}
        {checked && <p role="status" className="font-semibold text-foreground">{score} von {questions.length} richtig</p>}
      </div>

      {checked && (
        <div className="rounded-2xl bg-accent/50 p-5">
          <p className="font-semibold text-foreground">Weiterüben mit DeutschCertify</p>
          <div className="mt-3 flex flex-wrap gap-4">
            <Link href={more.href} className="font-semibold text-primary hover:underline">{more.label}</Link>
            <AuthAwareLink href="/signup" className="font-semibold text-primary hover:underline">Kostenloses Konto erstellen</AuthAwareLink>
          </div>
        </div>
      )}
    </div>
  );
}
