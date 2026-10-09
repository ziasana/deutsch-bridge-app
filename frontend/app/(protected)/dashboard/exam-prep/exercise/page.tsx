"use client";

import { WritingExercise } from "@/componenets/exam/writing";
import { SpeakingExercise } from "@/componenets/exam/speaking";
import SpeakingTopHeader from "@/componenets/exam/speaking/SpeakingTopHeader";
import ExerciseTopHeader from "@/componenets/exam/ExerciseTopHeader";
import { SECTION_THEME, lessonThemeVars } from "@/componenets/exam/lessonTheme";
import { useSpeakingGuides } from "@/hooks/exam/useSpeakingGuides";
import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getExamExerciseById } from "@/services/examService";
import {
    completeExamAttempt,
    markExerciseCompleted,
    startExamAttempt,
    submitExamAnswer,
} from "@/services/examAttemptService";
import {
    ExamAnswerFeedbackResponse,
    ExamExercisePublicResponse,
    ExamPassagePublic,
    ExamQuestionPublic,
    ExamTranscript, ExamSection } from "@/types/exam";
import Loading from "@/componenets/Loading";
import AudioPlayer from "@/componenets/AudioPlayer";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import SprachbausteineClozeBoard, { hasGapText } from "@/componenets/exam/SprachbausteineClozeBoard";
import HoerenBoard from "@/componenets/exam/HoerenBoard";
import LesenTextPanel from "@/componenets/exam/LesenTextPanel";
import LesenTeil1Board from "@/componenets/exam/LesenTeil1Board";
import LesenTeil3Board, { NO_AD_ANSWER as NO_AD_ANSWER_VALUE } from "@/componenets/exam/LesenTeil3Board";
import TranscriptModal from "@/componenets/exam/TranscriptModal";
import TranscriptContent from "@/componenets/exam/TranscriptContent";
import { isEmptyTranscript } from "@/lib/transcriptFormat";
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, BookmarkCheck, Check, ChevronDown, FileText, Headphones, PenLine, Play, Puzzle, type LucideIcon, RotateCw, X } from "lucide-react";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { EXAM_TYPE_META } from "@/componenets/exam";
import { cn } from "@/lib/utils";
import { useExamBookmark } from "@/hooks/exam/useExamBookmark";
import ExamExerciseTimer, { useStopExerciseTimer } from "@/componenets/exam/ExamExerciseTimer";
import useExamTimerStore from "@/store/useExamTimerStore";
import ExamTimeSummary from "@/componenets/exam/ExamTimeSummary";
import { showZeitCheckToast } from "@/lib/examTimeToast";
import { ExamPracticeSessionResult } from "@/types/examTime";

const pillPrimary =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-50";

const TFN_OPTIONS = [
    { value: "RICHTIG", label: "Richtig" },
    { value: "FALSCH", label: "Falsch" },
    { value: "NICHT_IM_TEXT", label: "Nicht im Text" },
];

/** SITUATION_MATCHING's correctAnswer for "no ad fits" (the "x" on the answer sheet). */
const NO_AD_ANSWER = NO_AD_ANSWER_VALUE;

/** SITUATION_MATCHING answers are passage ids; show the ad's label ("e") instead of the raw id. */
const answerLabelFor = (passages: ExamPassagePublic[], value: string) =>
    value === NO_AD_ANSWER ? "x (keine Anzeige)" : (passages.find((p) => p.id === value)?.label ?? value);

const letterFor = (index: number) => String.fromCharCode(97 + index);
/** Admin-edited label for an answer option, falling back to its positional letter. */
const optionLabelFor = (labels: string[] | null | undefined, index: number) => labels?.[index]?.trim() || letterFor(index);

