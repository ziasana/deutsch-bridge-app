"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import useAuthStore from "@/store/useAuthStore";
import {
    getExpressionsAdmin,
    createExpression,
    updateExpression,
    deleteExpression,
    uploadExpressionImage,
    bulkImportExpressions,
} from "@/services/expressionAdminService";
import { getExpressionImageSrc } from "@/lib/expressionImages";
import {
    Expression,
    ExpressionBulkImportResult,
    ExpressionManualRequest,
    ExpressionType,
    ExpressionStatus,
    ExpressionRegister,
    ExpressionExampleContext,
    ExpressionExampleInput,
    ExpressionPatternInput,
    ExpressionQuestionInput,
    ExpressionQuestionOptionInput,
    ExpressionQuestionType,
    ExpressionQuestionFormat,
} from "@/types/expression";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
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
const TYPES: ExpressionType[] = ["NOMEN_VERB_VERBINDUNG", "REDEWENDUNG"];
const STATUSES: ExpressionStatus[] = ["DRAFT", "PUBLISHED"];
const REGISTERS: ExpressionRegister[] = ["NEUTRAL_FORMAL", "FORMAL", "UMGANGSSPRACHLICH"];
const CONTEXTS: ExpressionExampleContext[] = ["EVERYDAY", "WORK", "UNIVERSITY", "SOCIETY", "EXAM"];
const QUESTION_TYPES: ExpressionQuestionType[] = ["CONTEXT", "COMPLETION", "TRANSFORMATION"];
const QUESTION_TYPE_LABEL: Record<ExpressionQuestionType, string> = {
    CONTEXT: "Context (pick the matching situation)",
    COMPLETION: "Completion (fill-in-the-blank)",
    TRANSFORMATION: "Transformation (rewrite the sentence)",
};
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type EntrySortKey = "expression" | "type" | "level" | "status";
type SortDirection = "asc" | "desc";

const emptyExample: ExpressionExampleInput = { sentence: "", translationEn: "", translationFa: "", context: "EVERYDAY" };
const emptyPattern: ExpressionPatternInput = { pattern: "", grammarCase: "", preposition: "", example: "" };
const emptyQuestionOption: ExpressionQuestionOptionInput = { text: "", correct: false };
const emptyQuestion: ExpressionQuestionInput = {
    type: "CONTEXT",
    format: "MULTIPLE_CHOICE",
    prompt: "",
    explanation: "",
    options: [{ ...emptyQuestionOption }, { ...emptyQuestionOption }, { ...emptyQuestionOption }],
};

const emptyForm: ExpressionManualRequest = {
    expression: "",
    type: "NOMEN_VERB_VERBINDUNG",
    level: "B2",
    meaningDe: "",
    meaningEn: "",
    meaningFa: "",
    literalMeaning: "",
    figurativeMeaning: "",
    imageUrl: null,
    grammarNote: "",
    usageNote: "",
    register: "NEUTRAL_FORMAL",
    commonMistakes: "",
    status: "DRAFT",
    examples: [{ ...emptyExample }],
    patterns: [],
    questions: [],
};

