"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
    getExamFieldPresets,
    createExamFieldPreset,
    updateExamFieldPreset,
    deleteExamFieldPreset,
} from "@/services/adminExamService";
import { ExamFieldPreset, ExamFieldPresetType, ExamSection } from "@/types/exam";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const FIELD_TYPE_TABS: { value: ExamFieldPresetType; label: string }[] = [
    { value: "TEIL_DESCRIPTION", label: "Teil description" },
    { value: "DEFAULT_EXPLANATION", label: "Default explanation" },
    { value: "DEFAULT_COMMON_MISTAKE", label: "Default common mistake" },
];

const emptyPresetForm = { label: "", value: "" };

interface ExamFieldPresetManagerProps {
    section: ExamSection;
    initialLevel: string;
}

/** The presets query key any dropdown/manager for this section+level shares, so saving here refreshes them too. */
export const examFieldPresetsQueryKey = (section: ExamSection, level: string) => ["admin", "exam", "field-presets", section, level];

/**
 * Inline "manage presets" panel for one exam section - admins add/edit/delete reusable snippets
 * for Teil description / default explanation / default common mistake, scoped to a level they pick
 * here (defaults to the exercise form's current level). Toggled open from ExamSectionManager.
 */
export default function ExamFieldPresetManager({ section, initialLevel }: Readonly<ExamFieldPresetManagerProps>) {
    const queryClient = useQueryClient();
    const [level, setLevel] = useState(initialLevel);
    const [fieldType, setFieldType] = useState<ExamFieldPresetType>("TEIL_DESCRIPTION");
    const [form, setForm] = useState(emptyPresetForm);
    const [editingPreset, setEditingPreset] = useState<ExamFieldPreset | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [presetToDelete, setPresetToDelete] = useState<ExamFieldPreset | null>(null);

    const queryKey = examFieldPresetsQueryKey(section, level);
    const { data: presets = [], isLoading } = useQuery({
        queryKey,
        queryFn: () => getExamFieldPresets(section, level).then((res) => res.data),
    });
    const presetsForTab = presets.filter((p) => p.fieldType === fieldType);

    const resetForm = () => {
        setForm(emptyPresetForm);
        setEditingPreset(null);
    };

    const startEdit = (preset: ExamFieldPreset) => {
        setEditingPreset(preset);
        setForm({ label: preset.label, value: preset.value });
    };

    // A plain click handler, not a <form onSubmit>: this panel renders inside ExamSectionManager's
    // own <form>, and nested <form> elements are invalid HTML - the browser flattens them, which
    // would silently misroute this submit into the outer exercise form instead.
    const submit = () => {
        if (!form.label.trim() || !form.value.trim()) {
            toast.error("Label and text are both required.");
            return;
        }

        const payload = { section, level, fieldType, label: form.label.trim(), value: form.value.trim() };
        setIsSaving(true);
        const request = editingPreset
            ? updateExamFieldPreset(editingPreset.id, payload)
            : createExamFieldPreset(payload);

        request
            .then(() => {
                toast.success(editingPreset ? "Preset updated." : "Preset saved.");
                resetForm();
                queryClient.invalidateQueries({ queryKey });
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save preset."))
            .finally(() => setIsSaving(false));
    };

    const confirmDelete = () => {
        const preset = presetToDelete;
        if (!preset) return;
        setPresetToDelete(null);
        deleteExamFieldPreset(preset.id)
            .then(() => {
                toast.success("Preset deleted.");
                if (editingPreset?.id === preset.id) resetForm();
                queryClient.invalidateQueries({ queryKey });
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete preset."));
    };

    return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-4 bg-gray-50 dark:bg-gray-900/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manage presets</h3>
                <div>
                    <label className="mr-2 text-xs text-gray-600 dark:text-gray-300">Level</label>
                    <select
                        value={level}
                        onChange={(e) => {
                            setLevel(e.target.value);
                            resetForm();
                        }}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                        {LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {FIELD_TYPE_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => {
                            setFieldType(tab.value);
                            resetForm();
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                            fieldType === tab.value
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {editingPreset && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                        Editing &quot;{editingPreset.label}&quot; —{" "}
                        <button type="button" className="underline" onClick={resetForm}>
                            cancel
                        </button>
                    </p>
                )}
                <div className="flex gap-3 flex-wrap items-start">
                    <div className="min-w-[160px]">
                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Label</label>
                        <Input
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                            onKeyDown={(e) => {
                                // No <form> wraps this panel (see the note on `submit`), so Enter
                                // would otherwise bubble up and submit the outer exercise form.
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                            placeholder="e.g. Standard Teil 1"
                            required={false}
                        />
                    </div>
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Text</label>
                        <Input
                            value={form.value}
                            onChange={(e) => setForm({ ...form, value: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                            required={false}
                        />
                    </div>
                    <Button type="button" variant="primary" disabled={isSaving} onClick={submit} className="px-3 py-2 text-sm self-end">
                        {isSaving ? "Saving..." : editingPreset ? "Save changes" : "Add preset"}
                    </Button>
                </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Loading presets...</p>}
                {!isLoading && presetsForTab.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No presets yet for {level}.</p>
                )}
                {presetsForTab.map((preset) => (
                    <div key={preset.id} className="flex items-start justify-between gap-3 py-2">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{preset.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{preset.value}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => startEdit(preset)}>
                                Edit
                            </Button>
                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setPresetToDelete(preset)}>
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                isOpen={Boolean(presetToDelete)}
                title="Delete this preset?"
                message={`Delete "${presetToDelete?.label}"? Exercises that already used its text keep it - only the saved preset goes away.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setPresetToDelete(null)}
            />
        </div>
    );
}
