"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import useAuthStore from "@/store/useAuthStore";
import { getReadingArticles } from "@/services/readingService";
import {
    generateReadingArticle,
    createReadingArticle,
    updateReadingArticle,
    deleteReadingArticle,
    suggestVocabulary,
    suggestAnnotations,
    generateQuiz,
    getArticleQuizForAdmin,
} from "@/services/adminReadingService";
import { Annotation, AnnotationType, KeyVocabularyItem, ReadingArticle, ReadingQuizQuestion, ReadingQuizQuestionType } from "@/types/reading";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ANNOTATION_TYPES: AnnotationType[] = ["WORD", "NOMEN_VERB_VERBINDUNG", "REDEWENDUNG"];
const QUIZ_TYPES: ReadingQuizQuestionType[] = [
    "HAUPTIDEE",
    "DETAIL",
    "VOCAB_CONTEXT",
    "INFERENCE",
    "RICHTIG_FALSCH_NICHT_IM_TEXT",
];

type Mode = "generate" | "paste";

const emptyManualForm = { title: "", topic: "", level: "A2", content: "", linkedGroupId: "" };

const emptyAnnotation = (): Annotation => ({
    id: crypto.randomUUID(),
    spans: [],
    surfaceText: "",
    type: "WORD",
    lemma: "",
    pos: null,
    gender: null,
    pluralForm: null,
    translationEn: "",
    literalTranslation: null,
    cefrLevel: "A2",
    exampleSentence: "",
    known: false,
});

const emptyQuizQuestion = (): ReadingQuizQuestion => ({
    id: "",
    type: "DETAIL",
    prompt: "",
    options: [],
    correctAnswer: "",
    relatedAnnotationId: null,
    explanation: "",
    supportingSentence: "",
    minLevel: "A1",
});