export default function AdminExpressionsPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [entries, setEntries] = useState<Expression[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<Expression | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [entrySearch, setEntrySearch] = useState("");
    const [sortKey, setSortKey] = useState<EntrySortKey>("expression");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const [form, setForm] = useState<ExpressionManualRequest>(emptyForm);
    const [editingEntry, setEditingEntry] = useState<Expression | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [bulkResult, setBulkResult] = useState<ExpressionBulkImportResult | null>(null);

    const fetchEntries = useCallback(() => {
        getExpressionsAdmin()
            .then((res) => setEntries(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load entries."))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchEntries();
    }, [hasHydrated, userProfile, router, fetchEntries]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const resetForm = () => {
        setForm({ ...emptyForm, examples: [{ ...emptyExample }], patterns: [], questions: [] });
        setEditingEntry(null);
    };

    const startEdit = (entry: Expression) => {
        setEditingEntry(entry);
        setForm({
            expression: entry.expression,
            type: entry.type,
            level: entry.level,
            meaningDe: entry.meaningDe ?? "",
            meaningEn: entry.meaningEn ?? "",
            meaningFa: entry.meaningFa ?? "",
            literalMeaning: entry.literalMeaning ?? "",
            figurativeMeaning: entry.figurativeMeaning ?? "",
            imageUrl: entry.imageUrl,
            grammarNote: entry.grammarNote ?? "",
            usageNote: entry.usageNote ?? "",
            register: entry.register ?? "NEUTRAL_FORMAL",
            commonMistakes: entry.commonMistakes ?? "",
            status: entry.status ?? "DRAFT",
            examples: entry.examples.length
                ? entry.examples.map((e) => ({ sentence: e.sentence, translationEn: e.translationEn, translationFa: e.translationFa, context: e.context }))
                : [{ ...emptyExample }],
            patterns: entry.patterns.map((p) => ({ pattern: p.pattern, grammarCase: p.grammarCase, preposition: p.preposition, example: p.example })),
            questions: (entry.questions ?? []).map((q) => ({
                type: q.type,
                format: q.format,
                prompt: q.prompt,
                explanation: q.explanation,
                options: q.options.map((o) => ({ text: o.text, correct: o.correct })),
            })),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.expression.trim() || !form.meaningDe.trim()) {
            toast.error("Expression and German meaning are required.");
            return;
        }

        const payload: ExpressionManualRequest = {
            ...form,
            examples: form.examples.filter((ex) => ex.sentence.trim()),
            patterns: form.patterns.filter((p) => p.pattern.trim()),
            questions: form.questions
                .filter((q) => q.prompt.trim())
                .map((q) => ({
                    ...q,
                    options: q.format === "FREE_TEXT" ? [] : q.options.filter((o) => o.text.trim()),
                })),
        };

        setIsSaving(true);
        const request = editingEntry ? updateExpression(editingEntry.id, payload) : createExpression(payload);

        request
            .then(() => {
                toast.success(editingEntry ? "Entry updated." : "Entry saved.");
                resetForm();
                fetchEntries();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save entry."))
            .finally(() => setIsSaving(false));
    };

    const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setIsUploadingImage(true);
        uploadExpressionImage(file)
            .then((res) => {
                setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
                toast.success("Image uploaded.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to upload image."))
            .finally(() => setIsUploadingImage(false));
    };

    const removeImage = () => setForm((prev) => ({ ...prev, imageUrl: "" }));

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
            toast.error("Expected a non-empty JSON array of expressions.");
            return;
        }

        setIsBulkImporting(true);
        setBulkResult(null);
        bulkImportExpressions(parsed)
            .then((res) => {
                setBulkResult(res.data);
                if (res.data.successCount > 0) fetchEntries();
                if (res.data.failureCount === 0) {
                    toast.success(`Imported ${res.data.successCount} expressions.`);
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

    const removeEntry = (entry: Expression) => setEntryToDelete(entry);

    const confirmRemoveEntry = () => {
        const entry = entryToDelete;
        if (!entry) return;
        setEntryToDelete(null);
        deleteExpression(entry.id)
            .then(() => {
                toast.success("Entry deleted.");
                fetchEntries();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete entry."));
    };

    const toggleVisibility = (entry: Expression) => {
        const nextStatus: ExpressionStatus = entry.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
        updateExpression(entry.id, { status: nextStatus })
            .then(() => {
                toast.success(nextStatus === "PUBLISHED" ? "Entry shown to students." : "Entry hidden from students.");
                fetchEntries();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update entry."));
    };

    const updateExample = (index: number, patch: Partial<ExpressionExampleInput>) => {
        setForm((prev) => ({
            ...prev,
            examples: prev.examples.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)),
        }));
    };

    const updatePattern = (index: number, patch: Partial<ExpressionPatternInput>) => {
        setForm((prev) => ({
            ...prev,
            patterns: prev.patterns.map((p, i) => (i === index ? { ...p, ...patch } : p)),
        }));
    };

    const updateQuestion = (index: number, patch: Partial<ExpressionQuestionInput>) => {
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
        }));
    };

    const updateQuestionOption = (qIndex: number, oIndex: number, patch: Partial<ExpressionQuestionOptionInput>) => {
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? { ...o, ...patch } : o)) } : q
            ),
        }));
    };

    // Only one option can be correct per question - selecting one clears the others.
    const setCorrectOption = (qIndex: number, oIndex: number) => {
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === qIndex ? { ...q, options: q.options.map((o, j) => ({ ...o, correct: j === oIndex })) } : q
            ),
        }));
    };

    const toggleEntrySort = (key: EntrySortKey) => {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
        setPage(1);
    };

    const renderEntrySortIcon = (column: EntrySortKey) => {
        if (sortKey !== column) return <ArrowUpDown className="size-3.5 opacity-40" />;
        return sortDirection === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
    };

    const entrySearchQuery = entrySearch.trim().toLowerCase();
    const filteredEntries = entrySearchQuery
        ? entries.filter((e) => e.expression.toLowerCase().includes(entrySearchQuery))
        : entries;

    const entryValueFor = (e: Expression) => {
        switch (sortKey) {
            case "expression":
                return e.expression.toLowerCase();
            case "type":
                return e.type;
            case "level":
                return e.level;
            case "status":
                return e.status;
        }
    };
    const sortedEntries = filteredEntries.slice().sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        const va = entryValueFor(a);
        const vb = entryValueFor(b);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(sortedEntries.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = sortedEntries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, sortedEntries.length);
    const paginatedEntries = sortedEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const entryPageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Active Expressions</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Create and manage Nomen-Verb-Verbindungen and Redewendungen.
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
                            Paste or upload a JSON array of expressions, in the same shape as the form below.
                            Each row is imported independently - a mistake in one row won&apos;t block the rest.
                            Required fields per row: <code>expression</code>, <code>type</code>{" "}
                            (<code>NOMEN_VERB_VERBINDUNG</code> or <code>REDEWENDUNG</code>), <code>level</code>{" "}
                            (<code>A1</code>-<code>C2</code>), <code>meaningDe</code>.
                        </p>
                        <p className="text-sm">
                            <a
                                href="/templates/expression-bulk-import-template.json"
                                download
                                className="text-blue-600 dark:text-blue-400 underline"
                            >
                                Download template JSON
                            </a>
                            {" · "}
                            <a
                                href="/templates/expression-bulk-import-guide.md"
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
    "expression": "den Faden verlieren",
    "type": "REDEWENDUNG",
    "level": "B2",
    "meaningDe": "den Überblick verlieren",
    "meaningEn": "to lose one's train of thought",
    "meaningFa": "",
    "status": "DRAFT",
    "examples": [
      { "sentence": "Ich habe beim Reden den Faden verloren.", "translationEn": "", "translationFa": "", "context": "EVERYDAY" }
    ]
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
                                placeholder="Paste a JSON array of expressions here, or upload a .json file above."
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
                                                {row.expression ? ` (${row.expression})` : ""}:{" "}
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
                    <form onSubmit={submitForm} className="space-y-6">
                        {editingEntry && (
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Editing &quot;{editingEntry.expression}&quot; —{" "}
                                <button type="button" className="underline" onClick={resetForm}>
                                    cancel
                                </button>
                            </p>
                        )}

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Expression</label>
                            <Input
                                value={form.expression}
                                onChange={(e) => setForm({ ...form, expression: e.target.value })}
                                placeholder="e.g. eine Entscheidung treffen"
                            />
                        </div>

                        <div className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Type</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value as ExpressionType })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Level</label>
                                <select
                                    value={form.level}
                                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {LEVELS.map((lvl) => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Register</label>
                                <select
                                    value={form.register ?? ""}
                                    onChange={(e) => setForm({ ...form, register: e.target.value as ExpressionRegister })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {REGISTERS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as ExpressionStatus })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Only PUBLISHED entries appear to students.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Bedeutung (DE)</label>
                                <textarea
                                    value={form.meaningDe}
                                    onChange={(e) => setForm({ ...form, meaningDe: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={2}
                                    placeholder="sich entscheiden"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Meaning (EN)</label>
                                <textarea
                                    value={form.meaningEn}
                                    onChange={(e) => setForm({ ...form, meaningEn: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={2}
                                    placeholder="to make a decision"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Meaning (FA)</label>
                                <textarea
                                    value={form.meaningFa}
                                    onChange={(e) => setForm({ ...form, meaningFa: e.target.value })}
                                    dir="rtl"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={2}
                                    placeholder="تصمیم گرفتن"
                                />
                            </div>
                        </div>

                        {form.type === "REDEWENDUNG" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Wörtliche Bedeutung</label>
                                    <Input
                                        value={form.literalMeaning}
                                        onChange={(e) => setForm({ ...form, literalMeaning: e.target.value })}
                                        placeholder="in kaltes Wasser springen"
                                        required={false}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Übertragene Bedeutung</label>
                                    <Input
                                        value={form.figurativeMeaning}
                                        onChange={(e) => setForm({ ...form, figurativeMeaning: e.target.value })}
                                        placeholder="eine schwierige oder neue Situation direkt angehen"
                                        required={false}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                        Illustration (optional)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {getExpressionImageSrc(form.imageUrl) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={getExpressionImageSrc(form.imageUrl) as string}
                                                alt="Illustration preview"
                                                className="w-24 h-16 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                                            />
                                        ) : (
                                            <div className="w-24 h-16 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                                                No image
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleImageSelected}
                                                disabled={isUploadingImage}
                                                className="text-sm text-gray-600 dark:text-gray-300"
                                            />
                                            {form.imageUrl && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-left underline text-gray-500 dark:text-gray-400 w-fit"
                                                    onClick={removeImage}
                                                >
                                                    Remove image
                                                </button>
                                            )}
                                            {isUploadingImage && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Uploading...</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        JPEG, PNG, or WEBP. Shown as a featured banner on the expression card; if you
                                        don&apos;t upload one, the card falls back to a plain text layout. Recommended
                                        size: at least 1200×520px (2.3:1 ratio) so it isn&apos;t awkwardly cropped -
                                        the image is auto-cropped to fit that ratio either way.
                                    </p>
                                </div>
                            </div>
                        )}

                        {form.type === "NOMEN_VERB_VERBINDUNG" && (
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Grammatik-Hinweis</label>
                                <Input
                                    value={form.grammarNote}
                                    onChange={(e) => setForm({ ...form, grammarNote: e.target.value })}
                                    placeholder="Akkusativ"
                                    required={false}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Usage note</label>
                                <textarea
                                    value={form.usageNote}
                                    onChange={(e) => setForm({ ...form, usageNote: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Common mistakes</label>
                                <textarea
                                    value={form.commonMistakes}
                                    onChange={(e) => setForm({ ...form, commonMistakes: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Examples */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold">
                                    Examples (used for the recall exercise)
                                </label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="px-3 py-1 text-sm"
                                    onClick={() => setForm((prev) => ({ ...prev, examples: [...prev.examples, { ...emptyExample }] }))}
                                >
                                    + Add example
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {form.examples.map((ex, i) => (
                                    <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                value={ex.sentence}
                                                onChange={(e) => updateExample(i, { sentence: e.target.value })}
                                                placeholder="Ich muss heute eine Entscheidung treffen."
                                                required={false}
                                            />
                                            <select
                                                value={ex.context}
                                                onChange={(e) => updateExample(i, { context: e.target.value as ExpressionExampleContext })}
                                                className="px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                {CONTEXTS.map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="px-3 py-1 text-sm"
                                                onClick={() => setForm((prev) => ({ ...prev, examples: prev.examples.filter((_, idx) => idx !== i) }))}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <Input
                                                value={ex.translationEn}
                                                onChange={(e) => updateExample(i, { translationEn: e.target.value })}
                                                placeholder="English translation"
                                                required={false}
                                            />
                                            <Input
                                                value={ex.translationFa}
                                                onChange={(e) => updateExample(i, { translationFa: e.target.value })}
                                                placeholder="Persian translation"
                                                required={false}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Patterns */}
                        {form.type === "NOMEN_VERB_VERBINDUNG" && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold">
                                        Patterns (optional)
                                    </label>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="px-3 py-1 text-sm"
                                        onClick={() => setForm((prev) => ({ ...prev, patterns: [...prev.patterns, { ...emptyPattern }] }))}
                                    >
                                        + Add pattern
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {form.patterns.map((p, i) => (
                                        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                            <Input value={p.pattern} onChange={(e) => updatePattern(i, { pattern: e.target.value })} placeholder="eine Entscheidung über + Akk. treffen" required={false} />
                                            <Input value={p.grammarCase} onChange={(e) => updatePattern(i, { grammarCase: e.target.value })} placeholder="Akkusativ" required={false} />
                                            <Input value={p.preposition} onChange={(e) => updatePattern(i, { preposition: e.target.value })} placeholder="über" required={false} />
                                            <div className="flex gap-2">
                                                <Input value={p.example} onChange={(e) => updatePattern(i, { example: e.target.value })} placeholder="Example" required={false} />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="px-3 py-1 text-sm"
                                                    onClick={() => setForm((prev) => ({ ...prev, patterns: prev.patterns.filter((_, idx) => idx !== i) }))}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Practice questions */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold">
                                        Practice questions (optional)
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Shown as extra warm-up exercises alongside Recall, before Production. A random subset
                                        rotates in each practice session.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="px-3 py-1 text-sm whitespace-nowrap"
                                    onClick={() => setForm((prev) => ({ ...prev, questions: [...prev.questions, { ...emptyQuestion, options: emptyQuestion.options.map((o) => ({ ...o })) }] }))}
                                >
                                    + Add question
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {form.questions.map((q, qi) => (
                                    <div key={qi} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                                        <div className="flex gap-2 items-start flex-wrap">
                                            <div className="flex-1 min-w-[220px]">
                                                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-xs">Type</label>
                                                <select
                                                    value={q.type}
                                                    onChange={(e) => updateQuestion(qi, { type: e.target.value as ExpressionQuestionType })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                >
                                                    {QUESTION_TYPES.map((t) => (
                                                        <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {q.type === "TRANSFORMATION" && (
                                                <div className="flex-1 min-w-[160px]">
                                                    <label className="block text-gray-700 dark:text-gray-300 mb-1 text-xs">Format</label>
                                                    <select
                                                        value={q.format}
                                                        onChange={(e) => updateQuestion(qi, { format: e.target.value as ExpressionQuestionFormat })}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                    >
                                                        <option value="MULTIPLE_CHOICE">Multiple choice</option>
                                                        <option value="FREE_TEXT">Free text (AI-graded)</option>
                                                    </select>
                                                </div>
                                            )}
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="px-3 py-1 text-sm mt-5"
                                                onClick={() => setForm((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qi) }))}
                                            >
                                                Remove question
                                            </Button>
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-xs">
                                                {q.type === "CONTEXT"
                                                    ? "Situation prompt"
                                                    : q.type === "COMPLETION"
                                                    ? "Sentence with blank"
                                                    : "Source sentence to rewrite"}
                                            </label>
                                            <textarea
                                                value={q.prompt}
                                                onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                                                rows={2}
                                                placeholder={
                                                    q.type === "CONTEXT"
                                                        ? "Welche Situation passt zu dieser Wendung?"
                                                        : q.type === "COMPLETION"
                                                        ? "Nach langen Diskussionen hat die Regierung ________."
                                                        : "Die Regierung muss entscheiden, ob sie das Projekt unterstützt."
                                                }
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                            />
                                        </div>

                                        {(q.type !== "TRANSFORMATION" || q.format === "MULTIPLE_CHOICE") && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-gray-700 dark:text-gray-300 text-xs">
                                                        Options (mark the correct one)
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                        onClick={() =>
                                                            updateQuestion(qi, { options: [...q.options, { ...emptyQuestionOption }] })
                                                        }
                                                    >
                                                        + Add option
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {q.options.map((o, oi) => (
                                                        <div key={oi} className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`question-${qi}-correct`}
                                                                checked={o.correct}
                                                                onChange={() => setCorrectOption(qi, oi)}
                                                                className="h-4 w-4 shrink-0"
                                                            />
                                                            <Input
                                                                value={o.text}
                                                                onChange={(e) => updateQuestionOption(qi, oi, { text: e.target.value })}
                                                                placeholder={`Option ${oi + 1}`}
                                                                required={false}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="text-xs text-gray-500 dark:text-gray-400 hover:underline shrink-0"
                                                                onClick={() =>
                                                                    updateQuestion(qi, { options: q.options.filter((_, i) => i !== oi) })
                                                                }
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-xs">
                                                Explanation (shown after answering)
                                            </label>
                                            <Input
                                                value={q.explanation}
                                                onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                                                placeholder="Kurze Erklärung, warum diese Antwort richtig ist."
                                                required={false}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : editingEntry ? "Save changes" : "Save entry"}
                        </Button>
                    </form>
                </div>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">Existing entries</h2>
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading entries...</div>
                    ) : (
                        <div className="px-6 pb-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 mb-3">
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    Show
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
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
                                        value={entrySearch}
                                        onChange={(e) => {
                                            setEntrySearch(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Expression..."
                                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </label>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                        <tr>
                                            <th className="px-6 py-3">
                                                <button type="button" onClick={() => toggleEntrySort("expression")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Expression {renderEntrySortIcon("expression")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">
                                                <button type="button" onClick={() => toggleEntrySort("type")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Type {renderEntrySortIcon("type")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">
                                                <button type="button" onClick={() => toggleEntrySort("level")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Level {renderEntrySortIcon("level")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">
                                                <button type="button" onClick={() => toggleEntrySort("status")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Status {renderEntrySortIcon("status")}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedEntries.map((entry) => (
                                            <tr key={entry.id}>
                                                <td className="px-6 py-4 text-gray-900 dark:text-white">{entry.expression}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{entry.type}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary">{entry.level}</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={entry.status === "PUBLISHED" ? "default" : "secondary"}>
                                                        {entry.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                                    <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => startEdit(entry)}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => toggleVisibility(entry)}>
                                                        {entry.status === "PUBLISHED" ? "Hide" : "Show"}
                                                    </Button>
                                                    <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => removeEntry(entry)}>
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {sortedEntries.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                    No entries found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {sortedEntries.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Showing {startIndex} to {endIndex} of {sortedEntries.length} entries
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={currentPage === 1}
                                            onClick={() => setPage(1)}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronsLeft className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={currentPage === 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronLeft className="size-4" />
                                        </button>
                                        {entryPageNumbers.map((p, idx) => {
                                            const prev = entryPageNumbers[idx - 1];
                                            const showEllipsis = prev !== undefined && p - prev > 1;
                                            return (
                                                <div key={p} className="flex items-center gap-1">
                                                    {showEllipsis && <span className="px-1 text-gray-400 dark:text-gray-500">…</span>}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPage(p)}
                                                        className={`min-w-9 h-9 px-2 rounded-lg text-sm font-medium border ${
                                                            p === currentPage
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
                                            disabled={currentPage === totalPages}
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronRight className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setPage(totalPages)}
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
                isOpen={Boolean(entryToDelete)}
                title="Delete this entry?"
                message={`Delete "${entryToDelete?.expression}"? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemoveEntry}
                onCancel={() => setEntryToDelete(null)}
            />
            <ToastContainer />
        </div>
    );
}
