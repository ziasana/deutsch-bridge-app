"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import { getAdminRedemittelExercises, saveAdminRedemittelExercises } from "@/services/adminWritingService";
import { AdminRedemittelExercise, AuthoredExerciseType } from "@/types/redemittel";

const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const TYPE_INFO: Record<AuthoredExerciseType, { label: string; hint: string }> = {
    MEANING: { label: "Bedeutung", hint: "Lernende wählen die richtige Bedeutung. Ohne Frage wird „Was bedeutet: …“ angezeigt." },
    FILL_BLANK: { label: "Lücke", hint: "Ein Satz mit einer Lücke (___) und dem fehlenden Wort." },
    SITUATION: { label: "Situation", hint: "Eine Situation – Lernende wählen das passende Redemittel." },
    PRODUCTION: { label: "Eigener Satz", hint: "Ein Thema, zu dem Lernende einen eigenen Satz schreiben (wird nicht bewertet)." },
};

const emptyExercise = (type: AuthoredExerciseType, sortOrder: number): AdminRedemittelExercise => ({
    type, prompt: "", correctAnswer: "", wrongAnswers: [], sortOrder,
});

const errorMessage = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

/** Editor for the practice exercises of one Redemittel; the whole set is saved at once. */
export default function RedemittelExerciseEditor({ phraseId }: Readonly<{ phraseId: string }>) {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["admin", "writing", "exercises", phraseId],
        queryFn: () => getAdminRedemittelExercises(phraseId).then((r) => r.data),
    });
    // Local edits; null means "show what the server has".
    const [draft, setDraft] = useState<AdminRedemittelExercise[] | null>(null);
    const [saving, setSaving] = useState(false);
    const items = draft ?? data ?? [];

    const update = (index: number, patch: Partial<AdminRedemittelExercise>) =>
        setDraft(items.map((e, i) => (i === index ? { ...e, ...patch } : e)));

    const save = async () => {
        setSaving(true);
        try {
            const saved = await saveAdminRedemittelExercises(phraseId, items.map((e, i) => ({ ...e, sortOrder: i }))).then((r) => r.data);
            queryClient.setQueryData(["admin", "writing", "exercises", phraseId], saved);
            await queryClient.invalidateQueries({ queryKey: ["admin", "writing", "phrases"] });
            setDraft(null);
            toast.success("Übungen gespeichert.");
        } catch (err) {
            toast.error(errorMessage(err, "Speichern fehlgeschlagen."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <section aria-label="Übungen" className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Übungen für dieses Redemittel ({items.length})</h3>
                <p className="text-xs text-gray-500">Zusätzlich zu diesen Übungen entstehen automatisch eine Funktions-Frage sowie – wenn das Beispiel den Ausdruck enthält – Lückentext und Wortreihenfolge aus dem Beispielsatz. Eigener Satz gibt es nur mit einem hier angelegten Thema.</p>
            </div>
            {isLoading && <p className="text-sm text-gray-500">Wird geladen …</p>}

            {items.map((ex, i) => (
                <div key={ex.id ?? `new-${i}`} className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{TYPE_INFO[ex.type].label}</span>
                        <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => setDraft(items.filter((_, j) => j !== i))}>
                            Entfernen
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500">{TYPE_INFO[ex.type].hint}</p>

                    <label className="block text-sm text-gray-700 dark:text-gray-300">
                            {ex.type === "FILL_BLANK" ? "Satz mit Lücke (___)" : ex.type === "PRODUCTION" ? "Thema" : ex.type === "SITUATION" ? "Situation" : "Frage (optional)"}
                            <textarea
                                rows={2}
                                className={inputClass}
                                placeholder={ex.type === "FILL_BLANK" ? "Ich bin der ________, dass …" : undefined}
                                value={ex.prompt ?? ""}
                                onChange={(e) => update(i, { prompt: e.target.value })}
                            />
                    </label>

                    {ex.type !== "PRODUCTION" && (
                        <label className="block text-sm text-gray-700 dark:text-gray-300">
                            {ex.type === "FILL_BLANK" ? "Fehlendes Wort" : "Richtige Antwort"}
                            <input className={inputClass} value={ex.correctAnswer ?? ""} onChange={(e) => update(i, { correctAnswer: e.target.value })} />
                        </label>
                    )}

                    {(ex.type === "MEANING" || ex.type === "SITUATION") && (
                        <label className="block text-sm text-gray-700 dark:text-gray-300">
                            Falsche Antworten (eine pro Zeile, mindestens 2)
                            <textarea
                                rows={3}
                                className={inputClass}
                                value={ex.wrongAnswers.join("\n")}
                                onChange={(e) => update(i, { wrongAnswers: e.target.value.split("\n") })}
                            />
                        </label>
                    )}
                </div>
            ))}

            <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(TYPE_INFO) as AuthoredExerciseType[]).map((t) => (
                    <Button key={t} type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => setDraft([...items, emptyExercise(t, items.length)])}>
                        + {TYPE_INFO[t].label}
                    </Button>
                ))}
                <Button type="button" onClick={save} disabled={saving || draft === null}>
                    {saving ? "Speichern…" : "Übungen speichern"}
                </Button>
            </div>
        </section>
    );
}
