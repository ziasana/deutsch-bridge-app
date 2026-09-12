"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import { getReadingArticleById } from "@/services/readingService";
import { setLearningProgress } from "@/services/grammarService";
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
} from "@/types/reading";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import DictionaryPanel from "@/componenets/DictionaryPanel";
import { getArticleImageSrc } from "@/lib/readingImages";

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

function GlossarySection({
    article,
    savedLemmas,
    onSave,
}: Readonly<{
    article: ReadingArticle;
    savedLemmas: Set<string>;
    onSave: (annotation: Annotation) => void;
}>) {
    const glossary = useMemo(() => {
        const byWord = new Map<string, KeyVocabularyItem>();
        for (const v of article.keyVocabulary) {
            if (!byWord.has(v.word)) byWord.set(v.word, v);
        }
        return Array.from(byWord.values()).sort((a, b) => a.word.localeCompare(b.word));
    }, [article.keyVocabulary]);

    if (glossary.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Key vocabulary</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                The key words for this article.
            </p>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {glossary.map((v) => (
                    <li key={v.word} className="py-3 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <span className="font-semibold text-gray-900 dark:text-white">{v.word}</span>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{v.meaning}</p>
                        </div>
                        <Button
                            variant={savedLemmas.has(v.word) ? "secondary" : "primary"}
                            className="text-xs px-3 py-1 shrink-0"
                            disabled={savedLemmas.has(v.word)}
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
                            {savedLemmas.has(v.word) ? "Saved ✓" : "Save"}
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
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
                    setPhase("results");
                })
                .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to finish quiz."));
            return;
        }
        setQuiz({ ...quiz, currentIndex: quiz.currentIndex + 1, selectedAnswer: "", feedback: null });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quiz</h2>

            {phase === "idle" && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Ready to check your understanding? Start the quiz for this article.
                    </p>
                    <Button variant="primary" className="text-sm px-4 py-2" disabled={starting} onClick={beginQuiz}>
                        {starting ? "Loading quiz..." : "Start quiz"}
                    </Button>
                </div>
            )}

            {phase === "active" && quiz && (() => {
                const question = quiz.questions[quiz.currentIndex];
                if (!question) {
                    return <p className="text-sm text-gray-500 dark:text-gray-400">This article has no quiz yet.</p>;
                }
                return (
                    <div className="space-y-3">
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
            })()}

            {phase === "results" && results && (
                <div className="space-y-3">
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
                                onClick={() => router.push(`/dashboard/reading/article?id=${results.recommendation.suggestedArticleId}`)}
                            >
                                {results.recommendation.suggestedTitle ?? "Go to article"} →
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function formatPostedDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function ReadingArticleDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ReadingArticleDetailContent />
        </Suspense>
    );
}

function ReadingArticleDetailContent() {
    const searchParams = useSearchParams();
    const articleId = searchParams.get("id") ?? "";
    const [article, setArticle] = useState<ReadingArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingLearned, setUpdatingLearned] = useState(false);
    const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
    const [tappedLemmas, setTappedLemmas] = useState<Set<string>>(new Set());
    const [savedLemmas, setSavedLemmas] = useState<Set<string>>(new Set());
    const [activeDictionaryLemma, setActiveDictionaryLemma] = useState<string | null>(null);

    useEffect(() => {
        if (!articleId) return;
        getReadingArticleById(articleId)
            .then((res) => setArticle(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load this article."))
            .finally(() => setLoading(false));
    }, [articleId]);

    if (!articleId) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    No article selected.{" "}
                    <Link href="/dashboard/reading" className="underline">
                        Back to Reading
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) return <Loading />;

    if (!article) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    Article not found.{" "}
                    <Link href="/dashboard/reading" className="underline">
                        Back to Reading
                    </Link>
                </div>
            </div>
        );
    }

    const learned = article.learningProgresses?.some((lp) => lp.learned === true) ?? false;

    const toggleLearned = () => {
        setUpdatingLearned(true);
        setLearningProgress({ readingId: article.id, learned: !learned })
            .then(() => {
                setArticle((prev) =>
                    prev ? { ...prev, learningProgresses: [{ id: "local", learned: !learned }] } : prev
                );
                toast.success(!learned ? "Marked as learned!" : "Marked as not learned.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setUpdatingLearned(false));
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
                toast.success(`Saved "${annotation.lemma}" to your review list.`);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save word."));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link
                    href="/dashboard/reading"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
                >
                    ← Back to Reading
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    <img
                        src={getArticleImageSrc(article.imageUrl, article.level)}
                        alt=""
                        className="w-full h-56 object-cover"
                    />
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{article.title}</h1>
                            <Badge variant="secondary">{article.level}</Badge>
                            {learned && <Badge variant="default">Learned</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>👁 {article.viewCount} views</span>
                            <span>Posted {formatPostedDate(article.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">{article.topic}</p>

                        <ArticleContent
                            content={article.content}
                            tokens={article.tokens ?? []}
                            annotations={article.annotations}
                            activeAnnotationId={activeAnnotation?.id ?? null}
                            tappedLemmas={tappedLemmas}
                            onAnnotationClick={handleAnnotationClick}
                            onWordClick={(lemma) => setActiveDictionaryLemma(lemma)}
                        />

                        {activeAnnotation && (
                            <AnnotationPopup
                                annotation={activeAnnotation}
                                isSaved={savedLemmas.has(activeAnnotation.lemma)}
                                onSave={() => handleSaveWord(activeAnnotation)}
                            />
                        )}

                        <div className="pt-2">
                            <Button
                                variant={learned ? "secondary" : "primary"}
                                className="text-sm px-4 py-2"
                                disabled={updatingLearned}
                                onClick={toggleLearned}
                            >
                                {updatingLearned ? "Saving..." : learned ? "Mark as not learned" : "Mark as learned"}
                            </Button>
                        </div>
                    </div>
                </div>

                <GlossarySection article={article} savedLemmas={savedLemmas} onSave={handleSaveWord} />

                <QuizSection
                    article={article}
                    tappedLemmas={tappedLemmas}
                    savedLemmas={savedLemmas}
                    onSaveWord={handleSaveWord}
                />
            </div>
            <DictionaryPanel activeLemma={activeDictionaryLemma} onClose={() => setActiveDictionaryLemma(null)} />
            <ToastContainer />
        </div>
    );
}
