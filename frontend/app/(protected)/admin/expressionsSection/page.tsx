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
} from "@/services/expressionAdminService";
import {
    Expression,
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
const ITEMS_PER_PAGE = 10;

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
    const [page, setPage] = useState(1);

    const [form, setForm] = useState<ExpressionManualRequest>(emptyForm);
    const [editingEntry, setEditingEntry] = useState<Expression | null>(null);

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

    const removeEntry = (entry: Expression) => {
        if (!confirm(`Delete "${entry.expression}"?`)) return;
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

    const totalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginatedEntries = entries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Active Expressions</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Create and manage Nomen-Verb-Verbindungen and Redewendungen.
                </p>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
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

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">Existing entries</h2>
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading entries...</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto mt-4">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                        <tr>
                                            <th className="px-6 py-3">Expression</th>
                                            <th className="px-6 py-3">Type</th>
                                            <th className="px-6 py-3">Level</th>
                                            <th className="px-6 py-3">Status</th>
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
                                        {entries.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                    No entries found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-3 py-6">
                                    <Button
                                        variant="secondary"
                                        className="px-4 py-2 text-sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Zurück
                                    </Button>
                                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                                        Seite {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="secondary"
                                        className="px-4 py-2 text-sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Weiter
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {isSaving && <Loading message="Please wait..." />}
            <ToastContainer />
        </div>
    );
}
