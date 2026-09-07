"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { getReadingArticles } from "@/services/readingService";
import { setLearningProgress } from "@/services/grammarService";
import { saveToLexicon } from "@/services/lexiconService";
import { startAttempt, submitAnswer, completeAttempt } from "@/services/readingAttemptService";
import {
    Annotation,
    AnswerFeedbackResponse,
    ArticleRecommendation,
    ArticleToken,
    QuizQuestionPublic,
    ReadingArticle,
} from "@/types/reading";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import DictionaryPanel from "@/componenets/DictionaryPanel";

const GENDER_COLORS: Record<string, string> = {
    der: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
    die: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200",
    das: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
};

const ANNOTATION_STYLES: Record<Annotation["type"], string> = {
    WORD: "bg-yellow-100 dark:bg-yellow-900/30 border-b border-dotted border-gray-400 hover:border-solid hover:border-gray-600 dark:border-gray-500 dark:hover:border-gray-300",
    NOMEN_VERB_VERBINDUNG: "bg-indigo-50 dark:bg-indigo-900/30 border-b-2 border-solid border-indigo-500 dark:border-indigo-400",
    REDEWENDUNG: "bg-pink-50 dark:bg-pink-900/30 border-b-2 border-dashed border-pink-500 dark:border-pink-400",
};

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
    onAnnotationClick,
    onWordClick,
}: Readonly<{
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
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
            {segments.map((segment, idx) => {
                if (segment.kind === "plain") return <span key={idx}>{segment.text}</span>;

                if (segment.kind === "annotation") {
                    const isActive = activeAnnotationId === segment.annotation.id;
                    const isTapped = tappedLemmas.has(segment.annotation.lemma);
                    return (
                        <mark
                            key={idx}
                            onClick={() => onAnnotationClick(segment.annotation)}
                            className={`cursor-pointer not-italic ${ANNOTATION_STYLES[segment.annotation.type]} ${
                                isActive
                                    ? "bg-blue-100 dark:bg-blue-900/40"
                                    : isTapped
                                        ? "bg-gray-100 dark:bg-gray-700/40"
                                        : ""
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
                        className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-sm"
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
    isSaved,
}: Readonly<{ annotation: Annotation; onSave: () => void; isSaved: boolean }>) {
    return (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 space-y-2">
            {annotation.type === "WORD" && (
                <>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                            {annotation.lemma}
                        </span>
                        {annotation.gender && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${GENDER_COLORS[annotation.gender] ?? ""}`}>
                                {annotation.gender}
                            </span>
                        )}
                        {annotation.pluralForm && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Plural: {annotation.pluralForm}
                            </span>
                        )}
                    </div>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">{annotation.translationEn}</p>
                </>
            )}

            {annotation.type === "NOMEN_VERB_VERBINDUNG" && (
                <>
                    <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">{annotation.lemma}</p>
                    <p className="text-indigo-800 dark:text-indigo-200 text-sm">{annotation.translationEn}</p>
                </>
            )}

            {annotation.type === "REDEWENDUNG" && (
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-pink-800 dark:text-pink-200">{annotation.lemma}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Literal: <span className="italic">{annotation.literalTranslation}</span>
                    </p>
                    <p className="text-pink-800 dark:text-pink-200 text-sm">Meaning: {annotation.translationEn}</p>
                </div>
            )}

            <Button
                variant={isSaved ? "secondary" : "primary"}
                className="text-xs px-3 py-1"
                disabled={isSaved}
                onClick={onSave}
            >
                {isSaved ? "Saved ✓" : "Save"}
            </Button>
        </div>
    );
}

type FlowStep = "reading" | "review" | "quiz" | "results";

interface QuizState {
    attemptId: string;
    questions: QuizQuestionPublic[];
    currentIndex: number;
    selectedAnswer: string;
    feedback: AnswerFeedbackResponse | null;
    submitting: boolean;
}