function AnswerOptionsPoolView({
    answerOptions,
    answerOptionLabels,
    taskType,
}: Readonly<{ answerOptions: string[]; answerOptionLabels: string[]; taskType: string }>) {
    if (answerOptions.length === 0) return null;
    return (
        <div className="rounded-[10px] bg-card p-6 shadow-card sm:p-8">
            <p className="text-sm text-foreground/60 mb-3">
                {taskType === "WORD_BANK_CLOZE"
                    ? "Wörter — nicht jedes passt in eine Lücke:"
                    : "Überschriften — nicht jede passt zu einem Text:"}
            </p>
            <ul
                className={
                    taskType === "WORD_BANK_CLOZE"
                        ? // Short words: four per row, filled left to right (a b c d / e f g h ...).
                          "grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2"
                        : "space-y-2"
                }
            >
                {answerOptions.map((option, idx) => (
                    <li key={option} className="text-sm text-foreground/90">
                        <span className="font-semibold">{optionLabelFor(answerOptionLabels, idx)})</span> {option}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Sections that use the combined exercise header, with their icon and long name. */
const SECTION_HEADER: Partial<Record<ExamSection, { icon: LucideIcon; label: string }>> = {
    LESEVERSTEHEN: { icon: BookOpen, label: "Leseverstehen" },
    SPRACHBAUSTEINE: { icon: Puzzle, label: "Sprachbausteine" },
    HOERVERSTEHEN: { icon: Headphones, label: "Hörverstehen" },
};

function PassageBody({ passage }: Readonly<{ passage: ExamPassagePublic }>) {
    const audioSrc = resolveUploadUrl(passage.audioUrl);
    return (
        <>
            {audioSrc && <AudioPlayer key={audioSrc} src={audioSrc} />}
            {passage.imageUrl && (
                <img src={resolveUploadUrl(passage.imageUrl) ?? undefined} alt="" className="max-w-full rounded-lg mb-2" />
            )}
            {passage.content && (
                <LessonMarkdown content={passage.content} className="text-sm text-foreground/80" />
            )}
        </>
    );
}

function PassagesView({ passages, taskType }: Readonly<{ passages: ExamPassagePublic[]; taskType: string }>) {
    if (passages.length === 0) return null;

    if (taskType === "MULTIPLE_CHOICE" || taskType === "WORD_BANK_CLOZE") {
        return (
            <div className="rounded-[10px] bg-card p-6 shadow-card sm:p-8 space-y-2">
                {passages.map((p) => (
                    <PassageBody key={p.id} passage={p} />
                ))}
            </div>
        );
    }

    return (
        <div className={`grid gap-4 sm:grid-cols-2 ${taskType === "SITUATION_MATCHING" ? "lg:grid-cols-3" : ""}`}>
            {passages.map((p) => (
                <div key={p.id} className="rounded-[10px] bg-card p-5 shadow-card">
                    <p className="font-semibold text-foreground mb-1">{p.label}</p>
                    <PassageBody passage={p} />
                </div>
            ))}
        </div>
    );
}

interface ResultItem {
    question: ExamQuestionPublic;
    feedback: ExamAnswerFeedbackResponse;
    /** What the learner answered (empty when left open). */
    answer?: string;
}

interface ResultsState {
    score: number;
    items: ResultItem[];
    transcripts: ExamTranscript[];
}

/** Headline, emoji and tone for a score. */
function verdictFor(score: number) {
    if (score >= 90) return { emoji: "🏆", title: "Ausgezeichnet!", text: "Das war fast perfekt." };
    if (score >= 70) return { emoji: "🎉", title: "Sehr gut!", text: "Du bist auf einem guten Weg." };
    if (score >= 50) return { emoji: "👍", title: "Gut gemacht!", text: "Schau dir die Fehler an, dann klappt es noch besser." };
    return { emoji: "💪", title: "Weiter üben!", text: "Aus Fehlern lernt man – lies die Erklärungen und versuche es noch einmal." };
}

function ResultCard({
    index,
    item,
    hideTranscript,
    formatAnswer,
}: Readonly<{ index: number; item: ResultItem; hideTranscript?: boolean; formatAnswer?: (value: string) => string }>) {
    const { question, feedback, answer } = item;
    const format = (value: string) => (formatAnswer ? formatAnswer(value) : value);
    const number = question.questionNumber ?? index + 1;
    const ok = feedback.correct;
    const hasDetails = Boolean(feedback.explanation || feedback.commonMistake || (!isEmptyTranscript(feedback.transcript) && !hideTranscript));

    return (
        <details
            id={`result-${question.id}`}
            open={!ok}
            className={cn("group scroll-mt-24 overflow-hidden rounded-2xl border-s-4 bg-card shadow-card", ok ? "border-green-500" : "border-red-500")}
        >
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-white", ok ? "bg-green-500" : "bg-red-500")} aria-hidden="true">
                    {ok ? <Check className="size-5" strokeWidth={3} /> : <X className="size-5" strokeWidth={3} />}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                        Aufgabe {number} · {ok ? "Richtig" : "Falsch"}
                    </p>
                    <p className="font-medium leading-snug text-foreground">{question.prompt}</p>
                </div>
                {hasDetails && <ChevronDown className="size-5 shrink-0 text-foreground/40 transition group-open:rotate-180" aria-hidden="true" />}
            </summary>

            <div className="space-y-3 px-4 pb-4 text-sm">
                <div className="flex flex-wrap gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium", ok ? "bg-green-500/10 text-green-800 dark:text-green-300" : "bg-red-500/10 text-red-800 dark:text-red-300")}>
                        Deine Antwort: <strong>{answer ? format(answer) : "—"}</strong>
                    </span>
                    {!ok && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 font-medium text-green-800 dark:text-green-300">
                            Richtig: <strong>{format(feedback.correctAnswer)}</strong>
                        </span>
                    )}
                </div>
                {feedback.explanation && (
                    <p dir="auto" className="rounded-xl bg-primary/[0.07] p-3 text-foreground/85">
                        💡 {feedback.explanation}
                    </p>
                )}
                {feedback.commonMistake && (
                    <p className="rounded-xl bg-amber-500/10 p-3 italic text-foreground/80">⚠️ Häufiger Fehler: {feedback.commonMistake}</p>
                )}
                {!isEmptyTranscript(feedback.transcript) && !hideTranscript && (
                    <div className="border-t border-border/60 pt-2">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide">Transkript</p>
                        <TranscriptContent transcript={feedback.transcript ?? ""} variant="compact" />
                    </div>
                )}
            </div>
        </details>
    );
}

/** The score as a ring on the gradient hero. */
function ScoreRing({ value, size = 112 }: Readonly<{ value: number; size?: number }>) {
    const radius = size / 2 - 8;
    const circumference = 2 * Math.PI * radius;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(value)} Prozent`}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth={8} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="white"
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference}
                    className="transition-all duration-1000"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold tabular-nums text-white">{Math.round(value)}%</span>
        </div>
    );
}

function ResultsView({
    results,
    defaultExplanation,
    defaultCommonMistake,
    completed,
    markingCompleted,
    onPracticeAgain,
    onMarkCompleted,
    formatAnswer,
}: Readonly<{
    formatAnswer?: (value: string) => string;
    results: ResultsState;
    defaultExplanation?: string | null;
    defaultCommonMistake?: string | null;
    completed: boolean;
    markingCompleted: boolean;
    onPracticeAgain: () => void;
    onMarkCompleted: () => void;
}>) {
    const correctCount = results.items.filter((item) => item.feedback.correct).length;
    const wrongCount = results.items.length - correctCount;
    const verdict = verdictFor(results.score);
    const [transcriptOpen, setTranscriptOpen] = useState(false);
    const [onlyWrong, setOnlyWrong] = useState(false);
    const stopExerciseTimer = useStopExerciseTimer();
    const [timeResult, setTimeResult] = useState<ExamPracticeSessionResult | null>(null);

    // Finishing the attempt counts as completing the exercise, regardless of score.
    useEffect(() => {
        if (!completed && !markingCompleted) {
            onMarkCompleted();
        }
        // The timer stops by itself; its Zeit-Check appears in the corner of this card.
        stopExerciseTimer().then(setTimeResult);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const jumpTo = (id: string) => {
        const el = document.getElementById(`result-${id}`) as HTMLDetailsElement | null;
        if (!el) return;
        el.open = true;
        el.scrollIntoView?.({ block: "center", behavior: "smooth" });
    };
    const shown = results.items.map((item, idx) => ({ item, idx })).filter(({ item }) => !onlyWrong || !item.feedback.correct);

    return (
        <div className="space-y-4">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) p-5 text-white shadow-md sm:p-7">
                <span aria-hidden="true" className="absolute -end-10 -top-12 size-48 rounded-full bg-white/10" />
                <span aria-hidden="true" className="absolute -bottom-16 start-1/3 size-40 rounded-full bg-white/5" />
                <p className="relative text-xs font-bold uppercase tracking-wider text-white/80">Ergebnis</p>
                <div className="relative mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-5">
                        <ScoreRing value={results.score} />
                        <div className="min-w-0">
                            <p className="anim-pop text-2xl font-extrabold leading-tight sm:text-3xl">
                                {verdict.emoji} {verdict.title}
                            </p>
                            <p className="mt-1 text-sm text-white/90">{verdict.text}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                                    <Check className="size-4" strokeWidth={3} aria-hidden="true" /> {correctCount} richtig
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                                    <X className="size-4" strokeWidth={3} aria-hidden="true" /> {wrongCount} falsch
                                </span>
                                <span className="sr-only">
                                    {correctCount} von {results.items.length} Aufgaben richtig
                                </span>
                            </div>
                        </div>
                    </div>
                    {timeResult && <ExamTimeSummary result={timeResult} className="sm:min-w-52 sm:shrink-0" />}
                </div>
            </section>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-card ring-1 ring-border/60">
                <nav aria-label="Aufgaben" className="flex flex-wrap items-center gap-1.5">
                    {results.items.map((item, idx) => (
                        <button
                            key={item.question.id}
                            type="button"
                            onClick={() => jumpTo(item.question.id)}
                            aria-label={`Aufgabe ${item.question.questionNumber ?? idx + 1}: ${item.feedback.correct ? "richtig" : "falsch"}`}
                            className={cn(
                                "flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-extrabold text-white transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                item.feedback.correct ? "bg-green-500" : "bg-red-500",
                            )}
                        >
                            {item.question.questionNumber ?? idx + 1}
                        </button>
                    ))}
                </nav>
                <div className="ms-auto flex flex-wrap items-center gap-2">
                    {wrongCount > 0 && (
                        <button
                            type="button"
                            aria-pressed={onlyWrong}
                            onClick={() => setOnlyWrong((v) => !v)}
                            className={cn(
                                "cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                onlyWrong ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300" : "border-border bg-background text-foreground/70 hover:bg-accent",
                            )}
                        >
                            {onlyWrong ? "Alle anzeigen" : "Nur Fehler anzeigen"}
                        </button>
                    )}
                    {results.transcripts.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setTranscriptOpen(true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-accent"
                        >
                            <FileText className="size-3.5" aria-hidden="true" />
                            Transkript anzeigen
                        </button>
                    )}
                </div>
                <TranscriptModal open={transcriptOpen} onClose={() => setTranscriptOpen(false)} transcripts={results.transcripts} />
            </div>

            {(defaultExplanation || defaultCommonMistake) && (
                <div className="space-y-1 rounded-2xl bg-primary/[0.07] p-4 text-sm text-foreground/85">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Tipp</p>
                    {defaultExplanation && <p>💡 {defaultExplanation}</p>}
                    {defaultCommonMistake && <p className="italic">⚠️ Häufiger Fehler: {defaultCommonMistake}</p>}
                </div>
            )}

            <div className="space-y-3">
                {shown.map(({ item, idx }) => (
                    // The transcript link above covers every transcript; don't repeat it under each question.
                    <ResultCard key={item.question.id} index={idx} item={item} hideTranscript={results.transcripts.length > 0} formatAnswer={formatAnswer} />
                ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                    type="button"
                    className={pillPrimary}
                    onClick={() => {
                        onPracticeAgain();
                        useExamTimerStore.getState().requestRestart();
                    }}
                >
                    <RotateCw className="size-4" aria-hidden="true" />
                    Erneut üben
                </button>
            </div>
        </div>
    );
}

/**
 * Schriftlicher Ausdruck: the writing prompt (as a passage) followed by the plan/write/submit flow.
 * Submitting marks the exercise done; the admin-authored model solution is revealed afterwards.
 */
function SchriftlicherAusdruckView({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const { completed, markCompleted } = useExerciseCompletion(exercise);
    const stopExerciseTimer = useStopExerciseTimer();

    return (
        <div className="space-y-4">
            <div className="rounded-[10px] bg-card p-6 shadow-card sm:p-8 space-y-2">
                {exercise.passages.map((p) => (
                    <PassageBody key={p.id} passage={p} />
                ))}
            </div>

            <WritingExercise
                exerciseId={exercise.id}
                level={exercise.level}
                requiresPlanning={exercise.requiresPlanning}
                leitpunkte={exercise.leitpunkte ?? []}
                modelSolution={exercise.modelSolution}
                onSubmitted={() => {
                    if (!completed) markCompleted();
                    stopExerciseTimer().then((result) => result && showZeitCheckToast(result));
                }}
            />
        </div>
    );
}

function MuendlicherAusdruckView({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);
    const level = exercise.level ?? "B1";
    const { guideFor, isLoading: guideLoading } = useSpeakingGuides(level);
    const stopExerciseTimer = useStopExerciseTimer();
    const [timeResult, setTimeResult] = useState<ExamPracticeSessionResult | null>(null);

    if (!exercise.speaking) {
        return <div className="rounded-[10px] bg-card p-6 shadow-card text-sm text-foreground/60">Diese Übung hat noch keinen Inhalt.</div>;
    }
    return (
        <SpeakingExercise
            exerciseId={exercise.id}
            content={exercise.speaking}
            guide={guideFor(exercise.teil ?? 1)?.content}
            guideLoading={guideLoading}
            level={level}
            completed={completed}
            marking={marking}
            onMarkCompleted={markCompleted}
            timeResult={timeResult}
            onFinish={() =>
                stopExerciseTimer().then((result) => {
                    if (!result) return;
                    setTimeResult(result);
                    showZeitCheckToast(result);
                })
            }
            onRepeat={() => {
                setTimeResult(null);
                useExamTimerStore.getState().requestRestart();
            }}
        />
    );
}

function TestformatInformationView({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);

    return (
        <div className="space-y-4">
            <div className="rounded-[10px] bg-card p-6 shadow-card sm:p-8 space-y-2">
                {exercise.passages.map((p) => (
                    <PassageBody key={p.id} passage={p} />
                ))}
            </div>

            <div className="flex justify-end">
                <button type="button" className={pillPrimary} disabled={completed || marking} onClick={markCompleted}>
                    {completed ? "Als erledigt markiert ✓" : marking ? "Wird markiert..." : "Als erledigt markieren"}
                </button>
            </div>
        </div>
    );
}

function StartCard({ starting, onStart }: Readonly<{ starting: boolean; onStart: () => void }>) {
    return (
        <div className="rounded-[10px] bg-card p-6 shadow-card sm:p-8 space-y-3">
            <p className="text-sm text-foreground/65">
                Bereit? Starte die Übung und bearbeite die Aufgaben der Reihe nach.
            </p>
            <button type="button" className={pillPrimary} disabled={starting} onClick={onStart}>
                <Play className="size-4 fill-current" aria-hidden="true" />
                {starting ? "Wird geladen..." : "Übung starten"}
            </button>
        </div>
    );
}

/** Dropdown of answer choices - MC/TFN use the question's own options, MATCHING/WORD_BANK_CLOZE share one pool. */
function QuestionSelect({
    question,
    answerOptions,
    answerOptionLabels,
    taskType,
    value,
    disabled,
    choices,
    onChange,
}: Readonly<{
    question: ExamQuestionPublic;
    answerOptions: string[];
    answerOptionLabels: string[];
    taskType: string;
    value: string;
    disabled: boolean;
    /** Overrides the options derived from taskType (used by SITUATION_MATCHING, whose choices are the ads). */
    choices?: { value: string; label: string; disabled?: boolean }[];
    onChange: (value: string) => void;
}>) {
    const options: { value: string; label: string; disabled?: boolean }[] =
        choices ?? (taskType === "TRUE_FALSE_NOT_GIVEN"
            ? TFN_OPTIONS
            : taskType === "MATCHING" || taskType === "WORD_BANK_CLOZE"
                ? answerOptions.map((o, idx) => ({ value: o, label: `${optionLabelFor(answerOptionLabels, idx)}) ${o}` }))
                : (question.options ?? []).map((o) => ({ value: o, label: o })));

    return (
        <select
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
        >
            <option value="">Antwort wählen...</option>
            {options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

/** Leseverstehen Teil 2: one text (with a marker) and the multiple-choice questions below it. */
const isLesenMultipleChoice = (exercise: ExamExercisePublicResponse) =>
    exercise.section === "LESEVERSTEHEN" && exercise.taskType === "MULTIPLE_CHOICE";

/** Sprachbausteine Teil 1 (multiple choice per gap) and Teil 2 (shared word bank): a text with numbered gap badges. */
const isSprachbausteineGapText = (exercise: ExamExercisePublicResponse) =>
    exercise.section === "SPRACHBAUSTEINE" &&
    (exercise.taskType === "MULTIPLE_CHOICE" || exercise.taskType === "WORD_BANK_CLOZE") &&
    exercise.passages.some((p) => p.content?.includes("data-exam-gap"));

/** Shared "mark as completed" state/handler for both quiz flows. */
function useExerciseCompletion(exercise: ExamExercisePublicResponse) {
    const [completed, setCompleted] = useState(exercise.completed);
    const [marking, setMarking] = useState(false);

    const markCompleted = () => {
        setMarking(true);
        markExerciseCompleted(exercise.id)
            .then(() => setCompleted(true))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Konnte nicht als erledigt markiert werden."))
            .finally(() => setMarking(false));
    };

    return { completed, marking, markCompleted };
}

interface GridQuizState {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[];
    answerOptionLabels: string[];
    answers: Record<string, string>;
    submitting: boolean;
}

/**
 * Grid quizzes (answered all at once): word-bank cloze (Sprachbausteine Teil 2) and
 * SITUATION_MATCHING (Leseverstehen Teil 3, situations matched to ads). Every gap is shown at once as a card in a grid, each
 * with a dropdown; a single "Antworten abgeben" submits everything together, mirroring how this
 * part is actually taken in the real exam (a running text with 10 gaps answered all at once).
 */
function ClozeGridQuiz({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const [quiz, setQuiz] = useState<GridQuizState | null>(null);
    const isSituationMatching = exercise.taskType === "SITUATION_MATCHING";
    const isHeadingMatching = exercise.taskType === "MATCHING";
    const isGapText = isSprachbausteineGapText(exercise) && (!quiz || hasGapText(quiz.passages, quiz.questions, exercise.taskType === "WORD_BANK_CLOZE"));
    const [results, setResults] = useState<ResultsState | null>(null);
    const [starting, setStarting] = useState(false);
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);

    const beginAttempt = () => {
        setStarting(true);
        startExamAttempt(exercise.id)
            .then((res) => {
                setQuiz({
                    attemptId: res.data.attemptId,
                    passages: res.data.passages,
                    questions: res.data.questions,
                    answerOptions: res.data.answerOptions ?? [],
                    answerOptionLabels: res.data.answerOptionLabels ?? [],
                    answers: {},
                    submitting: false,
                });
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Übung konnte nicht gestartet werden."))
            .finally(() => setStarting(false));
    };

    const practiceAgain = () => {
        setResults(null);
        setQuiz(null);
    };

    const submitAll = async () => {
        if (!quiz) return;
        setQuiz({ ...quiz, submitting: true });
        try {
            const items: ResultItem[] = [];
            for (const question of quiz.questions) {
                const res = await submitExamAnswer(quiz.attemptId, {
                    questionId: question.id,
                    answer: quiz.answers[question.id] ?? "",
                });
                items.push({ question, feedback: res.data, answer: quiz.answers[question.id] ?? "" });
            }
            const completeRes = await completeExamAttempt(quiz.attemptId);
            setResults({ score: completeRes.data.score, items, transcripts: completeRes.data.transcripts ?? [] });
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Übung konnte nicht abgeschlossen werden.");
            setQuiz((prev) => (prev ? { ...prev, submitting: false } : prev));
        }
    };

    if (results) {
        return (
            <ResultsView
                results={results}
                defaultExplanation={exercise.defaultExplanation}
                defaultCommonMistake={exercise.defaultCommonMistake}
                completed={completed}
                markingCompleted={marking}
                onPracticeAgain={practiceAgain}
                onMarkCompleted={markCompleted}
                formatAnswer={isSituationMatching ? (value) => answerLabelFor(exercise.passages, value) : undefined}
            />
        );
    }
    if (!quiz) return <StartCard starting={starting} onStart={beginAttempt} />;
    if (quiz.questions.length === 0) {
        return <p className="text-sm text-foreground/60">Diese Übung enthält noch keine Aufgaben.</p>;
    }

    const allAnswered = quiz.questions.every((q) => quiz.answers[q.id]);

    // Each ad may be used once: disable it in every other situation's dropdown once picked ("x" stays available).
    const choicesFor = (questionId: string) =>
        isSituationMatching
            ? [
                  ...quiz.passages.map((p) => ({
                      value: p.id,
                      label: p.label,
                      disabled: Object.entries(quiz.answers).some(([id, answer]) => id !== questionId && answer === p.id),
                  })),
                  { value: NO_AD_ANSWER, label: "x (keine Anzeige)" },
              ]
            : undefined;

    const setAnswer = (questionId: string, value: string) =>
        setQuiz((prev) => {
            if (!prev) return prev;
            const answers = { ...prev.answers };
            if (value) answers[questionId] = value;
            else delete answers[questionId];
            return { ...prev, answers };
        });

    return (
        <div className={cn("space-y-4", !isHeadingMatching && !isGapText && "rounded-[10px] bg-card p-6 shadow-card sm:p-8")}>
            <p className={cn("text-sm text-foreground/65", (isHeadingMatching || isGapText) && "px-1")}>
                {isGapText
                    ? `Fülle alle ${quiz.questions.length} Lücken im Text und klicke dann auf "Antworten abgeben".`
                    : isHeadingMatching
                    ? `Ordne jedem der ${quiz.questions.length} Texte die passende Überschrift zu und klicke dann auf "Antworten abgeben". Jede Überschrift darf nur einmal benutzt werden.`
                    : `Beantworte alle ${quiz.questions.length} Aufgaben und klicke dann auf "Antworten abgeben".`}
                {isSituationMatching && " Jede Anzeige darf nur einmal benutzt werden. Wenn keine Anzeige passt, wähle x."}
            </p>

            {isSprachbausteineGapText(exercise) && !isGapText && (
                <>
                    <AnswerOptionsPoolView answerOptions={quiz.answerOptions} answerOptionLabels={quiz.answerOptionLabels} taskType={exercise.taskType ?? ""} />
                    <PassagesView passages={quiz.passages} taskType={exercise.taskType ?? ""} />
                </>
            )}

            {isGapText ? (
                <SprachbausteineClozeBoard
                    passages={quiz.passages}
                    questions={quiz.questions}
                    answers={quiz.answers}
                    disabled={quiz.submitting}
                    onAnswer={setAnswer}
                    wordBank={exercise.taskType === "WORD_BANK_CLOZE" ? { options: quiz.answerOptions, labels: quiz.answerOptionLabels } : undefined}
                />
            ) : isHeadingMatching ? (
                <LesenTeil1Board
                    passages={quiz.passages}
                    questions={quiz.questions}
                    answerOptions={quiz.answerOptions}
                    answerOptionLabels={quiz.answerOptionLabels}
                    answers={quiz.answers}
                    disabled={quiz.submitting}
                    onAnswer={setAnswer}
                />
            ) : isSituationMatching ? (
                <LesenTeil3Board
                    passages={quiz.passages}
                    questions={quiz.questions}
                    answers={quiz.answers}
                    disabled={quiz.submitting}
                    onAnswer={setAnswer}
                />
            ) : (
            <div className={`grid gap-3 sm:grid-cols-2 ${isSituationMatching ? "" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
                {quiz.questions.map((question, idx) => {
                    // SITUATION_MATCHING's passages are the answer ads, not a text the question refers to - a leftover
                    // sectionIndex (e.g. from a former Zuordnung question) must not prefix the situation with an ad's label.
                    const referencedPassage =
                        !isSituationMatching && question.sectionIndex != null ? quiz.passages[question.sectionIndex] : null;
                    return (
                        <div key={question.id} className="rounded-2xl border border-border/60 bg-background p-4 space-y-2">
                            <p className="font-medium text-foreground">
                                {question.questionNumber ?? idx + 1}. {referencedPassage && `${referencedPassage.label}: `}
                                {question.prompt}
                            </p>
                            <QuestionSelect
                                question={question}
                                answerOptions={quiz.answerOptions}
                answerOptionLabels={quiz.answerOptionLabels}
                                taskType={exercise.taskType ?? ""}
                                value={quiz.answers[question.id] ?? ""}
                                disabled={quiz.submitting}
                                choices={choicesFor(question.id)}
                                onChange={(value) =>
                                    setQuiz((prev) => (prev ? { ...prev, answers: { ...prev.answers, [question.id]: value } } : prev))
                                }
                            />
                        </div>
                    );
                })}
            </div>
            )}

            <div className="flex justify-end pt-2">
                <button type="button" className={pillPrimary} disabled={!allAnswered || quiz.submitting} onClick={submitAll}>
                    {quiz.submitting ? "Wird geprüft..." : "Antworten abgeben"}
                </button>
            </div>
        </div>
    );
}

