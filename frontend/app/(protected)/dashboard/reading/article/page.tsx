"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, Bookmark, BookmarkCheck, Calendar, Check, ChevronLeft, ChevronRight, Clock, Eye, Lightbulb, Play, X } from "lucide-react";
import CircularProgress from "@/componenets/CircularProgress";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
    addReadingArticleBookmark,
    getReadingArticleById,
    getReadingArticleNavigation,
    recordReadingArticleView,
    removeReadingArticleBookmark,
} from "@/services/readingService";
import { setLearningProgress } from "@/services/grammarService";
import { invalidatePendingReadingBookmarks } from "@/lib/readingQueryCache";
import { saveToLexicon } from "@/services/lexiconService";
import { startAttempt, submitAnswer, completeAttempt } from "@/services/readingAttemptService";
import {
    Annotation,
    AnswerFeedbackResponse,
    ArticleRecommendation,
    ArticleToken,
    KeyVocabularyItem,
    QuizQuestionPublic,
    ReadingArticle,
    ReadingArticleNeighbor,
} from "@/types/reading";
import Loading from "@/componenets/Loading";
import DictionaryPanel from "@/componenets/DictionaryPanel";
import { getArticleImageSrc } from "@/lib/readingImages";
import { getLevelMeta, levelThemeVars } from "@/componenets/learning/levelMeta";
import LessonStepper, { StepInfo } from "@/componenets/learning/LessonStepper";
import { TEXT_SIZES, TextSizeControl, useTextSize } from "@/componenets/learning/TextSize";
import { useI18n } from "@/componenets/I18nProvider";

const GENDER_COLORS: Record<string, string> = {
    der: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
    die: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    das: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
};

// Highlight styles use the app's learning colors: words amber, noun-verb phrases blue, idioms orange.
const ANNOTATION_STYLES: Record<Annotation["type"], string> = {
    WORD: "bg-learning-vocabulary/15 border-b border-dotted border-learning-vocabulary hover:bg-learning-vocabulary/25",
    NOMEN_VERB_VERBINDUNG: "bg-learning-grammar/10 border-b-2 border-solid border-learning-grammar hover:bg-learning-grammar/20",
    REDEWENDUNG: "bg-learning-expression/10 border-b-2 border-dashed border-learning-expression hover:bg-learning-expression/20",
};

const pillPrimary =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-50";
const pillSmall =
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default";

type Segment =
    | { kind: "annotation"; text: string; annotation: Annotation }
    | { kind: "word"; text: string; lemma: string }
    | { kind: "plain"; text: string };

/**
 * Merges two independently-computed layers into one render pass: curated Annotation spans
 * (character offsets into `content`, spec 3.2's tap-to-reveal highlighting) and the full
 * per-word ArticleToken list (click-to-define, every word individually clickable). Annotated
 * ranges win where they overlap a token; every other word token becomes its own clickable span.
 */
function buildRenderSegments(content: string, tokens: ArticleToken[], annotations: Annotation[]): Segment[] {
    const priority: Record<Annotation["type"], number> = {
        REDEWENDUNG: 3,
        NOMEN_VERB_VERBINDUNG: 2,
        WORD: 1,
    };

    const annotationRanges = annotations
        .filter((a) => !a.known)
        .flatMap((a) => a.spans.map((s) => ({ start: s.start, end: s.end, annotation: a })))
        .sort((a, b) => a.start - b.start || priority[b.annotation.type] - priority[a.annotation.type]);

    const resolvedAnnotations: typeof annotationRanges = [];
    let lastEnd = -1;
    for (const item of annotationRanges) {
        if (item.start < lastEnd) continue;
        resolvedAnnotations.push(item);
        lastEnd = item.end;
    }

    const sortedTokens = [...tokens].sort((a, b) => a.index - b.index);

    const segments: Segment[] = [];
    let cursor = 0;
    let tokenPointer = 0;
    let annotationPointer = 0;

    while (cursor < content.length) {
        const nextAnnotation = resolvedAnnotations[annotationPointer];
        if (nextAnnotation && nextAnnotation.start === cursor) {
            segments.push({
                kind: "annotation",
                text: content.slice(nextAnnotation.start, nextAnnotation.end),
                annotation: nextAnnotation.annotation,
            });
            while (tokenPointer < sortedTokens.length && cursor < nextAnnotation.end) {
                cursor += sortedTokens[tokenPointer].text.length;
                tokenPointer++;
            }
            annotationPointer++;
            continue;
        }

        const token = sortedTokens[tokenPointer];
        if (!token) {
            segments.push({ kind: "plain", text: content.slice(cursor) });
            break;
        }

        segments.push(
            token.isWord
                ? { kind: "word", text: token.text, lemma: token.lemma }
                : { kind: "plain", text: token.text }
        );
        cursor += token.text.length;
        tokenPointer++;
    }

    return segments;
}

