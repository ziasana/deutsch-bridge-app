"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import AdminTableControls from "@/componenets/admin/table/AdminTableControls";
import AdminTablePagination from "@/componenets/admin/table/AdminTablePagination";
import SortableTh from "@/componenets/admin/table/SortableTh";
import {
    createAdminWritingGuideItem,
    deleteAdminWritingGuideItem,
    getAdminWritingGuideItems,
    updateAdminWritingGuideItem,
} from "@/services/adminWritingService";
import { AdminWritingGuideItem, WritingGuideKind } from "@/types/writing";
import { WRITING_LEVELS } from "@/componenets/exam/writing/writingMeta";

const LEVELS = ["A1", ...WRITING_LEVELS] as string[];

const KIND_LABELS: Record<WritingGuideKind, string> = {
    FORMAT: "Prüfungsformat",
    STRATEGY_STEP: "Schreibstrategie (Schritt)",
    STRUCTURE_PART: "Textaufbau (Teil)",
    EXAMPLE: "Mustertext",
    SENTENCE_PATTERN: "Satzbaustein",
    MISTAKE: "Typischer Fehler",
    CHECKLIST_ITEM: "Checklisten-Punkt",
};

/** JSON payload hints per kind - the shape the learner UI reads. */
const DATA_TEMPLATES: Record<WritingGuideKind, string> = {
    FORMAT: '{"time": "ca. 30 Minuten", "requirements": ["Alle Leitpunkte beachten"]}',
    STRATEGY_STEP: '{"tips": ["Tipp 1"]}',
    STRUCTURE_PART: '{"examples": ["Liebe Anna,"], "phrases": ["Liebe/r …,"]}',
    EXAMPLE: '{"sections": [{"key": "greeting", "label": "Anrede", "text": "Liebe Anna,", "why": "Warum?", "phrases": ["Liebe Anna,"]}]}',
    SENTENCE_PATTERN: '{"examples": ["Ich bin der Meinung, dass …"]}',
    MISTAKE: '{"wrong": "Falsches Beispiel", "right": "Richtiges Beispiel"}',
    CHECKLIST_ITEM: "",
};

const cardClass =
    "bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)]";
const labelClass = "block text-gray-700 dark:text-gray-300 mb-2 text-sm";
const fieldClass =
    "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none";
const filterSelectClass =
    "rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

type SortKey = "title" | "kind" | "sortOrder" | "active";
type SortDirection = "asc" | "desc";

const emptyItem = (level: string): AdminWritingGuideItem => ({ level, kind: "STRATEGY_STEP", title: "", content: "", data: null, sortOrder: 0, active: true });

const errorMessage = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

