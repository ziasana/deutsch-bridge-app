"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import RichTextEditor from "@/componenets/RichTextEditor";
import { htmlToPlainText } from "@/lib/richTextPlainText";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import AdminTableControls from "@/componenets/admin/table/AdminTableControls";
import AdminTablePagination from "@/componenets/admin/table/AdminTablePagination";
import SortableTh from "@/componenets/admin/table/SortableTh";
import {
    createAdminWritingPhrase,
    deleteAdminWritingPhrase,
    getAdminRedemittelExerciseCounts,
    getAdminRedemittelFunctions,
    bulkImportRedemittel,
    getAdminWritingPhrases,
    updateAdminWritingPhrase,
} from "@/services/adminWritingService";
import { AdminWritingPhrase, WritingFormality } from "@/types/writing";
import { FORMALITY_LABELS, WRITING_LEVELS } from "@/componenets/exam/writing/writingMeta";
import { CONTEXT_LABELS } from "@/componenets/redemittel/redemittelMeta";
import { RedemittelBulkImportResult, RedemittelContext } from "@/types/redemittel";
import { CheckCircle2, Upload, XCircle } from "lucide-react";
import RedemittelExerciseEditor from "./RedemittelExerciseEditor";

export const FUNCTIONS_KEY = ["admin", "writing", "functions"];

const LEVELS = ["A1", ...WRITING_LEVELS] as string[];

const labelClass = "block text-gray-700 dark:text-gray-300 mb-2 text-sm";
const selectClass =
    "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none";
const plainText = (html: string) => htmlToPlainText(html).trim();
const cardClass =
    "bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)]";

type SortKey = "phrase" | "category" | "exercises" | "active";
type SortDirection = "asc" | "desc";

const emptyPhrase = (level: string): AdminWritingPhrase => ({
    level, category: "", phrase: "", explanation: "", example: "", formality: "NEUTRAL", usageNote: "", sortOrder: 0, active: true,
    meaningEn: "", meaningFa: "", grammarPattern: "", commonMistake: "", similarExpressions: [], contexts: [],
});

const errorMessage = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