function QuestionInput({
    question,
    answerOptions,
    answerOptionLabels,
    taskType,
    selectedAnswer,
    disabled,
    feedback,
    onSelect,
}: Readonly<{
    question: ExamQuestionPublic;
    answerOptions: string[];
    answerOptionLabels: string[];
    taskType: string;
    selectedAnswer: string;
    disabled: boolean;
    /** Once answered: the right option turns green, a wrong pick red. */
    feedback?: ExamAnswerFeedbackResponse | null;
    onSelect: (value: string) => void;
}>) {
    const options =
        taskType === "TRUE_FALSE_NOT_GIVEN"
            ? TFN_OPTIONS
            : taskType === "MATCHING" || taskType === "WORD_BANK_CLOZE"
                ? answerOptions.map((o, idx) => ({ value: o, label: `${optionLabelFor(answerOptionLabels, idx)}) ${o}` }))
                : (question.options ?? []).map((o) => ({ value: o, label: o }));

    return (
        <div className="space-y-2.5">
            {options.map((option, i) => {
                const isSelected = selectedAnswer === option.value;
                const isRight = Boolean(feedback) && option.value === feedback?.correctAnswer;
                const isWrong = Boolean(feedback) && isSelected && !isRight;
                return (
                    <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(option.value)}
                        className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm text-foreground transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default",
                            isRight
                                ? "anim-pop border-green-500 bg-green-500/10"
                                : isWrong
                                    ? "anim-shake border-red-500 bg-red-500/10"
                                    : isSelected
                                        ? "border-primary bg-primary/10"
                                        : "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/50 hover:shadow-card disabled:opacity-60 disabled:hover:translate-y-0",
                        )}
                    >
                        <span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", isRight ? "bg-green-500 text-white" : isWrong ? "bg-red-500 text-white" : isSelected ? "bg-primary text-primary-foreground" : "bg-accent text-primary")}>
                            {isRight ? <Check className="size-4" strokeWidth={3} /> : isWrong ? <X className="size-4" strokeWidth={3} /> : String.fromCharCode(65 + i)}
                        </span>
                        <span className="min-w-0 flex-1 break-words">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function FeedbackCard({ feedback }: Readonly<{ feedback: ExamAnswerFeedbackResponse }>) {
    return (
        <div
            className={`rounded-2xl p-4 text-sm space-y-1 ${
                feedback.correct
                    ? "bg-green-500/10 text-green-800 dark:text-green-300"
                    : "bg-red-500/10 text-red-800 dark:text-red-300"
            }`}
        >
            <p className="flex items-center gap-2 font-semibold">
                <span className={cn("flex size-5 items-center justify-center rounded-full text-white", feedback.correct ? "bg-green-500" : "bg-red-500")} aria-hidden="true">
                    {feedback.correct ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
                </span>
                {feedback.correct ? "Richtig!" : "Leider falsch."}
            </p>
            {!feedback.correct && (
                <p>
                    Richtige Antwort: <span className="font-medium">{feedback.correctAnswer}</span>
                </p>
            )}
            {feedback.explanation && <p dir="auto" className="mt-1">💡 {feedback.explanation}</p>}
            {feedback.commonMistake && <p className="mt-1 italic">⚠️ Häufiger Fehler: {feedback.commonMistake}</p>}
            {!isEmptyTranscript(feedback.transcript) && (
                <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="font-semibold text-xs uppercase tracking-wide mb-1">Transkript</p>
                    <TranscriptContent transcript={feedback.transcript ?? ""} variant="compact" />
                </div>
            )}
        </div>
    );
}

interface StepQuizState {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[];
    answerOptionLabels: string[];
    currentIndex: number;
    selectedAnswer: string;
    feedback: ExamAnswerFeedbackResponse | null;
    submitting: boolean;
    items: ResultItem[];
}

/**
 * Every other task type: one question at a time, with immediate right/wrong feedback and tips
 * before moving on, then an overall score screen at the end.
 */
function StepQuiz({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const [quiz, setQuiz] = useState<StepQuizState | null>(null);
    const [results, setResults] = useState<ResultsState | null>(null);
    const [starting, setStarting] = useState(false);
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);

    const practiceAgain = () => {
        setResults(null);
        setQuiz(null);
    };

    const beginAttempt = () => {
        setStarting(true);
        startExamAttempt(exercise.id)
            .then((res) => {
                setQuiz({
                    attemptId: res.data.attemptId,
                    passages: res.data.passages,
                    questions: res.data.questions,
                    answerOptions: res.data.answerOptions ?? [],
                    answerOptionLabels: res.data.answerOptionLabels ?? [],
                    currentIndex: 0,
                    selectedAnswer: "",
                    feedback: null,
                    submitting: false,
                    items: [],
                });
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Übung konnte nicht gestartet werden."))
            .finally(() => setStarting(false));
    };

    const answerQuestion = () => {
        if (!quiz) return;
        const question = quiz.questions[quiz.currentIndex];
        setQuiz({ ...quiz, submitting: true });
        submitExamAnswer(quiz.attemptId, { questionId: question.id, answer: quiz.selectedAnswer })
            .then((res) => {
                setQuiz((prev) =>
                    prev
                        ? { ...prev, feedback: res.data, submitting: false, items: [...prev.items, { question, feedback: res.data, answer: quiz.selectedAnswer }] }
                        : prev
                );
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message ?? "Antwort konnte nicht übermittelt werden.");
                setQuiz((prev) => (prev ? { ...prev, submitting: false } : prev));
            });
    };

    const nextQuestion = () => {
        if (!quiz) return;
        if (quiz.currentIndex + 1 >= quiz.questions.length) {
            completeExamAttempt(quiz.attemptId)
                .then((res) => {
                    setResults({ score: res.data.score, items: quiz.items, transcripts: res.data.transcripts ?? [] });
                })
                .catch((err) => toast.error(err?.response?.data?.message ?? "Übung konnte nicht abgeschlossen werden."));
            return;
        }
        setQuiz({ ...quiz, currentIndex: quiz.currentIndex + 1, selectedAnswer: "", feedback: null });
    };

    if (results) {
        return (
            <ResultsView
                results={results}
                defaultExplanation={exercise.defaultExplanation}
                defaultCommonMistake={exercise.defaultCommonMistake}
                completed={completed}
                markingCompleted={marking}
                onPracticeAgain={practiceAgain}
                onMarkCompleted={markCompleted}
            />
        );
    }
    if (!quiz) return <StartCard starting={starting} onStart={beginAttempt} />;

    const question = quiz.questions[quiz.currentIndex];
    if (!question) {
        return <p className="text-sm text-foreground/60">Diese Übung enthält noch keine Aufgaben.</p>;
    }

    const currentPassage =
        exercise.taskType === "MATCHING" && question.sectionIndex != null ? quiz.passages[question.sectionIndex] : null;
    const isReadingMc = isLesenMultipleChoice(exercise);

    const card = (
        <div className="rounded-[10px] bg-card p-6 shadow-card sm:p-8 space-y-3">
            {isReadingMc ? (
                <nav aria-label="Fragen" className="flex flex-wrap items-center gap-2">
                    {quiz.questions.map((q, i) => {
                        const result = quiz.items.find((item) => item.question.id === q.id)?.feedback;
                        const current = i === quiz.currentIndex;
                        return (
                            <span
                                key={q.id}
                                aria-current={current ? "step" : undefined}
                                aria-label={`Frage ${q.questionNumber ?? i + 1}${result ? (result.correct ? ", richtig" : ", falsch") : ""}`}
                                className={cn(
                                    "flex size-8 items-center justify-center rounded-full text-xs font-extrabold transition",
                                    result ? (result.correct ? "bg-green-500 text-white" : "bg-red-500 text-white") : "border-2 border-dashed border-primary/40 text-primary",
                                    current && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                                )}
                            >
                                {result ? (result.correct ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />) : (q.questionNumber ?? i + 1)}
                            </span>
                        );
                    })}
                </nav>
            ) : (
                <div className="flex gap-1.5" role="progressbar" aria-valuenow={quiz.currentIndex + 1} aria-valuemin={1} aria-valuemax={quiz.questions.length}>
                    {quiz.questions.map((q, i) => (
                        <span key={q.id} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= quiz.currentIndex ? "bg-primary" : "bg-foreground/10")} />
                    ))}
                </div>
            )}
            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {question.questionNumber != null && question.questionNumber !== quiz.currentIndex + 1
                    ? `Aufgabe ${question.questionNumber} (${quiz.currentIndex + 1} von ${quiz.questions.length})`
                    : `Aufgabe ${quiz.currentIndex + 1} von ${quiz.questions.length}`}
                {currentPassage && ` — ${currentPassage.label}`}
            </p>

            {currentPassage && (
                <div className="rounded-2xl border-s-4 border-primary/40 bg-primary/[0.06] p-4">
                    <p className="font-semibold text-foreground mb-1">{currentPassage.label}</p>
                    <PassageBody passage={currentPassage} />
                </div>
            )}

            <p className={isReadingMc ? "text-lg font-bold leading-snug text-foreground" : "font-medium text-foreground"}>{question.prompt}</p>

            <QuestionInput
                key={question.id}
                feedback={quiz.feedback}
                question={question}
                answerOptions={quiz.answerOptions}
                answerOptionLabels={quiz.answerOptionLabels}
                taskType={exercise.taskType ?? ""}
                selectedAnswer={quiz.selectedAnswer}
                disabled={Boolean(quiz.feedback)}
                onSelect={(value) => setQuiz({ ...quiz, selectedAnswer: value })}
            />

            {quiz.feedback && <FeedbackCard feedback={quiz.feedback} />}

            <div className="flex justify-end pt-2">
                {quiz.feedback ? (
                    <button type="button" className={pillPrimary} onClick={nextQuestion}>
                        {quiz.currentIndex + 1 >= quiz.questions.length ? "Ergebnis anzeigen" : "Nächste Aufgabe"}
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                ) : (
                    <button type="button" className={pillPrimary}
                        disabled={!quiz.selectedAnswer || quiz.submitting}
                        onClick={answerQuestion}
                    >
                        {quiz.submitting ? "Wird geprüft..." : "Antwort abgeben"}
                    </button>
                )}
            </div>
        </div>
    );

    if (!isReadingMc) return card;
    return (
        <div className="space-y-5">
            <LesenTextPanel passages={quiz.passages} />
            <div key={question.id} className="anim-slide-in">{card}</div>
        </div>
    );
}

interface HoerenListQuizState {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[];
    answerOptionLabels: string[];
    answers: Record<string, string>;
    submitting: boolean;
}

/**
 * Hoerverstehen: every clip is listed at once as a numbered item with its own audio player and
 * inline +/- buttons for Richtig/Falsch; a single "Antworten abgeben" grades everything together
 * and only then reveals correctness/explanations/transcripts (mirrors ClozeGridQuiz's batching,
 * so a student can revisit any clip before submitting but never sees feedback mid-attempt).
 */
function HoerenListQuiz({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const [quiz, setQuiz] = useState<HoerenListQuizState | null>(null);
    const [results, setResults] = useState<ResultsState | null>(null);
    const [starting, setStarting] = useState(false);
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);

    const beginAttempt = () => {
        setStarting(true);
        startExamAttempt(exercise.id)
            .then((res) => {
                setQuiz({
                    attemptId: res.data.attemptId,
                    passages: res.data.passages,
                    questions: res.data.questions,
                    answerOptions: res.data.answerOptions ?? [],
                    answerOptionLabels: res.data.answerOptionLabels ?? [],
                    answers: {},
                    submitting: false,
                });
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Übung konnte nicht gestartet werden."))
            .finally(() => setStarting(false));
    };

    const practiceAgain = () => {
        setResults(null);
        setQuiz(null);
    };

    const submitAll = async () => {
        if (!quiz) return;
        setQuiz({ ...quiz, submitting: true });
        try {
            const items: ResultItem[] = [];
            for (const question of quiz.questions) {
                const res = await submitExamAnswer(quiz.attemptId, {
                    questionId: question.id,
                    answer: quiz.answers[question.id] ?? "",
                });
                items.push({ question, feedback: res.data, answer: quiz.answers[question.id] ?? "" });
            }
            const completeRes = await completeExamAttempt(quiz.attemptId);
            setResults({ score: completeRes.data.score, items, transcripts: completeRes.data.transcripts ?? [] });
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Übung konnte nicht abgeschlossen werden.");
            setQuiz((prev) => (prev ? { ...prev, submitting: false } : prev));
        }
    };

    if (results) {
        return (
            <ResultsView
                results={results}
                defaultExplanation={exercise.defaultExplanation}
                defaultCommonMistake={exercise.defaultCommonMistake}
                completed={completed}
                markingCompleted={marking}
                onPracticeAgain={practiceAgain}
                onMarkCompleted={markCompleted}
            />
        );
    }
    if (!quiz) return <StartCard starting={starting} onStart={beginAttempt} />;
    if (quiz.questions.length === 0) {
        return <p className="text-sm text-foreground/60">Diese Übung enthält noch keine Aufgaben.</p>;
    }

    const allAnswered = quiz.questions.every((q) => quiz.answers[q.id]);

    return (
        <div className="space-y-4">
            <HoerenBoard
                teil={exercise.teil ?? exercise.partNumber ?? undefined}
                passages={quiz.passages}
                questions={quiz.questions}
                answerOptions={quiz.answerOptions}
                answers={quiz.answers}
                disabled={quiz.submitting}
                onAnswer={(questionId, value) =>
                    setQuiz((prev) => {
                        if (!prev) return prev;
                        const answers = { ...prev.answers };
                        if (value) answers[questionId] = value;
                        else delete answers[questionId];
                        return { ...prev, answers };
                    })
                }
            />

            <div className="flex justify-end pt-2">
                <button type="button" className={pillPrimary} disabled={!allAnswered || quiz.submitting} onClick={submitAll}>
                    {quiz.submitting ? "Wird geprüft..." : "Antworten abgeben"}
                </button>
            </div>
        </div>
    );
}

function ExamExerciseContent() {
    const router = useRouter();
    const { toggle: toggleBookmark, pendingId: bookmarkPendingId } = useExamBookmark();
    const searchParams = useSearchParams();
    const exerciseId = searchParams.get("id") ?? "";
    const {
        data: exercise = null,
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ["exam", "exercise", exerciseId],
        queryFn: () => getExamExerciseById(exerciseId).then((res) => res.data),
        enabled: !!exerciseId,
    });

    useEffect(() => {
        if (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Übung konnte nicht geladen werden.");
        }
    }, [error]);

    const message = (text: string) => (
        <div dir="ltr" className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-4xl rounded-[10px] bg-card p-10 text-center shadow-card">
                <p className="text-foreground/65">{text}</p>
                <Link href="/dashboard/exam-prep" className="mt-3 inline-block font-semibold text-primary hover:underline">
                    Zurück zur Prüfungsvorbereitung
                </Link>
            </div>
        </div>
    );

    if (!exerciseId) return message("Keine Übung ausgewählt.");

    if (loading) return <Loading />;

    if (!exercise) return message("Übung nicht gefunden.");

    const sectionMeta = EXAM_TYPE_META[exercise.section as keyof typeof EXAM_TYPE_META];

    return (
        <div dir="ltr" className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-4xl space-y-6" style={SECTION_THEME[exercise.section] ? lessonThemeVars(SECTION_THEME[exercise.section]!.accent) : undefined}>
                {/* Behaves like the browser's back button (returns to the Teil list this exercise was opened from). */}
                <button
                    type="button"
                    onClick={() => {
                        if (window.history.length > 1) {
                            router.back();
                        } else {
                            const levelQuery = exercise.level ? `&level=${encodeURIComponent(exercise.level)}` : "";
                            router.push(`/dashboard/exam-prep?section=${exercise.section}${levelQuery}`);
                        }
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-foreground/60 transition hover:text-foreground"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Zurück
                </button>

                {SECTION_HEADER[exercise.section] ? (
                    <ExerciseTopHeader
                        exercise={exercise}
                        accent={SECTION_THEME[exercise.section]!.accent}
                        icon={SECTION_HEADER[exercise.section]!.icon}
                        kicker={`Teil ${exercise.teil ?? exercise.partNumber ?? 1}`}
                        sectionLabel={SECTION_HEADER[exercise.section]!.label}
                        showTimer={exercise.section !== "HOERVERSTEHEN"}
                        descriptionAs={exercise.section === "HOERVERSTEHEN" || exercise.section === "LESEVERSTEHEN" || exercise.section === "SPRACHBAUSTEINE" ? "paragraph" : "steps"}
                        title={exercise.title.replace(/^.*?Teil\s+\d\s*[–-]\s*/i, "").trim() || exercise.title}
                        bookmarked={exercise.bookmarked}
                        bookmarkPending={bookmarkPendingId === exercise.id}
                        onToggleBookmark={() => toggleBookmark(exercise.id, exercise.bookmarked)}
                    />
                ) : exercise.section === "SCHRIFTLICHER_AUSDRUCK" ? (
                    <ExerciseTopHeader
                        exercise={exercise}
                        accent="writing"
                        icon={PenLine}
                        kicker="Schreibaufgabe"
                        sectionLabel="Schriftlicher Ausdruck"
                        title={exercise.title.replace(/^.*?Schriftlicher Ausdruck\s*[–-]\s*/i, "").trim() || exercise.title}
                        bookmarked={exercise.bookmarked}
                        bookmarkPending={bookmarkPendingId === exercise.id}
                        onToggleBookmark={() => toggleBookmark(exercise.id, exercise.bookmarked)}
                    />
                ) : exercise.section === "MUENDLICHER_AUSDRUCK" ? (
                    <SpeakingTopHeader
                        exercise={exercise}
                        bookmarked={exercise.bookmarked}
                        bookmarkPending={bookmarkPendingId === exercise.id}
                        onToggleBookmark={() => toggleBookmark(exercise.id, exercise.bookmarked)}
                    />
                ) : (
                    <>
                    <LearningPageHero
                        icon={sectionMeta?.icon ?? FileText}
                        title={exercise.title}
                        subtitle={sectionMeta?.label ?? "Prüfungsvorbereitung"}
                        meta={<span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{exercise.level ?? "Alle Niveaus"}</span>}
                        actions={
                            <button
                                type="button"
                                disabled={bookmarkPendingId === exercise.id}
                                onClick={() => toggleBookmark(exercise.id, exercise.bookmarked)}
                                aria-pressed={exercise.bookmarked}
                                className={cn(
                                    "inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60",
                                    exercise.bookmarked
                                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                                )}
                            >
                                {exercise.bookmarked ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
                                {exercise.bookmarked ? "Gemerkt" : "Merken"}
                            </button>
                        }
                    />

                    <ExamExerciseTimer exercise={exercise} />

                    {exercise.teilDescription && (
                        <div className="rounded-2xl border-s-4 border-primary/40 bg-primary/[0.06] p-4 text-sm text-foreground/80 whitespace-pre-wrap">
                            {exercise.teilDescription}
                        </div>
                    )}

                    </>
                )}

                {exercise.section !== "HOERVERSTEHEN" &&
                    exercise.section !== "SCHRIFTLICHER_AUSDRUCK" &&
                    exercise.section !== "MUENDLICHER_AUSDRUCK" &&
                    exercise.section !== "TESTFORMAT_INFORMATION" && (
                    <>
                        {exercise.taskType === "WORD_BANK_CLOZE" && !isSprachbausteineGapText(exercise) && (
                            <AnswerOptionsPoolView answerOptions={exercise.answerOptions ?? []} answerOptionLabels={exercise.answerOptionLabels ?? []} taskType={exercise.taskType} />
                        )}
                        {/* Lesen Teil 1 (headings) and Teil 3 (ads) show their texts inside the matching board once the exercise is started. */}
                        {exercise.taskType !== "SITUATION_MATCHING" && exercise.taskType !== "MATCHING" && !isLesenMultipleChoice(exercise) && !isSprachbausteineGapText(exercise) && (
                            <PassagesView passages={exercise.passages} taskType={exercise.taskType ?? ""} />
                        )}
                    </>
                )}

                {exercise.section === "HOERVERSTEHEN" ? (
                    <HoerenListQuiz exercise={exercise} />
                ) : exercise.section === "SCHRIFTLICHER_AUSDRUCK" ? (
                    <SchriftlicherAusdruckView exercise={exercise} />
                ) : exercise.section === "MUENDLICHER_AUSDRUCK" ? (
                    <MuendlicherAusdruckView exercise={exercise} />
                ) : exercise.section === "TESTFORMAT_INFORMATION" ? (
                    <TestformatInformationView exercise={exercise} />
                ) : exercise.taskType === "WORD_BANK_CLOZE" || exercise.taskType === "SITUATION_MATCHING" || exercise.taskType === "MATCHING" || isSprachbausteineGapText(exercise) ? (
                    <ClozeGridQuiz exercise={exercise} />
                ) : (
                    <StepQuiz exercise={exercise} />
                )}
            </div>
        </div>
    );
}

export default function ExamExercisePage() {
    return (
        <Suspense fallback={<Loading />}>
            <ExamExerciseContent />
        </Suspense>
    );
}