function ArticleContent({
    content,
    tokens,
    annotations,
    activeAnnotationId,
    tappedLemmas,
    sizeClass,
    onAnnotationClick,
    onWordClick,
}: Readonly<{
    sizeClass: string;
    content: string;
    tokens: ArticleToken[];
    annotations: Annotation[];
    activeAnnotationId: string | null;
    tappedLemmas: Set<string>;
    onAnnotationClick: (annotation: Annotation) => void;
    onWordClick: (lemma: string) => void;
}>) {
    const segments = useMemo(
        () => buildRenderSegments(content, tokens, annotations),
        [content, tokens, annotations]
    );

    return (
        <p dir="ltr" className={cn("mx-auto max-w-[68ch] whitespace-pre-line text-left text-foreground/90 transition-[font-size,line-height]", sizeClass)}>
            {segments.map((segment, idx) => {
                if (segment.kind === "plain") return <span key={idx}>{segment.text}</span>;

                if (segment.kind === "annotation") {
                    const isActive = activeAnnotationId === segment.annotation.id;
                    const isTapped = tappedLemmas.has(segment.annotation.lemma);
                    return (
                        <mark
                            key={idx}
                            onClick={() => onAnnotationClick(segment.annotation)}
                            className={`cursor-pointer rounded-sm not-italic text-foreground ${ANNOTATION_STYLES[segment.annotation.type]} ${
                                isActive ? "bg-primary/20" : isTapped ? "bg-foreground/[0.06]" : ""
                            }`}
                        >
                            {segment.text}
                        </mark>
                    );
                }

                return (
                    <span
                        key={idx}
                        onClick={() => onWordClick(segment.lemma)}
                        className="cursor-pointer rounded-sm hover:bg-learning-vocabulary/20"
                    >
                        {segment.text}
                    </span>
                );
            })}
        </p>
    );
}

