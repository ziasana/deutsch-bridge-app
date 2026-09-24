"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import {
    getGrammarLessonsAdmin,
    createGrammarLesson,
    updateGrammarLesson,
    deleteGrammarLesson,
    uploadGrammarLessonImage,
    bulkImportGrammarLessons,
    getGrammarCategoriesAdmin,
} from "@/services/grammarAdminService";
import {
    GrammarLesson,
    GrammarLessonManualRequest,
    GrammarLessonStatus,
    QuizQuestion,
} from "@/types/grammar";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import RichTextEditor from "@/componenets/RichTextEditor";
import GrammarSubNav from "@/componenets/admin/GrammarSubNav";
import { isTranslatableLevel } from "@/lib/grammarLocalization";
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

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const STATUSES: GrammarLessonStatus[] = ["DRAFT", "PUBLISHED"];
const EXERCISE_TYPES: QuizQuestion["type"][] = ["mcq", "truefalse"];
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

type LessonSortKey = "title" | "level" | "status" | "exercises";
type SortDirection = "asc" | "desc";

const emptyForm = {
    title: "",
    level: "A2",
    summary: "",
    content: "",
    example: "",
    usageTips: "",
    titleFa: "",
    summaryFa: "",
    contentFa: "",
    exampleFa: "",
    usageTipsFa: "",
    videoLink: "",
    status: "DRAFT" as GrammarLessonStatus,
    categoryId: "",
    sortOrder: 0,
};

const emptyExercise = (): QuizQuestion => ({
    type: "mcq",
    title: "",
    question: "",
    options: [],
    answer: "",
    titleFa: "",
    questionFa: "",
});

type LessonBlock = { level?: string; categoryId?: string | null; lessons: GrammarLessonManualRequest[] };

const isLessonBlock = (item: unknown): item is LessonBlock =>
    typeof item === "object" && item !== null && Array.isArray((item as LessonBlock).lessons);

/**
 * Accepts a single lesson, a list of lessons, or category blocks shaped like
 * `{ title, level, categoryId, lessons: [...] }` (alone or in a list). Lessons inside a block
 * inherit the block's level and categoryId unless they set their own.
 */
function toLessonRequests(parsed: unknown): GrammarLessonManualRequest[] {
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.flatMap((item) =>
        isLessonBlock(item)
            ? item.lessons.map((lesson) => ({
                  ...lesson,
                  level: lesson.level ?? item.level,
                  categoryId: lesson.categoryId ?? item.categoryId ?? null,
              }) as GrammarLessonManualRequest)
            : [item as GrammarLessonManualRequest]
    );
}

