"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import { getGrammarLessonById, setLearningProgress } from "@/services/grammarService";
import { GrammarLesson, QuizQuestion } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import { useI18n } from "@/componenets/I18nProvider";
import { resolveUploadUrlsInHtml } from "@/lib/backendOrigin";
import { isTranslatableLevel, localizedLessonText, localizedQuestionText } from "@/lib/grammarLocalization";
import { AppLanguage } from "@/lib/i18n/translations";

type QuizPhase = "idle" | "active" | "results";

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

function isCorrect(question: QuizQuestion, selected: string): boolean {
    if (typeof question.answer === "boolean") {
        return normalize(selected) === (question.answer ? "true" : "false");
    }
    return normalize(selected) === normalize(question.answer);
}

function QuizSection({
    quiz,
    lessonLevel,
    language,
}: Readonly<{ quiz: QuizQuestion[]; lessonLevel: string; language: AppLanguage }>) {
    const { t } = useI18n();
    const [phase, setPhase] = useState<QuizPhase>("idle");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);

    if (quiz.length === 0) return null;

    const beginQuiz = () => {
        setCurrentIndex(0);
        setSelectedAnswer("");
        setSubmitted(false);
        setCorrectCount(0);
        setPhase("active");
    };

    const question = quiz[currentIndex];
    const localizedQuestion = localizedQuestionText(question, lessonLevel, language);
    const correct = submitted && isCorrect(question, selectedAnswer);

    const submitAnswer = () => {
        setSubmitted(true);
        if (isCorrect(question, selectedAnswer)) {
            setCorrectCount((c) => c + 1);
        }
    };

    const nextQuestion = () => {
        if (currentIndex + 1 >= quiz.length) {
            setPhase("results");
            return;
        }
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer("");
        setSubmitted(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.grammar.exercises}</h2>

            {phase === "idle" && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t.grammar.checkUnderstanding(quiz.length)}
                    </p>
                    <Button variant="primary" className="text-sm px-4 py-2" onClick={beginQuiz}>
                        {t.grammar.startExercises}
                    </Button>
                </div>
            )}

            {phase === "active" && (
                <div className="space-y-3" dir={localizedQuestion.dir}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.grammar.questionOf(currentIndex + 1, quiz.length)}
                    </p>
                    {localizedQuestion.title && (
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            {localizedQuestion.title}
                        </p>
                    )}
                    <p className="font-medium text-gray-900 dark:text-white">{localizedQuestion.question}</p>

                    {question.type === "mcq" && (
                        <div className="space-y-2">
                            {(question.options ?? []).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    disabled={submitted}
                                    onClick={() => setSelectedAnswer(option)}
                                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                                        selectedAnswer === option
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {question.type === "truefalse" && (
                        <div className="flex gap-2">
                            {[
                                { value: "True", label: t.grammar.true },
                                { value: "False", label: t.grammar.false },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={submitted}
                                    onClick={() => setSelectedAnswer(option.value)}
                                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                                        selectedAnswer === option.value
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {question.type === "fill" && (
                        <input
                            type="text"
                            value={selectedAnswer}
                            disabled={submitted}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            placeholder={t.grammar.typeAnswer}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    )}

                    {submitted && (
                        <div
                            className={`rounded-lg p-3 text-sm ${
                                correct
                                    ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                    : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            }`}
                        >
                            <p className="font-semibold">{correct ? t.grammar.correct : t.grammar.incorrect}</p>
                            {!correct && (
                                <p>
                                    {t.grammar.correctAnswer}
                                    <span className="font-medium">
                                        {typeof question.answer === "boolean"
                                            ? question.answer
                                                ? t.grammar.true
                                                : t.grammar.false
                                            : question.answer}
                                    </span>
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        {submitted ? (
                            <Button variant="primary" className="text-sm px-4 py-2" onClick={nextQuestion}>
                                {currentIndex + 1 >= quiz.length ? t.grammar.seeResults : t.grammar.nextQuestion}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                className="text-sm px-4 py-2"
                                disabled={!selectedAnswer}
                                onClick={submitAnswer}
                            >
                                {t.grammar.submitAnswer}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {phase === "results" && (
                <div className="space-y-3">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t.grammar.resultsScore(correctCount, quiz.length)}
                    </p>
                    <Button variant="secondary" className="text-sm px-4 py-2" onClick={beginQuiz}>
                        {t.grammar.retry}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function GrammarLessonDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <GrammarLessonDetailContent />
        </Suspense>
    );
}

function GrammarLessonDetailContent() {
    const searchParams = useSearchParams();
    const lessonId = searchParams.get("id") ?? "";
    const { language, t } = useI18n();
    const [lesson, setLesson] = useState<GrammarLesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingLearned, setUpdatingLearned] = useState(false);

    useEffect(() => {
        if (!lessonId) return;
        getGrammarLessonById(lessonId)
            .then((res) => setLesson(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load this lesson."))
            .finally(() => setLoading(false));
    }, [lessonId]);

    if (!lessonId) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    {t.grammar.noLesson}{" "}
                    <Link href="/dashboard/grammar" className="underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) return <Loading />;

    if (!lesson) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    {t.grammar.notFoundLesson}{" "}
                    <Link href="/dashboard/grammar" className="underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    const learned = lesson.learningProgresses?.some((lp) => lp.learned === true) ?? false;
    const localized = localizedLessonText(lesson, language);
    const isTranslatable = isTranslatableLevel(lesson.level);

    const toggleLearned = () => {
        setUpdatingLearned(true);
        setLearningProgress({ lessonId: lesson.id, learned: !learned })
            .then(() => {
                setLesson((prev) =>
                    prev ? { ...prev, learningProgresses: [{ id: "local", learned: !learned }] } : prev
                );
                toast.success(!learned ? t.grammar.markedLearned : t.grammar.markedNotLearned);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setUpdatingLearned(false));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link
                    href="/dashboard/grammar"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
                >
                    {t.grammar.back}
                </Link>
                {language === "fa" && !isTranslatable && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.grammar.notTranslatable}</p>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4" dir={localized.dir}>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{localized.title}</h1>
                        <Badge variant="secondary">{lesson.level}</Badge>
                        {learned && <Badge variant="default">{t.grammar.learned}</Badge>}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300">{localized.summary}</p>

                    <div
                        className="text-gray-800 dark:text-gray-200 leading-relaxed [&_p]:my-1 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold"
                        dangerouslySetInnerHTML={{ __html: resolveUploadUrlsInHtml(localized.content) }}
                    />

                    {lesson.videoLink && (
                        <div className="pt-1">
                            <a
                                href={lesson.videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {t.grammar.watchVideo}
                            </a>
                        </div>
                    )}

                    {localized.example && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t.grammar.example}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">{localized.example}</span>
                        </div>
                    )}

                    {localized.usageTips && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                {t.grammar.usageTip}
                            </span>
                            <span className="text-blue-700 dark:text-blue-300">{localized.usageTips}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            variant={learned ? "secondary" : "primary"}
                            className="text-sm px-4 py-2"
                            disabled={updatingLearned}
                            onClick={toggleLearned}
                        >
                            {updatingLearned
                                ? t.grammar.saving
                                : learned
                                ? t.grammar.markNotLearned
                                : t.grammar.markLearned}
                        </Button>
                    </div>
                </div>

                <QuizSection quiz={lesson.quiz ?? []} lessonLevel={lesson.level} language={language} />
            </div>
            <ToastContainer />
        </div>
    );
}
