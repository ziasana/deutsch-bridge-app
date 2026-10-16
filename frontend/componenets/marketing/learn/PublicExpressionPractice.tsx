"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, CircleHelp, X } from "lucide-react";
import { isAxiosError } from "axios";
import { answerPublicExpressionProduction, answerPublicExpressionQuestion, answerPublicExpressionTransformation, answerPublicExpressionRecall, getPublicExpressionPractice } from "@/services/publicLearnService";
import type { PublicExpressionPracticeQuestion, PublicProductionResult, PublicQuestionResult, PublicRecallResult, PublicTransformationResult } from "@/types/publicLearn";
import { useMarketing } from "../useMarketing";

const QUESTION_LABELS: Record<string, string> = { CONTEXT: "Kontext", COMPLETION: "Lückentext", TRANSFORMATION: "Umformung" };
const LIMIT_MESSAGE = "Du hast die kostenlosen KI-Prüfungen für diese Stunde verbraucht. Mit einem kostenlosen Konto übst du ohne diese Grenze.";
const ERROR_MESSAGE = "Die Antwort konnte nicht geprüft werden. Bitte versuche es noch einmal.";
const errorText = (e: unknown) => (isAxiosError(e) && e.response?.status === 429 ? LIMIT_MESSAGE : ERROR_MESSAGE);