interface ResultsState {
    comprehensionScore: number;
    vocabScore: number;
    recommendation: ArticleRecommendation;
}

function ArticleFlow({
    article,
    tappedLemmas,
    savedLemmas,
    onSaveWord,
    onReset,
    onGoToArticle,
}: Readonly<{
    article: ReadingArticle;
    tappedLemmas: Set<string>;
    savedLemmas: Set<string>;
    onSaveWord: (annotation: Annotation) => void;
    onReset: () => void;
    onGoToArticle: (articleId: string) => void;
}>) {
    const [step, setStep] = useState<FlowStep>("review");
    const [quiz, setQuiz] = useState<QuizState | null>(null);
    const [results, setResults] = useState<ResultsState | null>(null);
    const [starting, setStarting] = useState(false);

    const reviewedLemmas = Array.from(new Set([...tappedLemmas, ...savedLemmas]));
    const reviewedAnnotations = reviewedLemmas
        .map((lemma) => article.annotations.find((a) => a.lemma === lemma))
        .filter((a): a is Annotation => Boolean(a));

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
                });
                setStep("quiz");
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
                setQuiz((prev) => (prev ? { ...prev, feedback: res.data, submitting: false } : prev));
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
                    setStep("results");
                })
                .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to finish quiz."));
            return;
        }
        setQuiz({ ...quiz, currentIndex: quiz.currentIndex + 1, selectedAnswer: "", feedback: null });
    };

    if (step === "review") {
        return (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Words you looked up</h3>
                {reviewedAnnotations.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You didn&apos;t tap any words this time — that&apos;s fine, on to the quiz.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {reviewedAnnotations.map((a) => (
                            <li key={a.id} className="text-sm">
                                <span className="font-medium text-gray-900 dark:text-white">{a.lemma}</span>
                                {a.exampleSentence && (
                                    <span className="text-gray-500 dark:text-gray-400"> — {a.exampleSentence}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                <div className="flex gap-2 pt-2">
                    <Button variant="secondary" className="text-sm px-4 py-2" onClick={onReset}>
                        Back to reading
                    </Button>
                    <Button
                        variant="primary"
                        className="text-sm px-4 py-2"
                        disabled={starting}
                        onClick={beginQuiz}
                    >
                        {starting ? "Loading quiz..." : "Start quiz"}
                    </Button>
                </div>
            </div>
        );
    }

    if (step === "quiz" && quiz) {
        const question = quiz.questions[quiz.currentIndex];
        if (!question) {
            return (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">This article has no quiz yet.</p>
                    <Button variant="secondary" className="text-sm px-4 py-2 mt-3" onClick={onReset}>
                        Back to reading
                    </Button>
                </div>
            );
        }

        return (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Question {quiz.currentIndex + 1} of {quiz.questions.length}
                </p>
                <p className="font-medium text-gray-900 dark:text-white">{question.prompt}</p>

                <div className="space-y-2">
                    {(question.options ?? []).map((option) => (
                        <button
                            key={option}
                            type="button"
                            disabled={Boolean(quiz.feedback)}
                            onClick={() => setQuiz({ ...quiz, selectedAnswer: option })}
                            className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                                quiz.selectedAnswer === option
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                    : "border-gray-300 dark:border-gray-600"
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {quiz.feedback && (
                    <div
                        className={`rounded-lg p-3 text-sm ${
                            quiz.feedback.correct
                                ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                        }`}
                    >
                        <p className="font-semibold">{quiz.feedback.correct ? "Correct!" : "Not quite."}</p>
                        {!quiz.feedback.correct && (
                            <p>
                                Correct answer: <span className="font-medium">{quiz.feedback.correctAnswer}</span>
                            </p>
                        )}
                        <p className="mt-1">{quiz.feedback.explanation}</p>
                        {!quiz.feedback.correct && quiz.feedback.supportingSentence && (
                            <p className="mt-1 italic">&quot;{quiz.feedback.supportingSentence}&quot;</p>
                        )}
                        {quiz.feedback.relatedLemma && (
                            <p className="mt-1 text-xs">Added &quot;{quiz.feedback.relatedLemma}&quot; to your review list.</p>
                        )}
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    {quiz.feedback ? (
                        <Button variant="primary" className="text-sm px-4 py-2" onClick={nextQuestion}>
                            {quiz.currentIndex + 1 >= quiz.questions.length ? "See results" : "Next question"}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            className="text-sm px-4 py-2"
                            disabled={!quiz.selectedAnswer || quiz.submitting}
                            onClick={answerQuestion}
                        >
                            {quiz.submitting ? "Checking..." : "Submit answer"}
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (step === "results" && results) {
        return (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Results</h3>
                <div className="flex gap-6">
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.round(results.comprehensionScore)}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Comprehension</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.round(results.vocabScore)}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Vocab in context</p>
                    </div>
                </div>

                <div
                    className={`rounded-lg p-3 text-sm ${
                        results.recommendation.type === "LEVEL_UP"
                            ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                            : results.recommendation.type === "EASIER"
                                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                                : "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    }`}
                >
                    <p>{results.recommendation.message}</p>
                    {results.recommendation.suggestedArticleId && (
                        <button
                            type="button"
                            className="mt-2 underline font-medium"
                            onClick={() => onGoToArticle(results.recommendation.suggestedArticleId!)}
                        >
                            {results.recommendation.suggestedTitle ?? "Go to article"} →
                        </button>
                    )}
                </div>

                <Button variant="secondary" className="text-sm px-4 py-2" onClick={onReset}>
                    Back to reading
                </Button>
            </div>
        );
    }

    return null;
}

export default function ReadingPage() {
    const [articles, setArticles] = useState<ReadingArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState<string | null>(null);
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [activeAnnotation, setActiveAnnotation] = useState<{ articleId: string; annotation: Annotation } | null>(null);
    const [tappedByArticle, setTappedByArticle] = useState<Record<string, Set<string>>>({});
    const [savedByArticle, setSavedByArticle] = useState<Record<string, Set<string>>>({});
    const [flowOpenFor, setFlowOpenFor] = useState<string | null>(null);
    const [activeDictionaryLemma, setActiveDictionaryLemma] = useState<string | null>(null);

    useEffect(() => {
        getReadingArticles()
            .then((res) => setArticles(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load reading articles."))
            .finally(() => setLoading(false));
    }, []);

    const goToArticle = (articleId: string) => {
        setFlowOpenFor(null);
        setActiveAnnotation(null);
        setLevelFilter("ALL");
        setOpenId(articleId);
    };

    if (loading) return <Loading />;

    const levels = Array.from(new Set(articles.map((a) => a.level))).filter(Boolean);
    const filtered = articles.filter((a) => levelFilter === "ALL" || a.level === levelFilter);

    const isLearned = (article: ReadingArticle) =>
        article.learningProgresses?.some((lp) => lp.learned === true) ?? false;

    const toggleLearned = (article: ReadingArticle) => {
        setUpdatingId(article.id);
        setLearningProgress({ readingId: article.id, learned: !isLearned(article) })
            .then(() => {
                setArticles((prev) =>
                    prev.map((a) =>
                        a.id === article.id
                            ? { ...a, learningProgresses: [{ id: "local", learned: !isLearned(article) }] }
                            : a
                    )
                );
                toast.success(!isLearned(article) ? "Marked as learned!" : "Marked as not learned.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setUpdatingId(null));
    };

    const handleAnnotationClick = (articleId: string, annotation: Annotation) => {
        setActiveAnnotation({ articleId, annotation });
        setTappedByArticle((prev) => {
            const next = new Set(prev[articleId] ?? []);
            next.add(annotation.lemma);
            return { ...prev, [articleId]: next };
        });
    };

    const handleSaveWord = (article: ReadingArticle, annotation: Annotation) => {
        saveToLexicon({
            lemma: annotation.lemma,
            type: annotation.type,
            articleId: article.id,
            sentence: annotation.exampleSentence ?? "",
            translation: annotation.translationEn,
        })
            .then(() => {
                setSavedByArticle((prev) => {
                    const next = new Set(prev[article.id] ?? []);
                    next.add(annotation.lemma);
                    return { ...prev, [article.id]: next };
                });
                toast.success(`Saved "${annotation.lemma}" to your review list.`);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save word."));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reading</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Read articles at your level and tap highlighted words to learn new vocabulary in context.
                </p>

                <div className="mt-6 flex items-center gap-3">
                    <label className="text-sm text-gray-600 dark:text-gray-300">Level:</label>
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                        <option value="ALL">All levels</option>
                        {levels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-6 space-y-4">
                    {filtered.map((article) => {
                        const open = openId === article.id;
                        const learned = isLearned(article);
                        const active =
                            activeAnnotation?.articleId === article.id ? activeAnnotation.annotation : null;
                        const tappedLemmas = tappedByArticle[article.id] ?? new Set<string>();
                        const savedLemmas = savedByArticle[article.id] ?? new Set<string>();
                        const inFlow = flowOpenFor === article.id;

                        return (
                            <div
                                key={article.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                            >
                                <button
                                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                                    onClick={() => {
                                        setOpenId(open ? null : article.id);
                                        setActiveAnnotation(null);
                                        setFlowOpenFor(null);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {article.title}
                                        </span>
                                        <Badge variant="secondary">{article.level}</Badge>
                                        {learned && <Badge variant="default">Learned</Badge>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {article.newWordCount > 0 && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {article.newWordCount} new for you
                                            </span>
                                        )}
                                        <span className="text-gray-400">{open ? "−" : "+"}</span>
                                    </div>
                                </button>

                                {open && (
                                    <div className="px-6 pb-6 space-y-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                            {article.topic}
                                        </p>

                                        {!inFlow && (
                                            <>
                                                <ArticleContent
                                                    content={article.content}
                                                    tokens={article.tokens ?? []}
                                                    annotations={article.annotations}
                                                    activeAnnotationId={active?.id ?? null}
                                                    tappedLemmas={tappedLemmas}
                                                    onAnnotationClick={(a) => handleAnnotationClick(article.id, a)}
                                                    onWordClick={(lemma) => setActiveDictionaryLemma(lemma)}
                                                />

                                                {active && (
                                                    <AnnotationPopup
                                                        annotation={active}
                                                        isSaved={savedLemmas.has(active.lemma)}
                                                        onSave={() => handleSaveWord(article, active)}
                                                    />
                                                )}

                                                <div className="flex items-center justify-between pt-2">
                                                    <Button
                                                        variant={learned ? "secondary" : "primary"}
                                                        className="text-sm px-4 py-2"
                                                        disabled={updatingId === article.id}
                                                        onClick={() => toggleLearned(article)}
                                                    >
                                                        {updatingId === article.id
                                                            ? "Saving..."
                                                            : learned
                                                                ? "Mark as not learned"
                                                                : "Mark as learned"}
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        className="text-sm px-4 py-2"
                                                        onClick={() => setFlowOpenFor(article.id)}
                                                    >
                                                        Finish reading
                                                    </Button>
                                                </div>
                                            </>
                                        )}

                                        {inFlow && (
                                            <ArticleFlow
                                                article={article}
                                                tappedLemmas={tappedLemmas}
                                                savedLemmas={savedLemmas}
                                                onSaveWord={(a) => handleSaveWord(article, a)}
                                                onReset={() => setFlowOpenFor(null)}
                                                onGoToArticle={goToArticle}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                            No reading articles found.
                        </div>
                    )}
                </div>
            </div>
            <DictionaryPanel activeLemma={activeDictionaryLemma} onClose={() => setActiveDictionaryLemma(null)} />
            <ToastContainer />
        </div>
    );
}