function AnnotationPopup({
    annotation,
    onSave,
    onClose,
    isSaved,
}: Readonly<{ annotation: Annotation; onSave: () => void; onClose: () => void; isSaved: boolean }>) {
    const { t } = useI18n();
    return (
        <div
            role="dialog"
            aria-label={annotation.lemma}
            className="anim-fade-up fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl flex-wrap items-start justify-between gap-4 rounded-3xl border-s-4 border-primary bg-card p-4 shadow-2xl ring-1 ring-border sm:p-5"
        >
            <div className="min-w-0 flex-1 space-y-1.5">
                {annotation.type === "WORD" && (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-bold text-foreground">{annotation.lemma}</span>
                            {annotation.gender && (
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${GENDER_COLORS[annotation.gender] ?? ""}`}>{annotation.gender}</span>
                            )}
                            {annotation.pluralForm && (
                                <span className="text-xs text-foreground/55">
                                    {t.readingArticle.plural}
                                    {annotation.pluralForm}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-foreground/80">{annotation.translationEn}</p>
                    </>
                )}

                {annotation.type === "NOMEN_VERB_VERBINDUNG" && (
                    <>
                        <p className="text-lg font-bold text-foreground">{annotation.lemma}</p>
                        <p className="text-sm text-foreground/80">{annotation.translationEn}</p>
                    </>
                )}

                {annotation.type === "REDEWENDUNG" && (
                    <>
                        <p className="text-lg font-bold text-foreground">{annotation.lemma}</p>
                        <p className="text-xs text-foreground/55">
                            {t.readingArticle.literal}
                            <span className="italic">{annotation.literalTranslation}</span>
                        </p>
                        <p className="text-sm text-foreground/80">
                            {t.readingArticle.meaning}
                            {annotation.translationEn}
                        </p>
                    </>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    disabled={isSaved}
                    onClick={onSave}
                    className={cn(pillSmall, "py-2", isSaved ? "border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400" : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90")}
                >
                    {isSaved ? <Check className="mr-1 size-3.5" strokeWidth={3} aria-hidden="true" /> : <Bookmark className="mr-1 size-3.5" aria-hidden="true" />}
                    {isSaved ? t.readingArticle.saved : t.readingArticle.save}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t.readingArticle.close}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground/[0.06] text-foreground/60 transition hover:bg-foreground/10 hover:text-foreground"
                >
                    <X className="size-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

function GlossarySection({
    article,
    savedLemmas,
    onSave,
}: Readonly<{
    article: ReadingArticle;
    savedLemmas: Set<string>;
    onSave: (annotation: Annotation) => void;
}>) {
    const { t } = useI18n();
    const glossary = useMemo(() => {
        const byWord = new Map<string, KeyVocabularyItem>();
        for (const v of article.keyVocabulary) {
            if (!byWord.has(v.word)) byWord.set(v.word, v);
        }
        return Array.from(byWord.values()).sort((a, b) => a.word.localeCompare(b.word));
    }, [article.keyVocabulary]);

    if (glossary.length === 0) return null;

    return (
        <section id="step-vocab" className="scroll-mt-24 overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="flex items-center gap-3 bg-learning-vocabulary/[0.08] px-6 pb-4 pt-6 sm:px-8">
                <span className="flex size-10 items-center justify-center rounded-xl bg-learning-vocabulary/15">
                    <Lightbulb className="size-5 text-learning-vocabulary" aria-hidden="true" />
                </span>
                <div>
                    <h2 className="text-xl font-bold text-foreground">{t.readingArticle.keyVocabulary}</h2>
                    <p className="text-sm text-foreground/60">{t.readingArticle.keyVocabularySubtitle}</p>
                </div>
            </div>
            <ul className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                {glossary.map((v) => {
                    const isSaved = savedLemmas.has(v.word);
                    return (
                        <li key={v.word} className={cn("flex items-center justify-between gap-3 rounded-2xl border p-4 transition", isSaved ? "border-green-500/30 bg-green-500/[0.06]" : "border-border/60 bg-background hover:border-learning-vocabulary/50 hover:shadow-card")}>
                            <div className="min-w-0">
                                <span className="font-bold text-foreground">{v.word}</span>
                                <p className="mt-0.5 text-sm text-foreground/60">{v.meaning}</p>
                            </div>
                            <button
                                type="button"
                                disabled={isSaved}
                                className={cn(pillSmall, isSaved ? "border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400" : "bg-primary/10 text-primary hover:bg-primary/20")}
                                onClick={() =>
                                    onSave({
                                        id: v.word,
                                        spans: [],
                                        surfaceText: v.word,
                                        type: "WORD",
                                        lemma: v.word,
                                        pos: null,
                                        gender: null,
                                        pluralForm: null,
                                        translationEn: v.meaning,
                                        literalTranslation: null,
                                        cefrLevel: null,
                                        exampleSentence: null,
                                        known: false,
                                    })
                                }
                            >
                                {isSaved ? t.readingArticle.saved : t.readingArticle.save}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

type QuizPhase = "idle" | "active" | "results";

interface QuizState {
    attemptId: string;
    questions: QuizQuestionPublic[];
    currentIndex: number;
    selectedAnswer: string;
    feedback: AnswerFeedbackResponse | null;
    submitting: boolean;
    /** Right/wrong per answered question (index = question position), for the progress dots. */
    correctness: boolean[];
}

interface ResultsState {
    comprehensionScore: number;
    vocabScore: number;
    recommendation: ArticleRecommendation;
}

function QuizSection({
    article,
    tappedLemmas,
    savedLemmas,
    onSaveWord,
}: Readonly<{
    article: ReadingArticle;
    tappedLemmas: Set<string>;
    savedLemmas: Set<string>;
    onSaveWord: (annotation: Annotation) => void;
}>) {
    const router = useRouter();
    const { t } = useI18n();
    const [phase, setPhase] = useState<QuizPhase>("idle");
    const [quiz, setQuiz] = useState<QuizState | null>(null);
    const [results, setResults] = useState<ResultsState | null>(null);
    const [starting, setStarting] = useState(false);

    const beginQuiz = () => {
        setStarting(true);
        startAttempt(article.id)
            .then((res) => {
                setQuiz({
                    attemptId: res.data.attemptId,
                    questions: res.data.questions,
                    currentIndex: 0,
                    selectedAnswer: "",
                    feedback: null,
                    submitting: false,
                    correctness: [],
                });
                setPhase("active");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to start quiz."))
            .finally(() => setStarting(false));
    };

    const answerQuestion = () => {
        if (!quiz) return;
        const question = quiz.questions[quiz.currentIndex];
        setQuiz({ ...quiz, submitting: true });
        submitAnswer(quiz.attemptId, { questionId: question.id, answer: quiz.selectedAnswer })
            .then((res) => {
                setQuiz((prev) => (prev ? { ...prev, feedback: res.data, submitting: false, correctness: [...prev.correctness.slice(0, prev.currentIndex), res.data.correct] } : prev));
                if (res.data.relatedLemma) {
                    const relatedAnnotation = article.annotations.find((a) => a.lemma === res.data.relatedLemma);
                    if (relatedAnnotation && !savedLemmas.has(relatedAnnotation.lemma)) {
                        onSaveWord(relatedAnnotation);
                    }
                }
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message ?? "Failed to submit answer.");
                setQuiz((prev) => (prev ? { ...prev, submitting: false } : prev));
            });
    };

    const nextQuestion = () => {
        if (!quiz) return;
        if (quiz.currentIndex + 1 >= quiz.questions.length) {
            completeAttempt(quiz.attemptId, {
                wordsTapped: Array.from(tappedLemmas),
                wordsSaved: Array.from(savedLemmas),
            })
                .then((res) => {
                    setResults({
                        comprehensionScore: res.data.comprehensionScore,
                        vocabScore: res.data.vocabScore,
                        recommendation: res.data.recommendation,
                    });
                    setPhase("results");
                })
                .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to finish quiz."));
            return;
        }
        setQuiz({ ...quiz, currentIndex: quiz.currentIndex + 1, selectedAnswer: "", feedback: null });
    };

    const activeQuestion = quiz?.questions[quiz.currentIndex];

    return (
        <section id="step-quiz" className="scroll-mt-24 overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="flex items-center justify-between gap-3 bg-learning-reading/[0.08] px-6 py-5 sm:px-8">
                <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-learning-reading/15">
                        <BookOpen className="size-5 text-learning-reading" aria-hidden="true" />
                    </span>
                    {t.readingArticle.quiz.title}
                </h2>
                {phase === "active" && quiz && (
                    <span className="text-sm font-medium text-foreground/55">{t.readingArticle.quiz.questionOf(quiz.currentIndex + 1, quiz.questions.length)}</span>
                )}
            </div>
            <div className="p-6 sm:p-8">

            {phase === "idle" && (
                <div className="mt-5 space-y-4">
                    <p className="text-sm text-foreground/65">{t.readingArticle.quiz.ready}</p>
                    <button type="button" className={pillPrimary} disabled={starting} onClick={beginQuiz}>
                        <Play className="size-4 fill-current" aria-hidden="true" />
                        {starting ? t.readingArticle.quiz.loadingQuiz : t.readingArticle.quiz.start}
                    </button>
                </div>
            )}

            {phase === "active" && quiz && !activeQuestion && <p className="mt-5 text-sm text-foreground/60">{t.readingArticle.quiz.noQuiz}</p>}

            {phase === "active" && quiz && activeQuestion && (
                <div className="mt-5">
                    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={quiz.currentIndex + 1} aria-valuemin={1} aria-valuemax={quiz.questions.length}>
                        {quiz.questions.map((q, i) => {
                            const result = quiz.correctness[i];
                            const current = i === quiz.currentIndex;
                            return (
                                <span
                                    key={q.id}
                                    className={cn(
                                        "flex size-8 items-center justify-center rounded-full text-xs font-extrabold transition",
                                        result === undefined ? "border-2 border-dashed border-primary/40 text-primary" : result ? "bg-green-500 text-white" : "bg-red-500 text-white",
                                        current && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                                    )}
                                >
                                    {result === undefined ? i + 1 : result ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : <X className="size-4" strokeWidth={3} aria-hidden="true" />}
                                </span>
                            );
                        })}
                    </div>

                    <div className="anim-fade-up mt-6" key={quiz.currentIndex}>
                        <p className="text-lg font-semibold leading-relaxed text-foreground sm:text-xl">{activeQuestion.prompt}</p>

                        <div className="mt-5 space-y-2.5">
                            {(activeQuestion.options ?? []).map((option, i) => {
                                const isSelected = quiz.selectedAnswer === option;
                                const answered = Boolean(quiz.feedback);
                                const isRight = answered && option === quiz.feedback?.correctAnswer;
                                const isWrong = answered && isSelected && !isRight;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        disabled={answered}
                                        onClick={() => setQuiz({ ...quiz, selectedAnswer: option })}
                                        className={cn(
                                            "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm text-foreground transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default",
                                            !answered && !isSelected && "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/50 hover:shadow-card",
                                            !answered && isSelected && "border-primary bg-primary/10",
                                            isRight && "border-green-500 bg-green-500/10",
                                            isWrong && "border-red-500 bg-red-500/10",
                                            answered && !isRight && !isWrong && "border-border/40 opacity-55",
                                        )}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                                isRight ? "bg-green-500 text-white" : isWrong ? "bg-red-500 text-white" : isSelected ? "bg-primary text-primary-foreground" : "bg-accent text-primary",
                                            )}
                                        >
                                            {isRight ? <Check className="size-4" strokeWidth={3} /> : isWrong ? <X className="size-4" strokeWidth={3} /> : String.fromCharCode(65 + i)}
                                        </span>
                                        <span className="min-w-0 flex-1 break-words">{option}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {quiz.feedback && (
                            <div
                                className={cn(
                                    "mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm",
                                    quiz.feedback.correct ? "bg-green-500/10 text-green-800 dark:text-green-300" : "bg-red-500/10 text-red-800 dark:text-red-300",
                                )}
                            >
                                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-white", quiz.feedback.correct ? "bg-green-500" : "bg-red-500")} aria-hidden="true">
                                    {quiz.feedback.correct ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                                </span>
                                <div>
                                    <p className="font-semibold">{quiz.feedback.correct ? t.readingArticle.quiz.correct : t.readingArticle.quiz.incorrect}</p>
                                    {!quiz.feedback.correct && (
                                        <p className="mt-0.5">
                                            {t.readingArticle.quiz.correctAnswer}
                                            <span className="font-semibold">{quiz.feedback.correctAnswer}</span>
                                        </p>
                                    )}
                                    <p className="mt-1">{quiz.feedback.explanation}</p>
                                    {!quiz.feedback.correct && quiz.feedback.supportingSentence && <p className="mt-1 italic">&quot;{quiz.feedback.supportingSentence}&quot;</p>}
                                    {quiz.feedback.relatedLemma && <p className="mt-1 text-xs">{t.readingArticle.quiz.addedToReview(quiz.feedback.relatedLemma)}</p>}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            {quiz.feedback ? (
                                <button type="button" className={pillPrimary} onClick={nextQuestion}>
                                    {quiz.currentIndex + 1 >= quiz.questions.length ? t.readingArticle.quiz.seeResults : t.readingArticle.quiz.nextQuestion}
                                    <ArrowRight className="size-4" aria-hidden="true" />
                                </button>
                            ) : (
                                <button type="button" className={pillPrimary} disabled={!quiz.selectedAnswer || quiz.submitting} onClick={answerQuestion}>
                                    {quiz.submitting ? t.readingArticle.quiz.checking : t.readingArticle.quiz.submitAnswer}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {phase === "results" && results && (
                <div className="anim-fade-up">
                    <p className="text-center text-2xl font-extrabold text-foreground">
                        {(results.comprehensionScore + results.vocabScore) / 2 >= 70 ? "🎉" : "💪"} {t.readingArticle.quiz.title}
                    </p>
                    <div className="mt-5 flex flex-wrap items-start justify-center gap-10 rounded-3xl bg-learning-reading/[0.06] p-6">
                        {[
                            { value: results.comprehensionScore, label: t.readingArticle.quiz.comprehension },
                            { value: results.vocabScore, label: t.readingArticle.quiz.vocabInContext },
                        ].map((ring) => (
                            <div key={ring.label} className="flex flex-col items-center gap-2">
                                <CircularProgress value={ring.value} size={108} color="hsl(173 58% 39%)" trackColor="hsl(0 0% 50% / 0.15)" showLabel />
                                <span className="text-xs font-medium text-foreground/60">{ring.label}</span>
                            </div>
                        ))}
                    </div>

                    <div
                        className={cn(
                            "mt-6 rounded-2xl p-4 text-sm",
                            results.recommendation.type === "LEVEL_UP"
                                ? "bg-green-500/10 text-green-800 dark:text-green-300"
                                : results.recommendation.type === "EASIER"
                                    ? "bg-learning-vocabulary/10 text-foreground/85"
                                    : "bg-primary/[0.07] text-foreground/85",
                        )}
                    >
                        <p>{results.recommendation.message}</p>
                        {results.recommendation.suggestedArticleId && (
                            <button
                                type="button"
                                className="mt-2 inline-flex cursor-pointer items-center gap-1.5 font-semibold text-primary hover:underline"
                                onClick={() => router.push(`/dashboard/reading/article?id=${results.recommendation.suggestedArticleId}`)}
                            >
                                {results.recommendation.suggestedTitle ?? t.readingArticle.quiz.goToArticle}
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
            )}
            </div>
        </section>
    );
}

function formatPostedDate(iso: string, locale: string): string {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

/** What the three highlight styles in the text mean. */
function HighlightLegend() {
    const { t } = useI18n();
    const items: { type: Annotation["type"]; label: string }[] = [
        { type: "WORD", label: t.readingArticle.legend.word },
        { type: "NOMEN_VERB_VERBINDUNG", label: t.readingArticle.legend.phrase },
        { type: "REDEWENDUNG", label: t.readingArticle.legend.idiom },
    ];
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-accent/50 px-4 py-2.5 text-xs text-foreground/70">
            <span className="font-semibold">{t.readingArticle.tapHint}</span>
            <ul aria-label={t.readingArticle.legend.title} className="flex flex-wrap items-center gap-3">
                {items.map((item) => (
                    <li key={item.type} className="flex items-center gap-1.5">
                        <mark className={cn("rounded-sm px-2 text-foreground", ANNOTATION_STYLES[item.type])}>Aa</mark>
                        {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * Previous/Next within the current level's list order (spec: never gated on quiz completion -
 * a learner should always be free to move on, whether they're skimming or studying deeply). The
 * "quiz not finished" hint next to Next is purely informational and never blocks the click.
 */
function ArticleNavRow({
    previous,
    next,
    quizCompleted,
    onNavigate,
}: Readonly<{
    previous: ReadingArticleNeighbor | null | undefined;
    next: ReadingArticleNeighbor | null | undefined;
    quizCompleted: boolean;
    onNavigate: (id: string) => void;
}>) {
    const { t } = useI18n();
    if (!previous && !next) return null;

    const navButton =
        "flex min-w-0 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm transition hover:text-primary hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-0";

    return (
        <div className="flex items-center justify-between gap-3">
            <button type="button" disabled={!previous} onClick={() => previous && onNavigate(previous.id)} title={previous?.title} className={navButton}>
                <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{t.readingArticle.previousArticle}</span>
            </button>

            {!quizCompleted && (
                <span className="hidden shrink-0 rounded-full bg-learning-vocabulary/12 px-3 py-1 text-xs font-medium text-foreground/70 sm:inline">{t.readingArticle.quizNotFinishedHint}</span>
            )}

            <button type="button" disabled={!next} onClick={() => next && onNavigate(next.id)} title={next?.title} className={navButton}>
                <span className="truncate">{t.readingArticle.nextArticle}</span>
                <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            </button>
        </div>
    );
}

export default function ReadingArticleDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ReadingArticleDetailRouter />
        </Suspense>
    );
}

/**
 * Reads the id from the URL and keys the content below by it, so Previous/Next (and the quiz's
 * "next article" suggestion) - which push a new id onto this same route - fully remount the page
 * instead of leaving stale per-article state (tapped words, quiz progress, view count) behind.
 */
function ReadingArticleDetailRouter() {
    const searchParams = useSearchParams();
    const articleId = searchParams.get("id") ?? "";
    return <ReadingArticleDetailContent key={articleId} articleId={articleId} />;
}

function ReadingArticleDetailContent({ articleId }: Readonly<{ articleId: string }>) {
    const router = useRouter();
    const { t, language } = useI18n();
    const queryClient = useQueryClient();
    const [viewCount, setViewCount] = useState<number | null>(null);
    const countedViewFor = useRef<string | null>(null);
    const [updatingLearned, setUpdatingLearned] = useState(false);
    const [updatingBookmark, setUpdatingBookmark] = useState(false);
    const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
    const [tappedLemmas, setTappedLemmas] = useState<Set<string>>(new Set());
    const [savedLemmas, setSavedLemmas] = useState<Set<string>>(new Set());
    const [activeDictionaryLemma, setActiveDictionaryLemma] = useState<string | null>(null);
    const articleRef = useRef<HTMLElement>(null);
    const [textSize, setTextSize] = useTextSize("reading.textSize");
    // How much of the text has scrolled past the bottom of the screen (0..1).
    const [readProgress, setReadProgress] = useState(0);

    // Full content (text, tokens, annotations, vocabulary) is only fetched here, once per article, and
    // then served from the cache on later opens. Quiz questions are fetched separately on "Start quiz".
    const articleQueryKey = ["reading", "article", articleId];
    const { data: article, isLoading: loading, error: articleError } = useQuery({
        queryKey: articleQueryKey,
        queryFn: () => getReadingArticleById(articleId).then((res) => res.data),
        enabled: !!articleId,
    });

    // Previous/Next within the current level's list order - lightweight, so it's fine to always fetch.
    const { data: navigation } = useQuery({
        queryKey: ["reading", "navigation", articleId],
        queryFn: () => getReadingArticleNavigation(articleId).then((res) => res.data),
        enabled: !!articleId,
    });
    const goToArticle = (id: string) => router.push(`/dashboard/reading/article?id=${id}`);

    useEffect(() => {
        if (articleError) {
            const err = articleError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load this article.");
        }
    }, [articleError]);

    // Views are counted on every open, even when the content above came from the cache. The ref
    // keeps React's dev-mode double effect from counting one open twice.
    useEffect(() => {
        if (!articleId || countedViewFor.current === articleId) return;
        countedViewFor.current = articleId;
        recordReadingArticleView(articleId)
            .then((res) => setViewCount(res.data.viewCount))
            .catch(() => {
                // Cosmetic counter - never block reading on it.
            });
    }, [articleId]);

    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const el = articleRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            setReadProgress(Math.min(1, Math.max(0, (window.innerHeight - rect.top) / rect.height)));
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [article]);

    const message = (text: string) => (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-4xl rounded-[10px] bg-card p-10 text-center shadow-card">
                <p className="text-foreground/65">{text}</p>
                <Link href="/dashboard/reading" className="mt-3 inline-block font-semibold text-primary hover:underline">
                    {t.readingArticle.back}
                </Link>
            </div>
        </div>
    );

    if (!articleId) return message(t.readingArticle.noArticleSelected);

    if (loading) return <Loading />;

    if (!article) return message(t.readingArticle.articleNotFound);

    const learned = article.learningProgresses?.some((lp) => lp.learned === true) ?? false;

    const toggleLearned = () => {
        setUpdatingLearned(true);
        setLearningProgress({ readingId: article.id, learned: !learned })
            .then(() => {
                queryClient.setQueryData<ReadingArticle>(articleQueryKey, (prev) =>
                    prev ? { ...prev, learningProgresses: [{ id: "local", learned: !learned }] } : prev
                );
                // Learned counts/flags changed - refresh the level cards and list pages next time they're shown.
                queryClient.invalidateQueries({ queryKey: ["reading", "level-summary"] });
                queryClient.invalidateQueries({ queryKey: ["reading", "list"] });
                invalidatePendingReadingBookmarks(queryClient);
                toast.success(!learned ? t.readingArticle.markedLearned : t.readingArticle.markedNotLearned);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setUpdatingLearned(false));
    };

    const toggleBookmark = () => {
        const bookmarked = article.bookmarked;
        setUpdatingBookmark(true);
        const request = bookmarked ? removeReadingArticleBookmark(article.id) : addReadingArticleBookmark(article.id);
        request
            .then((res) => {
                queryClient.setQueryData<ReadingArticle>(articleQueryKey, () => res.data);
                queryClient.invalidateQueries({ queryKey: ["reading", "list"] });
                invalidatePendingReadingBookmarks(queryClient);
                toast.success(bookmarked ? t.readingArticle.bookmarkRemoved : t.readingArticle.bookmarkAdded);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update bookmark."))
            .finally(() => setUpdatingBookmark(false));
    };

    const handleAnnotationClick = (annotation: Annotation) => {
        setActiveAnnotation(annotation);
        setTappedLemmas((prev) => new Set(prev).add(annotation.lemma));
    };

    const handleSaveWord = (annotation: Annotation) => {
        saveToLexicon({
            lemma: annotation.lemma,
            type: annotation.type,
            articleId: article.id,
            sentence: annotation.exampleSentence ?? "",
            translation: annotation.translationEn,
        })
            .then(() => {
                setSavedLemmas((prev) => new Set(prev).add(annotation.lemma));
                toast.success(t.readingArticle.savedToReview(annotation.lemma));
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save word."));
    };

    const chip = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";
    const levelColor = getLevelMeta(article.level).color;
    const wordTotal = article.content.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(wordTotal / 120));
    const hasVocabulary = article.keyVocabulary.length > 0;
    const steps: StepInfo[] = [
        { id: "step-read", label: t.readingArticle.steps.read, done: learned || readProgress >= 0.95 },
        ...(hasVocabulary ? [{ id: "step-vocab", label: t.readingArticle.steps.vocabulary, done: savedLemmas.size > 0 }] : []),
        { id: "step-quiz", label: t.readingArticle.steps.quiz, done: article.quizCompleted },
    ];

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" style={levelThemeVars(levelColor)}>
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/dashboard/reading" className="inline-block shrink-0 text-sm font-medium text-foreground/60 transition hover:text-foreground">
                        {t.readingArticle.back}
                    </Link>
                    <div className="min-w-0 flex-1">
                        <ArticleNavRow previous={navigation?.previous} next={navigation?.next} quizCompleted={article.quizCompleted} onNavigate={goToArticle} />
                    </div>
                </div>

                <LessonStepper steps={steps} progress={readProgress} label={t.readingArticle.progress(steps.filter((step) => step.done).length, steps.length)} />

                <article id="step-read" ref={articleRef} className="scroll-mt-24 overflow-hidden rounded-3xl bg-card shadow-card">
                    <div className="relative">
                        <img src={getArticleImageSrc(article.imageUrl, article.level)} alt="" className="h-72 w-full object-cover sm:h-96" />
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                        <button
                            type="button"
                            disabled={updatingBookmark}
                            onClick={toggleBookmark}
                            aria-pressed={article.bookmarked}
                            aria-label={article.bookmarked ? t.readingArticle.unbookmark : t.readingArticle.bookmark}
                            title={article.bookmarked ? t.readingArticle.unbookmark : t.readingArticle.bookmark}
                            className="absolute right-4 top-4 flex size-10 cursor-pointer items-center justify-center rounded-full bg-card/90 text-foreground/70 shadow-md backdrop-blur-sm transition hover:scale-105 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {article.bookmarked ? <BookmarkCheck className="size-5 text-primary" /> : <Bookmark className="size-5" />}
                        </button>

                        <header className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`${chip} text-white shadow-sm`} style={{ backgroundColor: levelColor }}>{article.level}</span>
                                {article.categoryTitle && <span className={`${chip} bg-white/20 text-white backdrop-blur-sm`}>{article.categoryTitle}</span>}
                                {learned && (
                                    <span className={`${chip} bg-green-500 text-white`}>
                                        <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                                        {t.readingArticle.learned}
                                    </span>
                                )}
                            </div>
                            <h1 className="mt-3 text-3xl font-extrabold leading-tight drop-shadow sm:text-4xl">{article.title}</h1>
                            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="size-4" aria-hidden="true" />
                                    {t.readingArticle.minRead(minutes)} · {t.readingArticle.wordsCount(wordTotal)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Eye className="size-4" aria-hidden="true" />
                                    {t.readingArticle.views(viewCount ?? article.viewCount).replace("👁 ", "")}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Calendar className="size-4" aria-hidden="true" />
                                    {t.readingArticle.posted(formatPostedDate(article.createdAt, language === "fa" ? "fa-IR-u-ca-gregory" : "en-US"))}
                                </span>
                            </p>
                        </header>
                    </div>

                    <div className="space-y-6 px-6 py-8 sm:px-10">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="min-w-0 flex-1 basis-72">
                                <HighlightLegend />
                            </div>
                            <TextSizeControl size={textSize} onChange={setTextSize} labels={t.readingArticle.textSize} />
                        </div>

                        <ArticleContent
                            content={article.content}
                            tokens={article.tokens ?? []}
                            annotations={article.annotations}
                            activeAnnotationId={activeAnnotation?.id ?? null}
                            tappedLemmas={tappedLemmas}
                            sizeClass={TEXT_SIZES[textSize]}
                            onAnnotationClick={handleAnnotationClick}
                            onWordClick={(lemma) => setActiveDictionaryLemma(lemma)}
                        />

                        {activeAnnotation && (
                            <AnnotationPopup
                                annotation={activeAnnotation}
                                isSaved={savedLemmas.has(activeAnnotation.lemma)}
                                onSave={() => handleSaveWord(activeAnnotation)}
                                onClose={() => setActiveAnnotation(null)}
                            />
                        )}

                        <div className="border-t border-border/60 pt-5">
                            <button
                                type="button"
                                disabled={updatingLearned}
                                onClick={toggleLearned}
                                className={cn(
                                    "inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60",
                                    learned
                                        ? "border border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/20 focus-visible:ring-green-400 dark:text-green-400"
                                        : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-primary/50",
                                )}
                            >
                                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                                {updatingLearned ? t.readingArticle.saving : learned ? t.readingArticle.markNotLearned : t.readingArticle.markLearned}
                            </button>
                        </div>
                    </div>
                </article>

                <GlossarySection article={article} savedLemmas={savedLemmas} onSave={handleSaveWord} />

                <QuizSection key={article.id} article={article} tappedLemmas={tappedLemmas} savedLemmas={savedLemmas} onSaveWord={handleSaveWord} />

                <ArticleNavRow previous={navigation?.previous} next={navigation?.next} quizCompleted={article.quizCompleted} onNavigate={goToArticle} />
            </div>
            <DictionaryPanel activeLemma={activeDictionaryLemma} onClose={() => setActiveDictionaryLemma(null)} />
        </div>
    );
}