function Criterion({ ok, children }: Readonly<{ ok: boolean; children: string }>) {
    return (
        <p className="flex items-center gap-2 text-sm">
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-white ${ok ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true">
                {ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
            </span>
            {children}
        </p>
    );
}

/** A sentence the learner writes, checked by the AI teacher: production ("use the expression") or a free-text transformation. */
function Sentence({ id, label, title, prompt, questionId }: Readonly<{ id: string; label: string; title: string; prompt: string; questionId?: string }>) {
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [production, setProduction] = useState<PublicProductionResult | null>(null);
    const [transformation, setTransformation] = useState<PublicTransformationResult | null>(null);
    const done = production !== null || transformation !== null;

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!text.trim() || busy || done) return;
        setBusy(true);
        setError(null);
        try {
            if (questionId) setTransformation((await answerPublicExpressionTransformation(id, questionId, text.trim())).data);
            else setProduction((await answerPublicExpressionProduction(id, text.trim())).data);
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }
    };

    const feedback = production ?? transformation;
    return (
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{title}</p>
            <p lang="de" className="mt-2 whitespace-pre-line text-base font-semibold text-foreground">{prompt}</p>
            <form onSubmit={submit} className="mt-3">
                <label htmlFor={label} className="sr-only">
                    Dein Satz
                </label>
                <textarea
                    id={label}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={done}
                    rows={2}
                    maxLength={300}
                    placeholder="Schreibe deinen Satz …"
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-70"
                />
                {!done && (
                    <button type="submit" disabled={!text.trim() || busy} className="mt-3 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50">
                        {busy ? "Wird geprüft …" : "Prüfen"}
                    </button>
                )}
            </form>
            {error && <p role="alert" className="mt-3 text-sm text-foreground/70">{error}</p>}
            {feedback && (
                <div role="status" className="mt-3 space-y-1.5 rounded-xl bg-foreground/[0.04] px-4 py-3">
                    {production && (
                        <>
                            <Criterion ok={production.usedCorrectly}>Ausdruck richtig verwendet</Criterion>
                            <Criterion ok={production.grammarCorrect}>Grammatik korrekt</Criterion>
                            <Criterion ok={production.natural}>Klingt natürlich</Criterion>
                        </>
                    )}
                    {transformation && (
                        <>
                            <Criterion ok={transformation.usedExpression}>Ausdruck verwendet</Criterion>
                            <Criterion ok={transformation.grammarCorrect}>Grammatik korrekt</Criterion>
                            <Criterion ok={transformation.meaningPreserved}>Bedeutung erhalten</Criterion>
                        </>
                    )}
                    {feedback.feedback && <p lang="de" className="pt-1 text-sm text-foreground/85">{feedback.feedback}</p>}
                    {feedback.c1Suggestion && (
                        <p lang="de" className="text-sm text-foreground/75">
                            <span className="font-semibold">Noch besser (C1): </span>
                            {feedback.c1Suggestion}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

const sectionTitle = "text-sm font-bold uppercase tracking-wide text-primary";

function Recall({ id, maskedSentence }: Readonly<{ id: string; maskedSentence: string | null }>) {
    const [text, setText] = useState("");
    const [result, setResult] = useState<PublicRecallResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!text.trim() || busy || result) return;
        setBusy(true);
        setFailed(false);
        try {
            setResult((await answerPublicExpressionRecall(id, text.trim())).data);
        } catch {
            setFailed(true);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Erinnern</p>
            <p className="mt-2 text-base font-semibold text-foreground">Wie lautet der Ausdruck?</p>
            {maskedSentence && (
                <p lang="de" className="mt-2 rounded-lg bg-accent/50 px-4 py-3 italic text-foreground/90">
                    „{maskedSentence}“
                </p>
            )}
            <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
                <label htmlFor={`recall-${id}`} className="sr-only">
                    Ausdruck
                </label>
                <input
                    id={`recall-${id}`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={result !== null}
                    autoComplete="off"
                    placeholder="Ausdruck eintippen …"
                    className="min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-base text-foreground outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-70"
                />
                {result === null && (
                    <button type="submit" disabled={!text.trim() || busy} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50">
                        Prüfen
                    </button>
                )}
            </form>
            {failed && <p role="alert" className="mt-3 text-sm text-foreground/70">Die Antwort konnte nicht geprüft werden. Bitte versuche es noch einmal.</p>}
            {result && (
                <p role="status" className={`mt-3 rounded-xl px-4 py-3 text-sm ${result.correct ? "bg-green-500/10 ring-1 ring-green-500/30" : "bg-amber-500/10 ring-1 ring-amber-500/30"}`}>
                    <span className="font-semibold text-foreground">{result.correct ? "✓ Richtig!" : "✗ Noch einmal üben"}</span>{" "}
                    {!result.correct && (
                        <>
                            <span className="font-semibold">Richtig wäre: </span>
                            <span lang="de">{result.expression}</span>
                        </>
                    )}
                </p>
            )}
        </div>
    );
}

function Question({ id, question }: Readonly<{ id: string; question: PublicExpressionPracticeQuestion }>) {
    const [chosen, setChosen] = useState<string | null>(null);
    const [result, setResult] = useState<PublicQuestionResult | null>(null);
    const [failed, setFailed] = useState(false);

    const pick = async (optionId: string) => {
        if (chosen) return;
        setChosen(optionId);
        setFailed(false);
        try {
            setResult((await answerPublicExpressionQuestion(id, question.id, optionId)).data);
        } catch {
            setChosen(null);
            setFailed(true);
        }
    };

    return (
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{QUESTION_LABELS[question.type] ?? question.type}</p>
            <p lang="de" className="mt-2 whitespace-pre-line text-base font-semibold text-foreground">
                {question.prompt}
            </p>
            <ul className="mt-3 space-y-2" aria-label="Antwortmöglichkeiten">
                {question.options.map((o, i) => {
                    const isRight = result !== null && o.id === result.correctOptionId;
                    const isChosen = chosen === o.id;
                    const state = result === null ? "border-border/60 hover:border-primary/50 hover:bg-primary/5 cursor-pointer" : isRight ? "border-green-500 bg-green-500/10" : isChosen ? "border-amber-500 bg-amber-500/10" : "opacity-60";
                    return (
                        <li key={o.id}>
                            <button type="button" disabled={chosen !== null} onClick={() => void pick(o.id)} className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm text-foreground transition ${state}`}>
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary" aria-hidden="true">
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <span lang="de" className="min-w-0 flex-1 break-words">{o.text}</span>
                                {isRight && <Check className="size-4 shrink-0 text-green-700" aria-label="Richtig" />}
                                {result !== null && !isRight && isChosen && <CircleHelp className="size-4 shrink-0 text-amber-600" aria-label="Deine Antwort" />}
                            </button>
                        </li>
                    );
                })}
            </ul>
            {failed && <p role="alert" className="mt-3 text-sm text-foreground/70">Die Antwort konnte nicht geprüft werden. Bitte versuche es noch einmal.</p>}
            {result && (
                <p role="status" className={`mt-3 rounded-xl px-4 py-3 text-sm ${result.correct ? "bg-green-500/10 ring-1 ring-green-500/30" : "bg-amber-500/10 ring-1 ring-amber-500/30"}`}>
                    <span className="font-semibold text-foreground">{result.correct ? "✓ Richtig!" : "✗ Noch einmal üben"}</span>
                    {result.explanation && <span lang="de"> {result.explanation}</span>}
                </p>
            )}
        </div>
    );
}

/** The practice questions of a free expression: recall, then every multiple-choice question an admin wrote. Graded by the server, nothing saved. */
export default function PublicExpressionPractice({ id }: Readonly<{ id: string }>) {
    const { m } = useMarketing();
    const { data, isPending, isError } = useQuery({
        queryKey: ["public", "learn", "expression", id, "practice"],
        queryFn: () => getPublicExpressionPractice(id).then((res) => res.data),
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    if (isPending) return <p className="px-5 pb-6 text-center text-sm text-foreground/60 sm:px-8">{m.learnPage.loading}</p>;
    if (isError || !data) return null;

    return (
        <section className="space-y-4 border-t border-border/60 bg-foreground/[0.02] px-5 py-6 sm:px-8" aria-label="Übungen">
            <h3 className={sectionTitle}>Üben</h3>
            <Recall id={id} maskedSentence={data.maskedSentence} />
            {data.questions.map((q) =>
                q.format === "FREE_TEXT" ? (
                    <Sentence key={q.id} id={id} label={`q-${q.id}`} title={QUESTION_LABELS[q.type] ?? q.type} prompt={q.prompt} questionId={q.id} />
                ) : (
                    <Question key={q.id} id={id} question={q} />
                ),
            )}
            <Sentence id={id} label={`produce-${id}`} title="Anwenden" prompt={`Schreibe einen eigenen Satz mit: „${data.expression}“`} />
        </section>
    );
}
