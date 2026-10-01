"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import {
    createAdminWritingGuideItem,
    createAdminWritingPhrase,
    deleteAdminWritingGuideItem,
    deleteAdminWritingPhrase,
    getAdminWritingGuideItems,
    getAdminWritingPhrases,
    updateAdminWritingGuideItem,
    updateAdminWritingPhrase,
} from "@/services/adminWritingService";
import { AdminWritingGuideItem, AdminWritingPhrase, WritingFormality, WritingGuideKind, WritingPhraseCategory } from "@/types/writing";
import { FORMALITY_LABELS, PHRASE_CATEGORY_LABELS, WRITING_LEVELS } from "@/componenets/exam/writing/writingMeta";

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

const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm";
const cardClass = "bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6";

const emptyItem = (level: string): AdminWritingGuideItem => ({ level, kind: "STRATEGY_STEP", title: "", content: "", data: null, sortOrder: 0, active: true });
const emptyPhrase = (level: string): AdminWritingPhrase => ({
    level, category: "OPINION", phrase: "", explanation: "", example: "", formality: "NEUTRAL", usageNote: "", sortOrder: 0, active: true,
});

const errorMessage = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

function GuideItems({ level }: Readonly<{ level: string }>) {
    const queryClient = useQueryClient();
    const key = ["admin", "writing", "items", level];
    const { data: items = [] } = useQuery({ queryKey: key, queryFn: () => getAdminWritingGuideItems(level).then((r) => r.data) });
    const [form, setForm] = useState<AdminWritingGuideItem>(emptyItem(level));
    const [dataText, setDataText] = useState("");
    const [saving, setSaving] = useState(false);

    const reset = () => {
        setForm(emptyItem(level));
        setDataText("");
    };

    const edit = (item: AdminWritingGuideItem) => {
        setForm(item);
        setDataText(item.data ? JSON.stringify(item.data, null, 2) : "");
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
            toast.success("Gespeichert.");
            reset();
            await queryClient.invalidateQueries({ queryKey: key });
            await queryClient.invalidateQueries({ queryKey: ["writing", "learn", level] });
        } catch (err) {
            toast.error(errorMessage(err, "Speichern fehlgeschlagen."));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm("Diesen Eintrag löschen?")) return;
        try {
            await deleteAdminWritingGuideItem(id);
            await queryClient.invalidateQueries({ queryKey: key });
            await queryClient.invalidateQueries({ queryKey: ["writing", "learn", level] });
        } catch (err) {
            toast.error(errorMessage(err, "Löschen fehlgeschlagen."));
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={save} className={`${cardClass} space-y-3`}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{form.id ? "Eintrag bearbeiten" : "Neuer Eintrag"} ({level})</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Art
                        <select
                            className={inputClass}
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
                    </label>
                    <label className="text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
                        Titel
                        <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </label>
                </div>
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Inhalt (Erklärung / Zweck / Aufgabenstellung)
                    <textarea className={inputClass} rows={3} value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                </label>
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Data (JSON, je nach Art)
                    <textarea className={`${inputClass} font-mono text-xs`} rows={6} value={dataText} onChange={(e) => setDataText(e.target.value)} placeholder={DATA_TEMPLATES[form.kind]} />
                </label>
                <div className="flex flex-wrap items-center gap-4">
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Reihenfolge
                        <input type="number" className={`${inputClass} w-24`} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktiv
                    </label>
                </div>
                <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
                    {form.id && <Button type="button" variant="secondary" onClick={reset}>Abbrechen</Button>}
                </div>
            </form>

            <div className={cardClass}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lerninhalte {level} ({items.length})</h2>
                <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((i) => (
                        <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <span className="min-w-0 text-gray-800 dark:text-gray-200">
                                <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">{KIND_LABELS[i.kind]}</span>
                                {i.title}
                                {!i.active && <span className="ml-2 text-xs text-orange-600">inaktiv</span>}
                            </span>
                            <span className="flex shrink-0 gap-2">
                                <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => edit(i)}>Bearbeiten</Button>
                                <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => remove(i.id!)}>Löschen</Button>
                            </span>
                        </li>
                    ))}
                    {items.length === 0 && <li className="py-4 text-sm text-gray-500">Noch keine Inhalte für dieses Niveau.</li>}
                </ul>
            </div>
        </div>
    );
}

