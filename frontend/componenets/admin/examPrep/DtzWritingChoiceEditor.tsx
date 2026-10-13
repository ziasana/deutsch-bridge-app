"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import { createWritingChoice, updateWritingChoice } from "@/services/adminExamContentService";
import { getExamExerciseForAdmin } from "@/services/adminExamService";
import { errorMessage, fieldClass, labelClass } from "@/componenets/admin/examContent/shared";
import {
    WritingChoiceForm, WritingTaskForm, WRITING_COMMUNICATION_TYPES, emptyForm, formFromStored, toBody, validateWritingForm,
} from "./dtzWritingChoice";

interface Props {
    /** The exercise to edit; omitted = create a new draft by hand. */
    exerciseId?: string | null;
    onClose: () => void;
    /** Called after a successful save with the exercise id. */
    onSaved: (id: string) => void;
}

/**
 * DTZ Schreiben editor: the title and, for Aufgabe A and Aufgabe B, the situation, recipient, writing instruction and the four
 * content points. The backend runs the same checks as an import (two tasks, four points each) and returns advisory warnings.
 */
export default function DtzWritingChoiceEditor({ exerciseId, onClose, onSaved }: Readonly<Props>) {
    const [form, setForm] = useState<WritingChoiceForm>(emptyForm);
    const [loading, setLoading] = useState(!!exerciseId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!exerciseId) return;
        let cancelled = false;
        getExamExerciseForAdmin(exerciseId)
            .then((res) => { if (!cancelled) setForm(formFromStored(res.data.title, res.data.metadata)); })
            .catch((err) => { if (!cancelled) setError(errorMessage(err, "Could not load the exercise.")); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [exerciseId]);

    const setTask = (index: number, patch: Partial<WritingTaskForm>) =>
        setForm((f) => ({ ...f, tasks: f.tasks.map((t, i) => (i === index ? { ...t, ...patch } : t)) }));
    const setPoint = (index: number, pointIndex: number, value: string) =>
        setForm((f) => ({ ...f, tasks: f.tasks.map((t, i) => (i === index ? { ...t, points: t.points.map((p, j) => (j === pointIndex ? value : p)) } : t)) }));

    const save = async () => {
        const problem = validateWritingForm(form);
        setError(problem);
        if (problem) return;
        setSaving(true);
        try {
            const res = exerciseId ? await updateWritingChoice(exerciseId, toBody(form)) : await createWritingChoice(toBody(form));
            toast.success(exerciseId ? "Exercise saved." : "Exercise created as draft.");
            res.data.warnings.forEach((w) => toast.error(`Check: ${w.message}`));
            onSaved(res.data.id);
        } catch (err) {
            setError(errorMessage(err, "Could not save the exercise."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={exerciseId ? "Edit DTZ Schreiben exercise" : "Create DTZ Schreiben exercise"}>
            <div className="my-8 w-full max-w-5xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{exerciseId ? "Edit exercise" : "Create exercise"} · DTZ Schreiben</h2>
                    <button type="button" onClick={onClose} aria-label="Close editor" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="size-5" /></button>
                </div>
                {loading ? (
                    <Loading message="Loading..." />
                ) : (
                    <div className="mt-4 space-y-5">
                        <label className="block">
                            <span className={labelClass}>Title</span>
                            <input className={fieldClass} value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            The learner chooses one of the two tasks and writes about its four content points. The writing time (30 minutes) and the standard instructions are fixed.
                        </p>
                        <div className="grid gap-5 lg:grid-cols-2">
                            {form.tasks.map((t, i) => (
                                <fieldset key={t.taskLabel} className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">Aufgabe {t.taskLabel}</legend>
                                    <label className="block">
                                        <span className={labelClass}>Task {t.taskLabel} title</span>
                                        <input className={fieldClass} value={t.title} maxLength={200} onChange={(e) => setTask(i, { title: e.target.value })} />
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label>
                                            <span className={labelClass}>Task {t.taskLabel} topic</span>
                                            <input className={fieldClass} value={t.topic} maxLength={200} onChange={(e) => setTask(i, { topic: e.target.value })} />
                                        </label>
                                        <label>
                                            <span className={labelClass}>Task {t.taskLabel} communication type</span>
                                            <select className={fieldClass} value={t.communicationType} onChange={(e) => setTask(i, { communicationType: e.target.value })}>
                                                {WRITING_COMMUNICATION_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className={labelClass}>Task {t.taskLabel} situation</span>
                                        <textarea className={`${fieldClass} min-h-[84px]`} value={t.situation} maxLength={1200} onChange={(e) => setTask(i, { situation: e.target.value })} />
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label>
                                            <span className={labelClass}>Task {t.taskLabel} recipient name</span>
                                            <input className={fieldClass} value={t.recipientName} maxLength={200} onChange={(e) => setTask(i, { recipientName: e.target.value })} />
                                        </label>
                                        <label>
                                            <span className={labelClass}>Task {t.taskLabel} recipient role</span>
                                            <input className={fieldClass} value={t.recipientRole} maxLength={200} onChange={(e) => setTask(i, { recipientRole: e.target.value })} />
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className={labelClass}>Task {t.taskLabel} writing instruction</span>
                                        <textarea className={`${fieldClass} min-h-[60px]`} value={t.writingInstruction} maxLength={500} onChange={(e) => setTask(i, { writingInstruction: e.target.value })} />
                                    </label>
                                    {t.points.map((point, j) => (
                                        <label key={j} className="block">
                                            <span className={labelClass}>Task {t.taskLabel} point {j + 1}</span>
                                            <input className={fieldClass} value={point} maxLength={300} onChange={(e) => setPoint(i, j, e.target.value)} />
                                        </label>
                                    ))}
                                </fieldset>
                            ))}
                        </div>
                        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">{error}</p>}
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button disabled={saving} onClick={save}>{saving ? "Saving..." : exerciseId ? "Save changes" : "Create draft"}</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