/** Admin screen for the Redemittel learning module: the phrases of one level plus their practice exercises. */
export default function RedemittelManager() {
    const queryClient = useQueryClient();
    const [level, setLevel] = useState("B1");
    const key = ["admin", "writing", "phrases", level];

    const { data: phrases = [], isLoading } = useQuery({ queryKey: key, queryFn: () => getAdminWritingPhrases(level).then((r) => r.data) });
    const { data: exerciseCounts = {} } = useQuery({
        queryKey: ["admin", "writing", "exercise-counts", level],
        queryFn: () => getAdminRedemittelExerciseCounts(level).then((r) => r.data),
    });

    const { data: functions = [] } = useQuery({ queryKey: FUNCTIONS_KEY, queryFn: () => getAdminRedemittelFunctions().then((r) => r.data) });
    const functionLabel = (id: string) => functions.find((f) => f.id === id)?.label ?? id;

    const [form, setForm] = useState<AdminWritingPhrase>(emptyPhrase(level));
    const [saving, setSaving] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [bulkResult, setBulkResult] = useState<RedemittelBulkImportResult | null>(null);
    const [phraseToDelete, setPhraseToDelete] = useState<AdminWritingPhrase | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("phrase");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: key });
        await queryClient.invalidateQueries({ queryKey: ["writing", "learn", level] });
        await queryClient.invalidateQueries({ queryKey: ["redemittel"] });
    };

    const changeLevel = (next: string) => {
        setLevel(next);
        setForm(emptyPhrase(next));
        setPage(1);
    };

    const startEdit = (p: AdminWritingPhrase) => {
        setForm(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // An emptied rich-text field is "<p></p>", which should count as no content.
            const payload = {
                ...form,
                level,
                explanation: plainText(form.explanation ?? "") ? form.explanation : null,
                usageNote: plainText(form.usageNote ?? "") ? form.usageNote : null,
            };
            if (form.id) await updateAdminWritingPhrase(form.id, payload);
            else await createAdminWritingPhrase(payload);
            toast.success(form.id ? "Entry updated." : "Entry saved.");
            setForm(emptyPhrase(level));
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Speichern fehlgeschlagen."));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (p: AdminWritingPhrase) => {
        try {
            await updateAdminWritingPhrase(p.id!, { ...p, active: !p.active });
            toast.success(p.active ? "Entry hidden from students." : "Entry shown to students.");
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Failed to update entry."));
        }
    };

    const confirmRemove = async () => {
        const phrase = phraseToDelete;
        if (!phrase?.id) return;
        setPhraseToDelete(null);
        try {
            await deleteAdminWritingPhrase(phrase.id);
            toast.success("Entry deleted.");
            if (form.id === phrase.id) setForm(emptyPhrase(level));
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Löschen fehlgeschlagen."));
        }
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
            toast.error("Expected a non-empty JSON array of Redemittel.");
            return;
        }

        setIsBulkImporting(true);
        setBulkResult(null);
        bulkImportRedemittel(parsed)
            .then(async (res) => {
                setBulkResult(res.data);
                if (res.data.successCount > 0) await refresh();
                if (res.data.failureCount === 0) {
                    toast.success(`Imported ${res.data.successCount} Redemittel.`);
                } else {
                    toast.error(`${res.data.successCount} imported, ${res.data.failureCount} failed - see details below.`);
                }
            })
            .catch((err) => {
                const status = (err as { response?: { status?: number } })?.response?.status;
                const data = (err as { response?: { data?: unknown } })?.response?.data;
                const detail = typeof data === "string" && data ? data : errorMessage(err, "");
                toast.error(`Bulk import failed${status ? ` (HTTP ${status})` : " (no response from the server)"}${detail ? `: ${detail}` : "."}`);
            })
            .finally(() => setIsBulkImporting(false));
    };

    const closeBulkImport = () => {
        setShowBulkImport(false);
        setBulkText("");
        setBulkResult(null);
    };

    const toggleSort = (k: SortKey) => {
        if (sortKey === k) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(k);
            setSortDirection("asc");
        }
        setPage(1);
    };

    const query = search.trim().toLowerCase();
    const filtered = query ? phrases.filter((p) => p.phrase.toLowerCase().includes(query)) : phrases;
    const valueFor = (p: AdminWritingPhrase): string | number => {
        switch (sortKey) {
            case "phrase": return p.phrase.toLowerCase();
            case "category": return functionLabel(p.category);
            case "exercises": return p.id ? exerciseCounts[p.id] ?? 0 : 0;
            case "active": return p.active ? 1 : 0;
        }
    };
    const sorted = filtered.slice().sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        const va = valueFor(a);
        const vb = valueFor(b);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, sorted.length);
    const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10" dir="ltr">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Manage Redemittel</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Create and manage Redemittel and their practice exercises for each level.
                        </p>
                    </div>
                    <Button type="button" variant="secondary" className="flex items-center gap-2" onClick={() => setShowBulkImport((prev) => !prev)}>
                        <Upload className="size-4" />
                        Bulk upload
                    </Button>
                </div>

                <div className={`${cardClass} mt-6 p-6`}>
                    <div className="max-w-xs">
                        <label className={labelClass}>Level</label>
                        <select className={selectClass} value={level} onChange={(e) => changeLevel(e.target.value)} aria-label="Niveau">
                            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                {showBulkImport && (
                    <div className={`${cardClass} mt-6 p-6 space-y-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk upload</h2>
                            <button type="button" className="text-sm text-gray-500 dark:text-gray-400 underline" onClick={closeBulkImport}>
                                Close
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Paste or upload a JSON array of Redemittel, in the same shape as the form below. Each row is imported
                            independently - a mistake in one row won&apos;t block the rest. Required fields per row: <code>phrase</code>,{" "}
                            <code>level</code> (<code>A1</code>-<code>C2</code>), <code>function</code> (the name of an existing Funktion).
                            A Redemittel that already exists on the same level is skipped with an error.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <code>formality</code> must be one of: <code>INFORMAL</code>, <code>NEUTRAL</code>, <code>FORMAL</code>.{" "}
                            <code>contexts[]</code> may contain: {(Object.keys(CONTEXT_LABELS) as RedemittelContext[]).map((c, i) => (
                                <span key={c}>{i > 0 && ", "}<code>{c}</code></span>
                            ))}. <code>exercises[].type</code> must be one of: <code>MEANING</code>, <code>FILL_BLANK</code>,{" "}
                            <code>SITUATION</code>, <code>PRODUCTION</code>.
                        </p>
                        <p className="text-sm">
                            <a href="/templates/redemittel-bulk-import-template.json" download className="text-blue-600 dark:text-blue-400 underline">
                                Download template JSON
                            </a>
                            {" · "}
                            <a href="/templates/redemittel-bulk-import-guide.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">
                                Field reference guide
                            </a>
                        </p>
                        <details className="text-sm text-gray-600 dark:text-gray-300">
                            <summary className="cursor-pointer select-none">Show example row</summary>
                            <pre className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-x-auto text-xs">
{`[
  {
    "level": "B1",
    "function": "Meinung äußern",
    "phrase": "Ich bin der Meinung, dass …",
    "example": "Ich bin der Meinung, dass Busse billiger sein sollten.",
    "explanation": "<p>Leitet die <strong>eigene Meinung</strong> ein.</p>",
    "usageNote": "<p>Neutral bis formell.</p>",
    "formality": "NEUTRAL",
    "meaningEn": "I am of the opinion that …",
    "grammarPattern": "Ich bin der Meinung, dass + Nebensatz",
    "similarExpressions": ["Ich finde, dass …"],
    "contexts": ["WRITING", "DISCUSSION"],
    "exercises": [
      { "type": "MEANING", "correctAnswer": "Ich denke, dass …", "wrongAnswers": ["Ich weiß nicht, ob …", "Ich möchte gern …"] },
      { "type": "FILL_BLANK", "prompt": "Ich bin der ___, dass …", "correctAnswer": "Meinung" }
    ]
  }
]`}
                            </pre>
                        </details>

                        <div className="flex flex-col gap-2">
                            <input type="file" accept="application/json,.json" onChange={handleBulkFileSelected} className="text-sm text-gray-600 dark:text-gray-300" />
                            <textarea
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                placeholder="Paste a JSON array of Redemittel here, or upload a .json file above."
                                rows={10}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <Button type="button" variant="primary" onClick={runBulkImport} disabled={isBulkImporting || !bulkText.trim()}>
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
                                            {row.success ? <CheckCircle2 className="size-4 shrink-0 mt-0.5" /> : <XCircle className="size-4 shrink-0 mt-0.5" />}
                                            <span>
                                                Row {row.index + 1}
                                                {row.phrase ? ` (${row.phrase})` : ""}: {row.success ? "imported" : row.errorMessage}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={save} className={`${cardClass} mt-8 p-6 space-y-6`}>
                    {form.id && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Editing &quot;{plainText(form.phrase)}&quot; —{" "}
                            <button type="button" className="underline" onClick={() => setForm(emptyPhrase(level))}>
                                cancel
                            </button>
                        </p>
                    )}

                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <label className={labelClass}>Funktion</label>
                            <select className={selectClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                                <option value="" disabled>Funktion wählen…</option>
                                {functions.map((f) => (
                                    <option key={f.id} value={f.id}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[160px]">
                            <label className={labelClass}>Register</label>
                            <select className={selectClass} value={form.formality ?? ""} onChange={(e) => setForm({ ...form, formality: (e.target.value || null) as WritingFormality | null })}>
                                <option value="">–</option>
                                {(Object.keys(FORMALITY_LABELS) as WritingFormality[]).map((f) => (
                                    <option key={f} value={f}>{FORMALITY_LABELS[f]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className={labelClass}>Reihenfolge</label>
                            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Redemittel</label>
                        <Input value={form.phrase} onChange={(e) => setForm({ ...form, phrase: e.target.value })} placeholder="Ich bin der Meinung, dass …" />
                    </div>
                    <div>
                        <label className={labelClass}>Beispiel</label>
                        <Input required={false} value={form.example ?? ""} onChange={(e) => setForm({ ...form, example: e.target.value })} placeholder="Ich bin der Meinung, dass Busse billiger sein sollten." />
                    </div>
                    <div>
                        <label className={labelClass}>Erklärung</label>
                        <RichTextEditor value={form.explanation ?? ""} onChange={(html) => setForm((prev) => ({ ...prev, explanation: html }))} placeholder="Erkläre, wann und wie das Redemittel verwendet wird..." />
                    </div>
                    <div>
                        <label className={labelClass}>Hinweis zur Verwendung</label>
                        <RichTextEditor value={form.usageNote ?? ""} onChange={(html) => setForm((prev) => ({ ...prev, usageNote: html }))} placeholder="Hinweise zur Verwendung..." />
                    </div>

                    <fieldset className="space-y-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <legend className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">Lernmodul „Redemittel“ (optional)</legend>
                        <div className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[240px]">
                                <label className={labelClass}>Bedeutung (Englisch)</label>
                                <Input required={false} value={form.meaningEn ?? ""} onChange={(e) => setForm({ ...form, meaningEn: e.target.value })} />
                            </div>
                            <div className="flex-1 min-w-[240px]">
                                <label className={labelClass}>Bedeutung (Persisch)</label>
                                <Input required={false} dir="rtl" value={form.meaningFa ?? ""} onChange={(e) => setForm({ ...form, meaningFa: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Grammatik / Struktur</label>
                            <Input required={false} placeholder="Ich bin der Meinung, dass + Nebensatz" value={form.grammarPattern ?? ""} onChange={(e) => setForm({ ...form, grammarPattern: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Häufiger Fehler</label>
                            <textarea rows={2} className={selectClass} placeholder={"❌ Ich bin Meinung, dass …\n✓ Ich bin der Meinung, dass …"} value={form.commonMistake ?? ""} onChange={(e) => setForm({ ...form, commonMistake: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Ähnliche Redemittel (eins pro Zeile)</label>
                            <textarea rows={3} className={selectClass} value={form.similarExpressions.join("\n")} onChange={(e) => setForm({ ...form, similarExpressions: e.target.value.split("\n") })} />
                        </div>
                        <div>
                            <span className={labelClass}>Verwendung</span>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                                {(Object.keys(CONTEXT_LABELS) as RedemittelContext[]).map((c) => (
                                    <label key={c} className="flex items-center gap-1.5">
                                        <input
                                            type="checkbox"
                                            checked={form.contexts.includes(c)}
                                            onChange={(e) => setForm({ ...form, contexts: e.target.checked ? [...form.contexts, c] : form.contexts.filter((x) => x !== c) })}
                                        />
                                        {CONTEXT_LABELS[c]}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </fieldset>

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktiv (für Lernende sichtbar)
                    </label>
                    <Button type="submit" disabled={saving}>{saving ? "Saving..." : form.id ? "Save changes" : "Save entry"}</Button>
                </form>

                {form.id && (
                    <div className={`${cardClass} mt-6 p-6`}>
                        <RedemittelExerciseEditor key={form.id} phraseId={form.id} level={level} />
                    </div>
                )}

                <div className={`${cardClass} mt-8 overflow-hidden`}>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">Existing entries</h2>
                    {isLoading ? (
                        <Loading message="Loading entries..." />
                    ) : (
                        <div className="px-6 pb-6">
                            <div className="mt-4 mb-3">
                                <AdminTableControls
                                    pageSize={pageSize}
                                    onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                                    search={search}
                                    onSearchChange={(v) => { setSearch(v); setPage(1); }}
                                    searchPlaceholder="Redemittel..."
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                        <tr>
                                            <SortableTh label="Redemittel" active={sortKey === "phrase"} direction={sortDirection} onClick={() => toggleSort("phrase")} />
                                            <SortableTh label="Funktion" active={sortKey === "category"} direction={sortDirection} onClick={() => toggleSort("category")} />
                                            <SortableTh label="Exercises" active={sortKey === "exercises"} direction={sortDirection} onClick={() => toggleSort("exercises")} />
                                            <SortableTh label="Status" active={sortKey === "active"} direction={sortDirection} onClick={() => toggleSort("active")} />
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginated.map((p) => {
                                            const count = p.id ? exerciseCounts[p.id] ?? 0 : 0;
                                            return (
                                                <tr key={p.id}>
                                                    <td className="px-6 py-4 text-gray-900 dark:text-white">{p.phrase}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{functionLabel(p.category)}</td>
                                                    <td className="px-6 py-4">
                                                        {count === 0 ? (
                                                            <span className="text-sm text-orange-600">keine Übungen</span>
                                                        ) : (
                                                            <span className="text-sm text-gray-600 dark:text-gray-300">{count} Übungen</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "ACTIVE" : "INACTIVE"}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                                        <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => startEdit(p)}>Edit</Button>
                                                        <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => toggleActive(p)}>{p.active ? "Hide" : "Show"}</Button>
                                                        <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => setPhraseToDelete(p)}>Delete</Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {sorted.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                    No entries found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4">
                                <AdminTablePagination
                                    page={currentPage}
                                    totalPages={totalPages}
                                    totalItems={sorted.length}
                                    startIndex={startIndex}
                                    endIndex={endIndex}
                                    onPageChange={setPage}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {saving && <Loading message="Please wait..." />}
            <ConfirmDialog
                isOpen={Boolean(phraseToDelete)}
                title="Delete this entry?"
                message={`Delete "${phraseToDelete?.phrase}"? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemove}
                onCancel={() => setPhraseToDelete(null)}
            />
        </div>
    );
}