function Phrases({ level }: Readonly<{ level: string }>) {
    const queryClient = useQueryClient();
    const key = ["admin", "writing", "phrases", level];
    const { data: phrases = [] } = useQuery({ queryKey: key, queryFn: () => getAdminWritingPhrases(level).then((r) => r.data) });
    const [form, setForm] = useState<AdminWritingPhrase>(emptyPhrase(level));
    const [saving, setSaving] = useState(false);

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: key });
        await queryClient.invalidateQueries({ queryKey: ["writing", "learn", level] });
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, level };
            if (form.id) await updateAdminWritingPhrase(form.id, payload);
            else await createAdminWritingPhrase(payload);
            toast.success("Gespeichert.");
            setForm(emptyPhrase(level));
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Speichern fehlgeschlagen."));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm("Dieses Redemittel löschen?")) return;
        try {
            await deleteAdminWritingPhrase(id);
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Löschen fehlgeschlagen."));
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={save} className={`${cardClass} space-y-3`}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{form.id ? "Redemittel bearbeiten" : "Neues Redemittel"} ({level})</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Funktion
                        <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as WritingPhraseCategory })}>
                            {(Object.keys(PHRASE_CATEGORY_LABELS) as WritingPhraseCategory[]).map((c) => (
                                <option key={c} value={c}>{PHRASE_CATEGORY_LABELS[c]}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Register
                        <select className={inputClass} value={form.formality ?? ""} onChange={(e) => setForm({ ...form, formality: (e.target.value || null) as WritingFormality | null })}>
                            <option value="">–</option>
                            {(Object.keys(FORMALITY_LABELS) as WritingFormality[]).map((f) => (
                                <option key={f} value={f}>{FORMALITY_LABELS[f]}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Reihenfolge
                        <input type="number" className={inputClass} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                    </label>
                </div>
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Redemittel
                    <input className={inputClass} value={form.phrase} onChange={(e) => setForm({ ...form, phrase: e.target.value })} required />
                </label>
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Beispiel
                    <input className={inputClass} value={form.example ?? ""} onChange={(e) => setForm({ ...form, example: e.target.value })} />
                </label>
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Erklärung
                    <input className={inputClass} value={form.explanation ?? ""} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
                </label>
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Hinweis zur Verwendung
                    <input className={inputClass} value={form.usageNote ?? ""} onChange={(e) => setForm({ ...form, usageNote: e.target.value })} />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktiv
                </label>
                <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
                    {form.id && <Button type="button" variant="secondary" onClick={() => setForm(emptyPhrase(level))}>Abbrechen</Button>}
                </div>
            </form>

            <div className={cardClass}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Redemittel {level} ({phrases.length})</h2>
                <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
                    {phrases.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <span className="min-w-0 text-gray-800 dark:text-gray-200">
                                <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">{PHRASE_CATEGORY_LABELS[p.category]}</span>
                                {p.phrase}
                                {!p.active && <span className="ml-2 text-xs text-orange-600">inaktiv</span>}
                            </span>
                            <span className="flex shrink-0 gap-2">
                                <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => setForm(p)}>Bearbeiten</Button>
                                <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => remove(p.id!)}>Löschen</Button>
                            </span>
                        </li>
                    ))}
                    {phrases.length === 0 && <li className="py-4 text-sm text-gray-500">Noch keine Redemittel für dieses Niveau.</li>}
                </ul>
            </div>
        </div>
    );
}

/** Admin screen for "Schreiben lernen": guide items and Redemittel per level. */
export default function WritingContentManager() {
    const [level, setLevel] = useState<string>("B1");
    const [tab, setTab] = useState<"items" | "phrases">("items");

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-6 py-10" dir="ltr">
            <div className="mx-auto max-w-4xl space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Schreiben lernen – Inhalte</h1>
                <div className="flex flex-wrap items-center gap-3">
                    <select className={`${inputClass} w-28`} value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Niveau">
                        {WRITING_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <Button type="button" variant={tab === "items" ? "primary" : "secondary"} onClick={() => setTab("items")}>Lerninhalte</Button>
                    <Button type="button" variant={tab === "phrases" ? "primary" : "secondary"} onClick={() => setTab("phrases")}>Redemittel</Button>
                </div>
                {tab === "items" ? <GuideItems key={`i-${level}`} level={level} /> : <Phrases key={`p-${level}`} level={level} />}
            </div>
        </div>
    );
}