export default function AdminGrammarPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const queryClient = useQueryClient();

    const LESSONS_KEY = ["admin", "grammar", "lessons"];
    const CATEGORIES_KEY = ["admin", "grammar", "categories"];

    const { data: lessons = [], isLoading, error: lessonsError } = useQuery({
        queryKey: LESSONS_KEY,
        queryFn: () => getGrammarLessonsAdmin().then((res) => res.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });
    const { data: categories = [], error: categoriesError } = useQuery({
        queryKey: CATEGORIES_KEY,
        queryFn: () => getGrammarCategoriesAdmin().then((res) => res.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState<GrammarLesson | null>(null);

    const [form, setForm] = useState(emptyForm);
    const [exercises, setExercises] = useState<QuizQuestion[]>([]);
    const [editingLesson, setEditingLesson] = useState<GrammarLesson | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ success: boolean; message: string } | null>(null);

    const [lessonsPage, setLessonsPage] = useState(1);
    const [lessonsPageSize, setLessonsPageSize] = useState(10);
    const [lessonSearch, setLessonSearch] = useState("");
    const [lessonSortKey, setLessonSortKey] = useState<LessonSortKey>("title");
    const [lessonSortDirection, setLessonSortDirection] = useState<SortDirection>("asc");

    // Also drop the learner-side grammar caches (level lists, level summary, opened lessons) in this browser.
    const invalidateLessons = () => {
        queryClient.invalidateQueries({ queryKey: LESSONS_KEY });
        queryClient.invalidateQueries({ queryKey: ["grammar"] });
    };

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [hasHydrated, userProfile, router]);

    useEffect(() => {
        if (lessonsError) {
            const err = lessonsError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load grammar lessons.");
        }
    }, [lessonsError]);

    useEffect(() => {
        if (categoriesError) {
            const err = categoriesError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load categories.");
        }
    }, [categoriesError]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const resetForm = () => {
        setForm(emptyForm);
        setExercises([]);
        setEditingLesson(null);
    };

    const uploadInlineImage = async (file: File) => {
        setIsUploadingImage(true);
        try {
            const res = await uploadGrammarLessonImage(file);
            return res.data.url;
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                "Failed to upload image.";
            toast.error(message);
            throw err;
        } finally {
            setIsUploadingImage(false);
        }
    };

    const updateExercise = (idx: number, field: keyof QuizQuestion, value: string) => {
        setExercises((prev) =>
            prev.map((ex, i) => {
                if (i !== idx) return ex;
                if (field === "type") {
                    const nextType = value as QuizQuestion["type"];
                    return {
                        ...ex,
                        type: nextType,
                        options: nextType === "mcq" ? ex.options ?? [] : [],
                        answer: nextType === "truefalse" ? false : "",
                    };
                }
                return { ...ex, [field]: value };
            })
        );
    };
    const updateExerciseOptions = (idx: number, value: string) => {
        setExercises((prev) =>
            prev.map((ex, i) => (i === idx ? { ...ex, options: value.split(";").map((o) => o.trim()) } : ex))
        );
    };
    const updateExerciseAnswer = (idx: number, question: QuizQuestion, value: string) => {
        setExercises((prev) =>
            prev.map((ex, i) =>
                i === idx ? { ...ex, answer: question.type === "truefalse" ? value === "true" : value } : ex
            )
        );
    };
    const updateExerciseFa = (idx: number, field: "titleFa" | "questionFa", value: string) => {
        setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)));
    };
    const removeExercise = (idx: number) => setExercises((prev) => prev.filter((_, i) => i !== idx));
    const addExercise = () => setExercises((prev) => [...prev, emptyExercise()]);

    const startEdit = (lesson: GrammarLesson) => {
        setEditingLesson(lesson);
        setForm({
            title: lesson.title,
            level: lesson.level,
            summary: lesson.summary ?? "",
            content: lesson.content ?? "",
            example: lesson.example ?? "",
            usageTips: lesson.usageTips ?? "",
            titleFa: lesson.titleFa ?? "",
            summaryFa: lesson.summaryFa ?? "",
            contentFa: lesson.contentFa ?? "",
            exampleFa: lesson.exampleFa ?? "",
            usageTipsFa: lesson.usageTipsFa ?? "",
            videoLink: lesson.videoLink ?? "",
            status: lesson.status ?? "DRAFT",
            categoryId: lesson.categoryId ?? "",
            sortOrder: lesson.sortOrder ?? 0,
        });
        setExercises(lesson.quiz ?? []);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const isTranslatable = isTranslatableLevel(form.level);

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            toast.error("Title and description are required.");
            return;
        }

        const payload = {
            title: form.title,
            level: form.level,
            summary: form.summary,
            content: form.content,
            example: form.example,
            usageTips: form.usageTips,
            titleFa: isTranslatable ? form.titleFa.trim() || null : null,
            summaryFa: isTranslatable ? form.summaryFa.trim() || null : null,
            contentFa: isTranslatable ? form.contentFa.trim() || null : null,
            exampleFa: isTranslatable ? form.exampleFa.trim() || null : null,
            usageTipsFa: isTranslatable ? form.usageTipsFa.trim() || null : null,
            videoLink: form.videoLink.trim() || null,
            status: form.status,
            categoryId: form.categoryId || null,
            sortOrder: form.sortOrder,
            quiz: exercises
                .filter((ex) => ex.question.trim())
                .map((ex) => ({
                    ...ex,
                    options: ex.type === "mcq" ? (ex.options ?? []).map((o) => o.trim()).filter(Boolean) : [],
                    titleFa: isTranslatable ? (ex.titleFa ?? "").trim() || null : null,
                    questionFa: isTranslatable ? (ex.questionFa ?? "").trim() || null : null,
                })),
        };

        setIsSaving(true);
        const request = editingLesson
            ? updateGrammarLesson(editingLesson.id, payload)
            : createGrammarLesson(payload);

        request
            .then(() => {
                toast.success(editingLesson ? "Lesson updated." : "Lesson saved.");
                resetForm();
                invalidateLessons();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save lesson."))
            .finally(() => setIsSaving(false));
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
        let requests: GrammarLessonManualRequest[];
        try {
            requests = toLessonRequests(JSON.parse(bulkText));
        } catch {
            toast.error("Invalid JSON - check the syntax and try again.");
            return;
        }
        if (requests.length === 0) {
            toast.error("Expected a non-empty JSON array of lessons.");
            return;
        }

        setIsImporting(true);
        setBulkResult(null);
        bulkImportGrammarLessons(requests)
            .then((res) => {
                const message = `Imported ${res.data.length} lesson(s) as drafts.`;
                setBulkResult({ success: true, message });
                toast.success(message);
                invalidateLessons();
            })
            .catch((err) => {
                const message: string = err?.response?.data?.message ?? "Failed to import lessons.";
                setBulkResult({ success: false, message });
                toast.error("Bulk import failed - see details below.");
            })
            .finally(() => setIsImporting(false));
    };

    const closeBulkImport = () => {
        setShowBulkImport(false);
        setBulkText("");
        setBulkResult(null);
    };

    const removeLesson = (lesson: GrammarLesson) => setLessonToDelete(lesson);

    const confirmRemoveLesson = () => {
        const lesson = lessonToDelete;
        if (!lesson) return;
        setLessonToDelete(null);
        deleteGrammarLesson(lesson.id)
            .then(() => {
                toast.success("Lesson deleted.");
                invalidateLessons();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete lesson."));
    };

    const toggleLessonSort = (key: LessonSortKey) => {
        if (lessonSortKey === key) {
            setLessonSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setLessonSortKey(key);
            setLessonSortDirection("asc");
        }
        setLessonsPage(1);
    };

    const renderLessonSortIcon = (column: LessonSortKey) => {
        if (lessonSortKey !== column) return <ArrowUpDown className="size-3.5 opacity-40" />;
        return lessonSortDirection === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
    };

    const lessonSearchQuery = lessonSearch.trim().toLowerCase();
    const filteredLessons = lessonSearchQuery
        ? lessons.filter((l) => l.title.toLowerCase().includes(lessonSearchQuery))
        : lessons;
    const lessonValueFor = (l: GrammarLesson) => {
        switch (lessonSortKey) {
            case "title":
                return l.title.toLowerCase();
            case "level":
                return l.level;
            case "status":
                return l.status ?? "DRAFT";
            case "exercises":
                return l.quiz?.length ?? 0;
        }
    };
    const sortedLessons = filteredLessons.slice().sort((a, b) => {
        const dir = lessonSortDirection === "asc" ? 1 : -1;
        const va = lessonValueFor(a);
        const vb = lessonValueFor(b);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });

    const lessonsTotalPages = Math.max(1, Math.ceil(sortedLessons.length / lessonsPageSize));
    const lessonsCurrentPage = Math.min(lessonsPage, lessonsTotalPages);
    const lessonsStartIndex = sortedLessons.length === 0 ? 0 : (lessonsCurrentPage - 1) * lessonsPageSize + 1;
    const lessonsEndIndex = Math.min(lessonsCurrentPage * lessonsPageSize, sortedLessons.length);
    const paginatedLessons = sortedLessons.slice(
        (lessonsCurrentPage - 1) * lessonsPageSize,
        lessonsCurrentPage * lessonsPageSize
    );
    const lessonsPageNumbers = Array.from({ length: lessonsTotalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === lessonsTotalPages || Math.abs(p - lessonsCurrentPage) <= 1
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Grammar Lessons</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Create and manage grammar lessons and their exercises.
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

                <GrammarSubNav />

                {showBulkImport && (
                    <div className="mb-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-4">
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
                            Paste or upload a JSON array of grammar lessons, in the same shape as the form below.
                            Unlike Reading/Expressions bulk import, this one is all-or-nothing: every lesson is
                            validated first, and if any of them fails, nothing is saved. Required fields per row:{" "}
                            <code>title</code>, <code>level</code> (<code>A1</code>-<code>C2</code>),{" "}
                            <code>content</code>.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <code>status</code> must be one of:{" "}
                            {STATUSES.map((s, i) => (
                                <span key={s}>
                                    {i > 0 && ", "}
                                    <code>{s}</code>
                                </span>
                            ))}
                            {" "}(defaults to <code>DRAFT</code> if omitted). <code>quiz[].type</code> must be one of:{" "}
                            {EXERCISE_TYPES.map((t, i) => (
                                <span key={t}>
                                    {i > 0 && ", "}
                                    <code>{t}</code>
                                </span>
                            ))}
                            .
                        </p>
                        <p className="text-sm">
                            <a
                                href="/templates/grammar-lesson-bulk-import-template.json"
                                download
                                className="text-blue-600 dark:text-blue-400 underline"
                            >
                                Download template JSON
                            </a>
                            {" · "}
                            <a
                                href="/templates/grammar-lesson-bulk-import-guide.md"
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
    "title": "Perfekt mit haben und sein",
    "level": "A2",
    "content": "Das Perfekt wird mit einer Form von \\"haben\\" oder \\"sein\\" und dem Partizip II gebildet.",
    "example": "Ich habe gegessen. / Ich bin gefahren.",
    "status": "DRAFT",
    "quiz": [
      {
        "type": "mcq",
        "title": "Hilfsverb wählen",
        "question": "Ich ___ gestern ins Kino gegangen.",
        "options": ["bin", "habe", "war"],
        "answer": "bin"
      }
    ]
  }
]`}
                            </pre>
                            <p className="mt-2">
                                Lessons can also be grouped into category blocks (<code>{"{ title, level, categoryId, lessons: [...] }"}</code>)
                                — see the field reference guide for that shape.
                            </p>
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
                                placeholder="Paste a JSON array of grammar lessons here, or upload a .json file above."
                                rows={10}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <Button
                            type="button"
                            variant="primary"
                            onClick={runBulkImport}
                            disabled={isImporting || !bulkText.trim()}
                        >
                            {isImporting ? "Importing..." : "Import"}
                        </Button>

                        {bulkResult && (
                            <div
                                className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg whitespace-pre-line ${
                                    bulkResult.success
                                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                }`}
                            >
                                {bulkResult.success ? (
                                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="size-4 shrink-0 mt-0.5" />
                                )}
                                <span>{bulkResult.message}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6">
                    <form onSubmit={submitForm} className="space-y-6">
                        {editingLesson && (
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Editing &quot;{editingLesson.title}&quot; —{" "}
                                <button type="button" className="underline" onClick={resetForm}>
                                    cancel
                                </button>
                            </p>
                        )}

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Title</label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Konjunktiv II"
                            />
                        </div>

                        <div className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Level</label>
                                <select
                                    value={form.level}
                                    onChange={(e) => setForm({ ...form, level: e.target.value, categoryId: "" })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {LEVELS.map((lvl) => (
                                        <option key={lvl} value={lvl}>
                                            {lvl}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Category</label>
                                <select
                                    value={form.categoryId}
                                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="">No category</option>
                                    {categories
                                        .filter((c) => c.level === form.level)
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.title}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="min-w-[100px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Order</label>
                                <input
                                    type="number"
                                    value={form.sortOrder}
                                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Lower shows first within its category.
                                </p>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as GrammarLessonStatus })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Only PUBLISHED lessons are shown to students.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                Short summary
                            </label>
                            <Input
                                value={form.summary}
                                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                                placeholder="One-line summary shown in the lesson list"
                                required={false}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Description</label>
                            <RichTextEditor
                                value={form.content}
                                onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                                placeholder="Explain the grammar topic..."
                                onUploadImage={uploadInlineImage}
                            />
                            {isUploadingImage && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Uploading image...</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Examples</label>
                            <textarea
                                value={form.example}
                                onChange={(e) => setForm({ ...form, example: e.target.value })}
                                placeholder="Example sentence(s)"
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Usage tip</label>
                            <textarea
                                value={form.usageTips}
                                onChange={(e) => setForm({ ...form, usageTips: e.target.value })}
                                placeholder="Tips on how/when to use this"
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {isTranslatable && (
                            <div className="border border-purple-200 dark:border-purple-900/50 rounded-lg p-4 space-y-4 bg-purple-50/40 dark:bg-purple-950/20">
                                <div>
                                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                        ترجمه فارسی (Persian translation)
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Only shown/authored for levels A1-B1. Leave blank to fall back to the English
                                        content above.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                        عنوان (Title)
                                    </label>
                                    <Input
                                        dir="rtl"
                                        value={form.titleFa}
                                        onChange={(e) => setForm({ ...form, titleFa: e.target.value })}
                                        placeholder="عنوان درس"
                                        required={false}
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                        خلاصه (Short summary)
                                    </label>
                                    <Input
                                        dir="rtl"
                                        value={form.summaryFa}
                                        onChange={(e) => setForm({ ...form, summaryFa: e.target.value })}
                                        placeholder="خلاصه یک خطی"
                                        required={false}
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                        توضیحات (Description)
                                    </label>
                                    <div dir="rtl">
                                        <RichTextEditor
                                            value={form.contentFa}
                                            onChange={(html) => setForm((prev) => ({ ...prev, contentFa: html }))}
                                            placeholder="موضوع گرامری را توضیح دهید..."
                                            onUploadImage={uploadInlineImage}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                        مثال‌ها (Examples)
                                    </label>
                                    <textarea
                                        dir="rtl"
                                        value={form.exampleFa}
                                        onChange={(e) => setForm({ ...form, exampleFa: e.target.value })}
                                        placeholder="جمله‌های نمونه"
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                        نکته کاربردی (Usage tip)
                                    </label>
                                    <textarea
                                        dir="rtl"
                                        value={form.usageTipsFa}
                                        onChange={(e) => setForm({ ...form, usageTipsFa: e.target.value })}
                                        placeholder="نکاتی درباره نحوه استفاده"
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                Video link (optional)
                            </label>
                            <Input
                                value={form.videoLink}
                                onChange={(e) => setForm({ ...form, videoLink: e.target.value })}
                                placeholder="https://www.youtube.com/watch?v=..."
                                required={false}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-gray-700 dark:text-gray-300 text-sm">Exercises</label>
                            </div>
                            <div className="space-y-3">
                                {exercises.map((ex, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2"
                                    >
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <select
                                                value={ex.type}
                                                onChange={(e) => updateExercise(idx, "type", e.target.value)}
                                                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                            >
                                                {EXERCISE_TYPES.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t === "mcq" ? "Multiple choice" : "True / False"}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => removeExercise(idx)}
                                                className="text-red-500 text-sm px-2 ml-auto"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <Input
                                            value={ex.title}
                                            onChange={(e) => updateExercise(idx, "title", e.target.value)}
                                            placeholder="Exercise title (optional)"
                                            required={false}
                                        />
                                        <Input
                                            value={ex.question}
                                            onChange={(e) => updateExercise(idx, "question", e.target.value)}
                                            placeholder="Question"
                                            required={false}
                                        />
                                        {ex.type === "mcq" ? (
                                            <>
                                                <Input
                                                    value={(ex.options ?? []).join("; ")}
                                                    onChange={(e) => updateExerciseOptions(idx, e.target.value)}
                                                    placeholder="Options, separated by ;"
                                                    required={false}
                                                />
                                                <select
                                                    value={typeof ex.answer === "string" ? ex.answer : ""}
                                                    onChange={(e) => updateExerciseAnswer(idx, ex, e.target.value)}
                                                    className="w-full px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                                >
                                                    <option value="">Select the correct option</option>
                                                    {(ex.options ?? [])
                                                        .map((o) => o.trim())
                                                        .filter(Boolean)
                                                        .map((o) => (
                                                            <option key={o} value={o}>
                                                                {o}
                                                            </option>
                                                        ))}
                                                </select>
                                            </>
                                        ) : (
                                            <select
                                                value={ex.answer === true ? "true" : "false"}
                                                onChange={(e) => updateExerciseAnswer(idx, ex, e.target.value)}
                                                className="w-full px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                            >
                                                <option value="true">True</option>
                                                <option value="false">False</option>
                                            </select>
                                        )}
                                        {isTranslatable && (
                                            <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 space-y-2">
                                                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                                    ترجمه فارسی (optional)
                                                </p>
                                                <Input
                                                    dir="rtl"
                                                    value={ex.titleFa ?? ""}
                                                    onChange={(e) => updateExerciseFa(idx, "titleFa", e.target.value)}
                                                    placeholder="عنوان تمرین"
                                                    required={false}
                                                />
                                                <Input
                                                    dir="rtl"
                                                    value={ex.questionFa ?? ""}
                                                    onChange={(e) => updateExerciseFa(idx, "questionFa", e.target.value)}
                                                    placeholder="سوال"
                                                    required={false}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" className="text-xs px-3 py-1" onClick={addExercise}>
                                    + Add exercise
                                </Button>
                            </div>
                        </div>

                        <Button variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : editingLesson ? "Save changes" : "Save lesson"}
                        </Button>
                    </form>
                </div>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">
                        Existing lessons
                    </h2>
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading lessons...</div>
                    ) : (
                        <div className="px-6 pb-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 mb-3">
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    Show
                                    <select
                                        value={lessonsPageSize}
                                        onChange={(e) => {
                                            setLessonsPageSize(Number(e.target.value));
                                            setLessonsPage(1);
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
                                        value={lessonSearch}
                                        onChange={(e) => {
                                            setLessonSearch(e.target.value);
                                            setLessonsPage(1);
                                        }}
                                        placeholder="Lesson title..."
                                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </label>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                        <tr>
                                            <th className="px-6 py-3">
                                                <button type="button" onClick={() => toggleLessonSort("title")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Title {renderLessonSortIcon("title")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">
                                                <button type="button" onClick={() => toggleLessonSort("level")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Level {renderLessonSortIcon("level")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">Category</th>
                                            <th className="px-6 py-3">Order</th>
                                            <th className="px-6 py-3">
                                                <button type="button" onClick={() => toggleLessonSort("status")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Status {renderLessonSortIcon("status")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">
                                                <button type="button" onClick={() => toggleLessonSort("exercises")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Exercises {renderLessonSortIcon("exercises")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedLessons.map((lesson) => (
                                            <tr key={lesson.id}>
                                                <td className="px-6 py-4 text-gray-900 dark:text-white">{lesson.title}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary">{lesson.level}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                    {lesson.categoryTitle ?? "—"}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                    {lesson.sortOrder}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={lesson.status === "PUBLISHED" ? "default" : "secondary"}>
                                                        {lesson.status ?? "DRAFT"}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                    {lesson.quiz?.length ?? 0}
                                                </td>
                                                <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                                    <Button
                                                        variant="secondary"
                                                        className="px-3 py-1 text-sm"
                                                        onClick={() => startEdit(lesson)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        className="px-3 py-1 text-sm"
                                                        onClick={() => removeLesson(lesson)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {sortedLessons.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                    No grammar lessons found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {sortedLessons.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Showing {lessonsStartIndex} to {lessonsEndIndex} of {sortedLessons.length} entries
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={lessonsCurrentPage === 1}
                                            onClick={() => setLessonsPage(1)}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronsLeft className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={lessonsCurrentPage === 1}
                                            onClick={() => setLessonsPage((p) => Math.max(1, p - 1))}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronLeft className="size-4" />
                                        </button>
                                        {lessonsPageNumbers.map((p, idx) => {
                                            const prev = lessonsPageNumbers[idx - 1];
                                            const showEllipsis = prev !== undefined && p - prev > 1;
                                            return (
                                                <div key={p} className="flex items-center gap-1">
                                                    {showEllipsis && <span className="px-1 text-gray-400 dark:text-gray-500">…</span>}
                                                    <button
                                                        type="button"
                                                        onClick={() => setLessonsPage(p)}
                                                        className={`min-w-9 h-9 px-2 rounded-lg text-sm font-medium border ${
                                                            p === lessonsCurrentPage
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
                                            disabled={lessonsCurrentPage === lessonsTotalPages}
                                            onClick={() => setLessonsPage((p) => Math.min(lessonsTotalPages, p + 1))}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronRight className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={lessonsCurrentPage === lessonsTotalPages}
                                            onClick={() => setLessonsPage(lessonsTotalPages)}
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
                isOpen={Boolean(lessonToDelete)}
                title="Delete this lesson?"
                message={`Delete "${lessonToDelete?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemoveLesson}
                onCancel={() => setLessonToDelete(null)}
            />
        </div>
    );
}