/** Admin screen for "Schreiben lernen": the guide items (format, strategy, structure, examples, patterns, mistakes, checklist) per level. */
export default function WritingContentManager() {
    const queryClient = useQueryClient();
    const [level, setLevel] = useState("B1");
    const key = ["admin", "writing", "items", level];

    const { data: items = [], isLoading } = useQuery({ queryKey: key, queryFn: () => getAdminWritingGuideItems(level).then((r) => r.data) });

    const [form, setForm] = useState<AdminWritingGuideItem>(emptyItem(level));
    const [dataText, setDataText] = useState("");
    const [saving, setSaving] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<AdminWritingGuideItem | null>(null);
    const [kindFilter, setKindFilter] = useState<WritingGuideKind | "">("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("kind");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: key });
        await queryClient.invalidateQueries({ queryKey: ["writing", "learn", level] });
    };

    const reset = () => {
        setForm(emptyItem(level));
        setDataText("");
    };

    const changeLevel = (next: string) => {
        setLevel(next);
        setForm(emptyItem(next));
        setDataText("");
        setPage(1);
    };

    const startEdit = (item: AdminWritingGuideItem) => {
        setForm(item);
        setDataText(item.data ? JSON.stringify(item.data, null, 2) : "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        let data: unknown = null;
        if (dataText.trim()) {
            try {
                data = JSON.parse(dataText);
            } catch {
                toast.error("Data ist kein gültiges JSON.");
                return;
            }
        }
        setSaving(true);
        try {
            const payload = { ...form, level, data };
            if (form.id) await updateAdminWritingGuideItem(form.id, payload);
            else await createAdminWritingGuideItem(payload);
            toast.success(form.id ? "Entry updated." : "Entry saved.");
            reset();
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Speichern fehlgeschlagen."));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (item: AdminWritingGuideItem) => {
        try {
            await updateAdminWritingGuideItem(item.id!, { ...item, active: !item.active });
            toast.success(item.active ? "Entry hidden from students." : "Entry shown to students.");
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Failed to update entry."));
        }
    };

    const confirmRemove = async () => {
        const item = itemToDelete;
        if (!item?.id) return;
        setItemToDelete(null);
        try {
            await deleteAdminWritingGuideItem(item.id);
            toast.success("Entry deleted.");
            if (form.id === item.id) reset();
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Löschen fehlgeschlagen."));
        }
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
    const filtered = items
        .filter((i) => !kindFilter || i.kind === kindFilter)
        .filter((i) => !query || i.title.toLowerCase().includes(query));
    const valueFor = (i: AdminWritingGuideItem): string | number => {
        switch (sortKey) {
            case "title": return i.title.toLowerCase();
            case "kind": return KIND_LABELS[i.kind];
            case "sortOrder": return i.sortOrder;
            case "active": return i.active ? 1 : 0;
        }
    };
    const sorted = filtered.slice().sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        const va = valueFor(a);
        const vb = valueFor(b);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return a.sortOrder - b.sortOrder;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, sorted.length);
    const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10" dir="ltr">
            <div className="max-w-7xl mx-auto">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Schreiben lernen</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        Create and manage the learning content of the writing module for each level. Redemittel are managed under Manage Redemittel.
                    </p>
                </div>

                <div className={`${cardClass} mt-6 p-6`}>
                    <div className="max-w-xs">
                        <label className={labelClass}>Level</label>
                        <select className={fieldClass} value={level} onChange={(e) => changeLevel(e.target.value)} aria-label="Niveau">
                            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                <form onSubmit={save} className={`${cardClass} mt-8 p-6 space-y-6`}>
                    {form.id && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Editing &quot;{form.title}&quot; —{" "}
                            <button type="button" className="underline" onClick={reset}>
                                cancel
                            </button>
                        </p>
                    )}

                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[220px]">
                            <label className={labelClass}>Art</label>
                            <select
                                className={fieldClass}
                                value={form.kind}
                                onChange={(e) => {
                                    const kind = e.target.value as WritingGuideKind;
                                    setForm({ ...form, kind });
                                    if (!form.id && !dataText.trim()) setDataText(DATA_TEMPLATES[kind]);
                                }}
                            >
                                {(Object.keys(KIND_LABELS) as WritingGuideKind[]).map((k) => (
                                    <option key={k} value={k}>{KIND_LABELS[k]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-[2] min-w-[260px]">
                            <label className={labelClass}>Titel</label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Schritt 1: Aufgabe lesen" />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className={labelClass}>Reihenfolge</label>
                            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Inhalt (Erklärung / Zweck / Aufgabenstellung)</label>
                        <textarea className={fieldClass} rows={3} value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Data (JSON, je nach Art)</label>
                        <textarea
                            className={`${fieldClass} font-mono text-xs`}
                            rows={6}
                            value={dataText}
                            onChange={(e) => setDataText(e.target.value)}
                            placeholder={DATA_TEMPLATES[form.kind]}
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktiv (für Lernende sichtbar)
                    </label>
                    <Button type="submit" disabled={saving}>{saving ? "Saving..." : form.id ? "Save changes" : "Save entry"}</Button>
                </form>

                <div className={`${cardClass} mt-8 overflow-hidden`}>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">Existing entries ({level})</h2>
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading entries...</div>
                    ) : (
                        <div className="px-6 pb-6">
                            <div className="mt-4 mb-3 space-y-3">
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    Art
                                    <select
                                        className={filterSelectClass}
                                        value={kindFilter}
                                        onChange={(e) => { setKindFilter(e.target.value as WritingGuideKind | ""); setPage(1); }}
                                        aria-label="Art filtern"
                                    >
                                        <option value="">Alle</option>
                                        {(Object.keys(KIND_LABELS) as WritingGuideKind[]).map((k) => (
                                            <option key={k} value={k}>{KIND_LABELS[k]}</option>
                                        ))}
                                    </select>
                                </label>
                                <AdminTableControls
                                    pageSize={pageSize}
                                    onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                                    search={search}
                                    onSearchChange={(v) => { setSearch(v); setPage(1); }}
                                    searchPlaceholder="Titel..."
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                        <tr>
                                            <SortableTh label="Titel" active={sortKey === "title"} direction={sortDirection} onClick={() => toggleSort("title")} />
                                            <SortableTh label="Art" active={sortKey === "kind"} direction={sortDirection} onClick={() => toggleSort("kind")} />
                                            <SortableTh label="Reihenfolge" active={sortKey === "sortOrder"} direction={sortDirection} onClick={() => toggleSort("sortOrder")} />
                                            <SortableTh label="Status" active={sortKey === "active"} direction={sortDirection} onClick={() => toggleSort("active")} />
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginated.map((i) => (
                                            <tr key={i.id}>
                                                <td className="px-6 py-4 text-gray-900 dark:text-white">{i.title}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{KIND_LABELS[i.kind]}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{i.sortOrder}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={i.active ? "default" : "secondary"}>{i.active ? "ACTIVE" : "INACTIVE"}</Badge>
                                                </td>
                                                <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                                    <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => startEdit(i)}>Edit</Button>
                                                    <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => toggleActive(i)}>{i.active ? "Hide" : "Show"}</Button>
                                                    <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => setItemToDelete(i)}>Delete</Button>
                                                </td>
                                            </tr>
                                        ))}
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
                isOpen={Boolean(itemToDelete)}
                title="Delete this entry?"
                message={`Delete "${itemToDelete?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemove}
                onCancel={() => setItemToDelete(null)}
            />
        </div>
    );
}
