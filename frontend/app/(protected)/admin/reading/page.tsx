"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
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
    uploadReadingArticleImage,
    bulkImportReadingArticles,
} from "@/services/adminReadingService";
import {
    Annotation,
    AnnotationType,
    KeyVocabularyItem,
    ReadingArticle,
    ReadingArticleBulkImportResult,
    ReadingQuizQuestion,
    ReadingQuizQuestionType,
} from "@/types/reading";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import { getArticleImageSrc } from "@/lib/readingImages";
import {
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Upload,
    CheckCircle2,
    XCircle,
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type SortKey = "title" | "level" | "vocabulary" | "annotations";
type SortDirection = "asc" | "desc";

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

const emptyManualForm = {
    title: "",
    topic: "",
    level: "A2",
    content: "",
    linkedGroupId: "",
    imageUrl: null as string | null,
};

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
    const queryClient = useQueryClient();

    const ARTICLES_KEY = ["admin", "reading", "articles"];

    const { data: articles = [], isLoading, error: articlesError } = useQuery({
        queryKey: ARTICLES_KEY,
        queryFn: () => getReadingArticles().then((res) => res.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<ReadingArticle | null>(null);

    const [tableSearch, setTableSearch] = useState("");
    const [tablePageSize, setTablePageSize] = useState(10);
    const [tablePage, setTablePage] = useState(1);
    const [sortKey, setSortKey] = useState<SortKey>("title");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const [mode, setMode] = useState<Mode>("generate");

    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [bulkResult, setBulkResult] = useState<ReadingArticleBulkImportResult | null>(null);

    const [genTopic, setGenTopic] = useState("");
    const [genLevel, setGenLevel] = useState("A2");

    const [manualForm, setManualForm] = useState(emptyManualForm);
    const [manualVocab, setManualVocab] = useState<KeyVocabularyItem[]>([]);
    const [manualAnnotations, setManualAnnotations] = useState<Annotation[]>([]);
    const [manualQuiz, setManualQuiz] = useState<ReadingQuizQuestion[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isSuggestingAnnotations, setIsSuggestingAnnotations] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

    const [editingArticle, setEditingArticle] = useState<ReadingArticle | null>(null);

    const invalidateArticles = () => queryClient.invalidateQueries({ queryKey: ARTICLES_KEY });

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [hasHydrated, userProfile, router]);

    useEffect(() => {
        if (articlesError) {
            const err = articlesError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load reading articles.");
        }
    }, [articlesError]);

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
                invalidateArticles();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to generate article."))
            .finally(() => setIsSaving(false));
    };

    const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setIsUploadingImage(true);
        uploadReadingArticleImage(file)
            .then((res) => {
                setManualForm((prev) => ({ ...prev, imageUrl: res.data.url }));
                toast.success("Image uploaded.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to upload image."))
            .finally(() => setIsUploadingImage(false));
    };

    const removeImage = () => setManualForm((prev) => ({ ...prev, imageUrl: "" }));

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
            imageUrl: article.imageUrl,
        });
        setManualVocab(article.keyVocabulary);
        setManualAnnotations(article.annotations ?? []);
        setManualQuiz([]);
        setMode("paste");

        getArticleQuizForAdmin(article.id)
            .then((res) => setManualQuiz(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load existing quiz."));
    };

    const handleBulkFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        file.text()
            .then((text) => setBulkText(text))
            .catch(() => toast.error("Failed to read the file."));
    };

    const runBulkImport = () => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(bulkText);
        } catch {
            toast.error("Invalid JSON - check the syntax and try again.");
            return;
        }
        if (!Array.isArray(parsed) || parsed.length === 0) {
            toast.error("Expected a non-empty JSON array of articles.");
            return;
        }

        setIsBulkImporting(true);
        setBulkResult(null);
        bulkImportReadingArticles(parsed)
            .then((res) => {
                setBulkResult(res.data);
                if (res.data.successCount > 0) invalidateArticles();
                if (res.data.failureCount === 0) {
                    toast.success(`Imported ${res.data.successCount} articles.`);
                } else {
                    toast.error(`${res.data.successCount} imported, ${res.data.failureCount} failed - see details below.`);
                }
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Bulk import failed."))
            .finally(() => setIsBulkImporting(false));
    };

    const closeBulkImport = () => {
        setShowBulkImport(false);
        setBulkText("");
        setBulkResult(null);
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
            imageUrl: manualForm.imageUrl,
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
                invalidateArticles();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save article."))
            .finally(() => setIsSaving(false));
    };

    const removeArticle = (article: ReadingArticle) => setArticleToDelete(article);

    const confirmRemoveArticle = () => {
        const article = articleToDelete;
        if (!article) return;
        setArticleToDelete(null);
        deleteReadingArticle(article.id)
            .then(() => {
                toast.success("Article deleted.");
                invalidateArticles();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete article."));
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
        setTablePage(1);
    };

    const tableQuery = tableSearch.trim().toLowerCase();
    const filteredArticles = tableQuery
        ? articles.filter(
              (a) => a.title.toLowerCase().includes(tableQuery) || a.topic.toLowerCase().includes(tableQuery)
          )
        : articles;

    const sortValueFor = (article: ReadingArticle) => {
        switch (sortKey) {
            case "title":
                return article.title.toLowerCase();
            case "level":
                return article.level;
            case "vocabulary":
                return article.keyVocabulary.length;
            case "annotations":
                return article.annotations?.length ?? 0;
        }
    };

    const sortedArticles = filteredArticles.slice().sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        const va = sortValueFor(a);
        const vb = sortValueFor(b);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });

    const tableTotalPages = Math.max(1, Math.ceil(sortedArticles.length / tablePageSize));
    const tableCurrentPage = Math.min(tablePage, tableTotalPages);
    const tableStartIndex = sortedArticles.length === 0 ? 0 : (tableCurrentPage - 1) * tablePageSize + 1;
    const tableEndIndex = Math.min(tableCurrentPage * tablePageSize, sortedArticles.length);
    const paginatedArticles = sortedArticles.slice((tableCurrentPage - 1) * tablePageSize, tableCurrentPage * tablePageSize);

    const tablePageNumbers = Array.from({ length: tableTotalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === tableTotalPages || Math.abs(p - tableCurrentPage) <= 1
    );

    const renderSortIcon = (column: SortKey) => {
        if (sortKey !== column) return <ArrowUpDown className="size-3.5 opacity-40" />;
        return sortDirection === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reading Articles</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Generate an article with AI, or paste in one you already have.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex items-center gap-2"
                        onClick={() => setShowBulkImport((prev) => !prev)}
                    >
                        <Upload className="size-4" />
                        Bulk upload
                    </Button>
                </div>

                {showBulkImport && (
                    <div className="mt-6 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk upload</h2>
                            <button
                                type="button"
                                className="text-sm text-gray-500 dark:text-gray-400 underline"
                                onClick={closeBulkImport}
                            >
                                Close
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Paste or upload a JSON array of reading articles, in the same shape as the form below.
                            Each row is imported independently - a mistake in one row won&apos;t block the rest.
                            Required fields per row: <code>title</code>, <code>level</code>{" "}
                            (<code>A1</code>-<code>C2</code>), <code>content</code>.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <code>annotations[].type</code> must be one of:{" "}
                            {ANNOTATION_TYPES.map((t, i) => (
                                <span key={t}>
                                    {i > 0 && ", "}
                                    <code>{t}</code>
                                </span>
                            ))}
                            . <code>quiz[].type</code> must be one of:{" "}
                            {QUIZ_TYPES.map((t, i) => (
                                <span key={t}>
                                    {i > 0 && ", "}
                                    <code>{t}</code>
                                </span>
                            ))}
                            .
                        </p>
                        <p className="text-sm">
                            <a
                                href="/templates/reading-article-bulk-import-template.json"
                                download
                                className="text-blue-600 dark:text-blue-400 underline"
                            >
                                Download template JSON
                            </a>
                            {" · "}
                            <a
                                href="/templates/reading-article-bulk-import-guide.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline"
                            >
                                Field reference guide
                            </a>
                        </p>
                        <details className="text-sm text-gray-600 dark:text-gray-300">
                            <summary className="cursor-pointer select-none">Show example row</summary>
                            <pre className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-x-auto text-xs">
{`[
  {
    "title": "Ein Wochenende in Berlin",
    "topic": "Reisen",
    "level": "A2",
    "content": "Am Samstag bin ich mit dem Zug nach Berlin gefahren...",
    "keyVocabulary": [
      { "word": "entdecken", "meaning": "to discover" }
    ],
    "annotations": [],
    "quiz": []
  }
]`}
                            </pre>
                        </details>

                        <div className="flex flex-col gap-2">
                            <input
                                type="file"
                                accept="application/json,.json"
                                onChange={handleBulkFileSelected}
                                className="text-sm text-gray-600 dark:text-gray-300"
                            />
                            <textarea
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                placeholder="Paste a JSON array of reading articles here, or upload a .json file above."
                                rows={10}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <Button
                            type="button"
                            variant="primary"
                            onClick={runBulkImport}
                            disabled={isBulkImporting || !bulkText.trim()}
                        >
                            {isBulkImporting ? "Importing..." : "Import"}
                        </Button>

                        {bulkResult && (
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {bulkResult.successCount} of {bulkResult.totalCount} imported
                                    {bulkResult.failureCount > 0 ? `, ${bulkResult.failureCount} failed` : ""}.
                                </p>
                                <div className="max-h-64 overflow-y-auto space-y-1">
                                    {bulkResult.rows.map((row) => (
                                        <div
                                            key={row.index}
                                            className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                                                row.success
                                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                            }`}
                                        >
                                            {row.success ? (
                                                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircle className="size-4 shrink-0 mt-0.5" />
                                            )}
                                            <span>
                                                Row {row.index + 1}
                                                {row.title ? ` (${row.title})` : ""}:{" "}
                                                {row.success ? "imported" : row.errorMessage}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6">
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
                                    Article image (optional)
                                </label>
                                <div className="flex items-center gap-4">
                                    <img
                                        src={getArticleImageSrc(manualForm.imageUrl, manualForm.level)}
                                        alt="Article cover preview"
                                        className="w-24 h-16 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleImageSelected}
                                            disabled={isUploadingImage}
                                            className="text-sm text-gray-600 dark:text-gray-300"
                                        />
                                        {manualForm.imageUrl && (
                                            <button
                                                type="button"
                                                className="text-xs text-left underline text-gray-500 dark:text-gray-400 w-fit"
                                                onClick={removeImage}
                                            >
                                                Remove image (use default)
                                            </button>
                                        )}
                                        {isUploadingImage && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Uploading...</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    JPEG, PNG, or WEBP, up to 5MB. If you don&apos;t upload one, a default image for
                                    the selected level is shown instead.
                                </p>
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

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">
                        Existing articles
                    </h2>
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading articles...</div>
                    ) : (
                        <div className="px-6 pb-6">
                            {/* Table controls */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 mb-3">
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    Show
                                    <select
                                        value={tablePageSize}
                                        onChange={(e) => {
                                            setTablePageSize(Number(e.target.value));
                                            setTablePage(1);
                                        }}
                                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    entries
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    Search:
                                    <input
                                        type="text"
                                        value={tableSearch}
                                        onChange={(e) => {
                                            setTableSearch(e.target.value);
                                            setTablePage(1);
                                        }}
                                        placeholder="Title or topic..."
                                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </label>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                        <tr>
                                            <th className="px-6 py-3">Image</th>
                                            <th className="px-6 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSort("title")}
                                                    className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white"
                                                >
                                                    Title {renderSortIcon("title")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSort("level")}
                                                    className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white"
                                                >
                                                    Level {renderSortIcon("level")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSort("vocabulary")}
                                                    className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white"
                                                >
                                                    Vocabulary {renderSortIcon("vocabulary")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSort("annotations")}
                                                    className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white"
                                                >
                                                    Annotations {renderSortIcon("annotations")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedArticles.map((article) => (
                                            <tr key={article.id}>
                                                <td className="px-6 py-4">
                                                    <img
                                                        src={getArticleImageSrc(article.imageUrl, article.level)}
                                                        alt=""
                                                        className="w-14 h-10 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                                                    />
                                                </td>
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
                                        {sortedArticles.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                    No reading articles found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Table footer: info + pagination */}
                            {sortedArticles.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Showing {tableStartIndex} to {tableEndIndex} of {sortedArticles.length} entries
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={tableCurrentPage === 1}
                                            onClick={() => setTablePage(1)}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronsLeft className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={tableCurrentPage === 1}
                                            onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronLeft className="size-4" />
                                        </button>
                                        {tablePageNumbers.map((p, idx) => {
                                            const prev = tablePageNumbers[idx - 1];
                                            const showEllipsis = prev !== undefined && p - prev > 1;
                                            return (
                                                <div key={p} className="flex items-center gap-1">
                                                    {showEllipsis && (
                                                        <span className="px-1 text-gray-400 dark:text-gray-500">…</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setTablePage(p)}
                                                        className={`min-w-9 h-9 px-2 rounded-lg text-sm font-medium border ${
                                                            p === tableCurrentPage
                                                                ? "bg-blue-600 border-blue-600 text-white"
                                                                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            disabled={tableCurrentPage === tableTotalPages}
                                            onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronRight className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={tableCurrentPage === tableTotalPages}
                                            onClick={() => setTablePage(tableTotalPages)}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronsRight className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isSaving && <Loading message="Please wait..." />}
            <ConfirmDialog
                isOpen={Boolean(articleToDelete)}
                title="Delete this article?"
                message={`Delete "${articleToDelete?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemoveArticle}
                onCancel={() => setArticleToDelete(null)}
            />
        </div>
    );
}