export default function AdminReadingPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [articles, setArticles] = useState<ReadingArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [mode, setMode] = useState<Mode>("generate");

    const [genTopic, setGenTopic] = useState("");
    const [genLevel, setGenLevel] = useState("A2");

    const [manualForm, setManualForm] = useState(emptyManualForm);
    const [manualVocab, setManualVocab] = useState<KeyVocabularyItem[]>([]);
    const [manualAnnotations, setManualAnnotations] = useState<Annotation[]>([]);
    const [manualQuiz, setManualQuiz] = useState<ReadingQuizQuestion[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isSuggestingAnnotations, setIsSuggestingAnnotations] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

    const [editingArticle, setEditingArticle] = useState<ReadingArticle | null>(null);

    const fetchArticles = useCallback(() => {
        setIsLoading(true);
        getReadingArticles()
            .then((res) => setArticles(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load reading articles."))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchArticles();
    }, [hasHydrated, userProfile, router, fetchArticles]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const resetManualForm = () => {
        setManualForm(emptyManualForm);
        setManualVocab([]);
        setManualAnnotations([]);
        setManualQuiz([]);
        setEditingArticle(null);
    };

    const submitGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!genTopic.trim()) {
            toast.error("Please enter a topic.");
            return;
        }
        setIsSaving(true);
        generateReadingArticle({ topic: genTopic, level: genLevel })
            .then(() => {
                toast.success("Article generated. Edit it to add annotations and a quiz.");
                setGenTopic("");
                fetchArticles();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to generate article."))
            .finally(() => setIsSaving(false));
    };

    const runSuggestVocabulary = () => {
        if (!manualForm.content.trim()) {
            toast.error("Paste the article content first.");
            return;
        }
        setIsSuggesting(true);
        suggestVocabulary({ content: manualForm.content, level: manualForm.level })
            .then((res) => {
                setManualVocab(res.data);
                toast.success("Vocabulary suggested — review before saving.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to suggest vocabulary."))
            .finally(() => setIsSuggesting(false));
    };

    const runSuggestAnnotations = () => {
        if (!manualForm.content.trim()) {
            toast.error("Paste the article content first.");
            return;
        }
        setIsSuggestingAnnotations(true);
        suggestAnnotations({ content: manualForm.content, level: manualForm.level })
            .then((res) => {
                setManualAnnotations(res.data);
                toast.success("Annotations suggested — review before saving.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to suggest annotations."))
            .finally(() => setIsSuggestingAnnotations(false));
    };

    const runGenerateQuiz = () => {
        if (!manualForm.content.trim()) {
            toast.error("Paste the article content first.");
            return;
        }
        setIsGeneratingQuiz(true);
        generateQuiz({ content: manualForm.content, level: manualForm.level, annotations: manualAnnotations })
            .then((res) => {
                setManualQuiz(res.data);
                toast.success("Quiz generated — review before saving.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to generate quiz."))
            .finally(() => setIsGeneratingQuiz(false));
    };

    const updateVocabItem = (idx: number, field: "word" | "meaning", value: string) => {
        setManualVocab((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
    };
    const removeVocabItem = (idx: number) => setManualVocab((prev) => prev.filter((_, i) => i !== idx));
    const addVocabItem = () => setManualVocab((prev) => [...prev, { word: "", meaning: "" }]);

    const updateAnnotation = (idx: number, field: keyof Annotation, value: string) => {
        setManualAnnotations((prev) =>
            prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
        );
    };
    const removeAnnotation = (idx: number) => setManualAnnotations((prev) => prev.filter((_, i) => i !== idx));
    const addAnnotation = () => setManualAnnotations((prev) => [...prev, emptyAnnotation()]);

    const updateQuizQuestion = (idx: number, field: keyof ReadingQuizQuestion, value: string) => {
        setManualQuiz((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
    };
    const updateQuizOptions = (idx: number, value: string) => {
        setManualQuiz((prev) =>
            prev.map((q, i) => (i === idx ? { ...q, options: value.split(";").map((o) => o.trim()) } : q))
        );
    };
    const updateRelatedAnnotation = (idx: number, annotationId: string) => {
        setManualQuiz((prev) =>
            prev.map((q, i) => (i === idx ? { ...q, relatedAnnotationId: annotationId || null } : q))
        );
    };
    const removeQuizQuestion = (idx: number) => setManualQuiz((prev) => prev.filter((_, i) => i !== idx));
    const addQuizQuestion = () => setManualQuiz((prev) => [...prev, emptyQuizQuestion()]);

    const startEdit = (article: ReadingArticle) => {
        setEditingArticle(article);
        setManualForm({
            title: article.title,
            topic: article.topic,
            level: article.level,
            content: article.content,
            linkedGroupId: article.linkedGroupId ?? "",
        });
        setManualVocab(article.keyVocabulary);
        setManualAnnotations(article.annotations ?? []);
        setManualQuiz([]);
        setMode("paste");

        getArticleQuizForAdmin(article.id)
            .then((res) => setManualQuiz(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load existing quiz."));
    };

    const submitManual = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualForm.title.trim() || !manualForm.content.trim()) {
            toast.error("Title and content are required.");
            return;
        }

        const payload = {
            title: manualForm.title,
            topic: manualForm.topic,
            level: manualForm.level,
            content: manualForm.content,
            keyVocabulary: manualVocab.filter((v) => v.word.trim() && v.meaning.trim()),
            annotations: manualAnnotations.filter((a) => a.surfaceText.trim() && a.lemma.trim()),
            quiz: manualQuiz
                .filter((q) => q.prompt.trim() && q.correctAnswer.trim())
                .map((q) => ({ ...q, options: (q.options ?? []).map((o) => o.trim()).filter(Boolean) })),
            linkedGroupId: manualForm.linkedGroupId.trim() || null,
        };

        setIsSaving(true);
        const request = editingArticle
            ? updateReadingArticle(editingArticle.id, payload)
            : createReadingArticle(payload);

        request
            .then(() => {
                toast.success(editingArticle ? "Article updated." : "Article saved.");
                resetManualForm();
                fetchArticles();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save article."))
            .finally(() => setIsSaving(false));
    };

    const removeArticle = (article: ReadingArticle) => {
        if (!confirm(`Delete "${article.title}"?`)) return;
        deleteReadingArticle(article.id)
            .then(() => {
                toast.success("Article deleted.");
                fetchArticles();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete article."));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reading Articles</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Generate an article with AI, or paste in one you already have.
                </p>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex gap-2 mb-6">
                        <Button
                            type="button"
                            variant={mode === "generate" ? "primary" : "secondary"}
                            className="text-sm px-4 py-2"
                            onClick={() => setMode("generate")}
                        >
                            Generate with AI
                        </Button>
                        <Button
                            type="button"
                            variant={mode === "paste" ? "primary" : "secondary"}
                            className="text-sm px-4 py-2"
                            onClick={() => setMode("paste")}
                        >
                            Paste article
                        </Button>
                    </div>

                    {mode === "generate" ? (
                        <form onSubmit={submitGenerate} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Topic</label>
                                <Input
                                    value={genTopic}
                                    onChange={(e) => setGenTopic(e.target.value)}
                                    placeholder="e.g. Ein Wochenende in Berlin"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Level</label>
                                <select
                                    value={genLevel}
                                    onChange={(e) => setGenLevel(e.target.value)}
                                    className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {LEVELS.map((lvl) => (
                                        <option key={lvl} value={lvl}>
                                            {lvl}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button variant="primary" type="submit" disabled={isSaving}>
                                {isSaving ? "Generating..." : "Generate article"}
                            </Button>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                After generating, use &quot;Edit&quot; on the article below to add annotations and a
                                quiz.
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={submitManual} className="space-y-6">
                            {editingArticle && (
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    Editing &quot;{editingArticle.title}&quot; —{" "}
                                    <button type="button" className="underline" onClick={resetManualForm}>
                                        cancel
                                    </button>
                                </p>
                            )}
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Title</label>
                                <Input
                                    value={manualForm.title}
                                    onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                                    placeholder="Article title"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Topic</label>
                                <Input
                                    value={manualForm.topic}
                                    onChange={(e) => setManualForm({ ...manualForm, topic: e.target.value })}
                                    placeholder="Short topic label"
                                    required={false}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Level</label>
                                <select
                                    value={manualForm.level}
                                    onChange={(e) => setManualForm({ ...manualForm, level: e.target.value })}
                                    className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {LEVELS.map((lvl) => (
                                        <option key={lvl} value={lvl}>
                                            {lvl}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                    Linked group ID (optional)
                                </label>
                                <Input
                                    value={manualForm.linkedGroupId}
                                    onChange={(e) => setManualForm({ ...manualForm, linkedGroupId: e.target.value })}
                                    placeholder="e.g. berlin-weekend-story"
                                    required={false}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Give a simplified article and its authentic version the same group ID so the
                                    adaptive difficulty loop can suggest the authentic one after strong scores.
                                </p>
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                    Article text
                                </label>
                                <textarea
                                    value={manualForm.content}
                                    onChange={(e) => setManualForm({ ...manualForm, content: e.target.value })}
                                    placeholder="Paste the article text here"
                                    rows={8}
                                    className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-gray-700 dark:text-gray-300 text-sm">Key vocabulary</label>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="text-xs px-3 py-1"
                                        disabled={isSuggesting}
                                        onClick={runSuggestVocabulary}
                                    >
                                        {isSuggesting ? "Suggesting..." : "Suggest vocabulary"}
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {manualVocab.map((v, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <Input
                                                value={v.word}
                                                onChange={(e) => updateVocabItem(idx, "word", e.target.value)}
                                                placeholder="Word"
                                                required={false}
                                                className="flex-1"
                                            />
                                            <Input
                                                value={v.meaning}
                                                onChange={(e) => updateVocabItem(idx, "meaning", e.target.value)}
                                                placeholder="Meaning"
                                                required={false}
                                                className="flex-[2]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeVocabItem(idx)}
                                                className="text-red-500 text-sm px-2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="text-xs px-3 py-1"
                                        onClick={addVocabItem}
                                    >
                                        + Add word
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-gray-700 dark:text-gray-300 text-sm">
                                        Annotations (words, Nomen-Verb-Verbindungen, Redewendungen)
                                    </label>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="text-xs px-3 py-1"
                                        disabled={isSuggestingAnnotations}
                                        onClick={runSuggestAnnotations}
                                    >
                                        {isSuggestingAnnotations ? "Suggesting..." : "Suggest annotations"}
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {manualAnnotations.map((a, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2"
                                        >
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <select
                                                    value={a.type}
                                                    onChange={(e) => updateAnnotation(idx, "type", e.target.value)}
                                                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                                >
                                                    {ANNOTATION_TYPES.map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Input
                                                    value={a.surfaceText}
                                                    onChange={(e) => updateAnnotation(idx, "surfaceText", e.target.value)}
                                                    placeholder="Surface text (as in article)"
                                                    required={false}
                                                    className="flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeAnnotation(idx)}
                                                    className="text-red-500 text-sm px-2"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                <Input
                                                    value={a.lemma}
                                                    onChange={(e) => updateAnnotation(idx, "lemma", e.target.value)}
                                                    placeholder="Lemma (dictionary form)"
                                                    required={false}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    value={a.translationEn ?? ""}
                                                    onChange={(e) => updateAnnotation(idx, "translationEn", e.target.value)}
                                                    placeholder="Translation"
                                                    required={false}
                                                    className="flex-1"
                                                />
                                            </div>
                                            {a.type === "WORD" && (
                                                <div className="flex gap-2 flex-wrap">
                                                    <select
                                                        value={a.gender ?? ""}
                                                        onChange={(e) => updateAnnotation(idx, "gender", e.target.value)}
                                                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                                    >
                                                        <option value="">no gender</option>
                                                        <option value="der">der</option>
                                                        <option value="die">die</option>
                                                        <option value="das">das</option>
                                                    </select>
                                                    <Input
                                                        value={a.pluralForm ?? ""}
                                                        onChange={(e) => updateAnnotation(idx, "pluralForm", e.target.value)}
                                                        placeholder="Plural form"
                                                        required={false}
                                                        className="flex-1"
                                                    />
                                                </div>
                                            )}
                                            {a.type === "REDEWENDUNG" && (
                                                <Input
                                                    value={a.literalTranslation ?? ""}
                                                    onChange={(e) =>
                                                        updateAnnotation(idx, "literalTranslation", e.target.value)
                                                    }
                                                    placeholder="Literal translation"
                                                    required={false}
                                                />
                                            )}
                                            <Input
                                                value={a.exampleSentence ?? ""}
                                                onChange={(e) => updateAnnotation(idx, "exampleSentence", e.target.value)}
                                                placeholder="Example sentence (from the article)"
                                                required={false}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="text-xs px-3 py-1"
                                        onClick={addAnnotation}
                                    >
                                        + Add annotation
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-gray-700 dark:text-gray-300 text-sm">
                                        Quiz (5 questions recommended)
                                    </label>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="text-xs px-3 py-1"
                                        disabled={isGeneratingQuiz}
                                        onClick={runGenerateQuiz}
                                    >
                                        {isGeneratingQuiz ? "Generating..." : "Generate quiz"}
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {manualQuiz.map((q, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2"
                                        >
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <select
                                                    value={q.type}
                                                    onChange={(e) => updateQuizQuestion(idx, "type", e.target.value)}
                                                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                                >
                                                    {QUIZ_TYPES.map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuizQuestion(idx)}
                                                    className="text-red-500 text-sm px-2 ml-auto"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <Input
                                                value={q.prompt}
                                                onChange={(e) => updateQuizQuestion(idx, "prompt", e.target.value)}
                                                placeholder="Question prompt"
                                                required={false}
                                            />
                                            <Input
                                                value={(q.options ?? []).join("; ")}
                                                onChange={(e) => updateQuizOptions(idx, e.target.value)}
                                                placeholder="Options, separated by ;"
                                                required={false}
                                            />
                                            {q.type === "VOCAB_CONTEXT" && (
                                                <select
                                                    value={q.relatedAnnotationId ?? ""}
                                                    onChange={(e) => updateRelatedAnnotation(idx, e.target.value)}
                                                    className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                                >
                                                    <option value="">No related word (won&apos;t suggest saving on a miss)</option>
                                                    {manualAnnotations
                                                        .filter((a) => a.lemma.trim())
                                                        .map((a) => (
                                                            <option key={a.id} value={a.id}>
                                                                {a.lemma}
                                                            </option>
                                                        ))}
                                                </select>
                                            )}
                                            <Input
                                                value={q.correctAnswer}
                                                onChange={(e) => updateQuizQuestion(idx, "correctAnswer", e.target.value)}
                                                placeholder="Correct answer (must match an option exactly)"
                                                required={false}
                                            />
                                            <Input
                                                value={q.explanation}
                                                onChange={(e) => updateQuizQuestion(idx, "explanation", e.target.value)}
                                                placeholder="Explanation (shown after answering)"
                                                required={false}
                                            />
                                            <Input
                                                value={q.supportingSentence}
                                                onChange={(e) =>
                                                    updateQuizQuestion(idx, "supportingSentence", e.target.value)
                                                }
                                                placeholder="Supporting sentence from the article"
                                                required={false}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="text-xs px-3 py-1"
                                        onClick={addQuizQuestion}
                                    >
                                        + Add question
                                    </Button>
                                </div>
                            </div>

                            <Button variant="primary" type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : editingArticle ? "Save changes" : "Save article"}
                            </Button>
                        </form>
                    )}
                </div>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">
                        Existing articles
                    </h2>
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading articles...</div>
                    ) : (
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                    <tr>
                                        <th className="px-6 py-3">Title</th>
                                        <th className="px-6 py-3">Level</th>
                                        <th className="px-6 py-3">Vocabulary</th>
                                        <th className="px-6 py-3">Annotations</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {articles.map((article) => (
                                        <tr key={article.id}>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                {article.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary">{article.level}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {article.keyVocabulary.length} words
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {article.annotations?.length ?? 0}
                                            </td>
                                            <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                                <Button
                                                    variant="secondary"
                                                    className="px-3 py-1 text-sm"
                                                    onClick={() => startEdit(article)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="px-3 py-1 text-sm"
                                                    onClick={() => removeArticle(article)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {articles.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                No reading articles found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isSaving && <Loading message="Please wait..." />}
            <ToastContainer />
        </div>
    );
}
