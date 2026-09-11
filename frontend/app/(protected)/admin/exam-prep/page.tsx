"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import useAuthStore from "@/store/useAuthStore";
import {
    getExamExercisesForAdmin,
    createExamExercise,
    updateExamExercise,
    deleteExamExercise,
} from "@/services/adminExamService";
import { ExamExerciseResponse, ExamPassage, ExamQuestion, ExamTaskType } from "@/types/exam";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const TASK_TYPES: ExamTaskType[] = ["MATCHING", "MULTIPLE_CHOICE", "TRUE_FALSE_NOT_GIVEN"];
const TFN_ANSWERS = ["RICHTIG", "FALSCH", "NICHT_IM_TEXT"];

const emptyForm = {
    title: "",
    taskType: "MULTIPLE_CHOICE" as ExamTaskType,
    level: "B1",
    partNumber: "",
    defaultExplanation: "",
    defaultCommonMistake: "",
    published: true,
};

const emptyPassage = (): ExamPassage => ({ id: crypto.randomUUID(), label: "", content: "" });

const emptyQuestion = (taskType: ExamTaskType): ExamQuestion => ({
    id: "",
    taskType,
    prompt: taskType === "MATCHING" ? "Welche Überschrift passt zu diesem Text?" : "",
    sectionIndex: null,
    options: taskType === "MULTIPLE_CHOICE" ? [] : null,
    correctAnswer: taskType === "TRUE_FALSE_NOT_GIVEN" ? "RICHTIG" : "",
    explanation: "",
    commonMistake: "",
});

export default function AdminExamPrepPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [exercises, setExercises] = useState<ExamExerciseResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState(emptyForm);
    const [passages, setPassages] = useState<ExamPassage[]>([]);
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [answerOptions, setAnswerOptions] = useState<string[]>([]);
    const [editingExercise, setEditingExercise] = useState<ExamExerciseResponse | null>(null);

    const fetchExercises = useCallback(() => {
        getExamExercisesForAdmin()
            .then((res) => setExercises(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load exercises."))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchExercises();
    }, [hasHydrated, userProfile, router, fetchExercises]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const resetForm = () => {
        setForm(emptyForm);
        setPassages([]);
        setQuestions([]);
        setAnswerOptions([]);
        setEditingExercise(null);
    };

    const changeTaskType = (taskType: ExamTaskType) => {
        setForm({ ...form, taskType });
        setQuestions((prev) => prev.map((q) => ({ ...q, taskType })));
    };

    const updatePassage = (idx: number, field: "label" | "content", value: string) => {
        setPassages((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
    };
    const removePassage = (idx: number) => setPassages((prev) => prev.filter((_, i) => i !== idx));
    const addPassage = () => setPassages((prev) => [...prev, emptyPassage()]);

    const updateQuestion = (idx: number, field: keyof ExamQuestion, value: string) => {
        setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
    };
    const updateQuestionOptions = (idx: number, value: string) => {
        setQuestions((prev) =>
            prev.map((q, i) => (i === idx ? { ...q, options: value.split(";").map((o) => o.trim()) } : q))
        );
    };
    const updateAnswerOption = (idx: number, value: string) => {
        setAnswerOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
    };
    const removeAnswerOption = (idx: number) => setAnswerOptions((prev) => prev.filter((_, i) => i !== idx));
    const addAnswerOption = () => setAnswerOptions((prev) => [...prev, ""]);

    const updateSectionIndex = (idx: number, passageIdx: string) => {
        setQuestions((prev) =>
            prev.map((q, i) => (i === idx ? { ...q, sectionIndex: passageIdx === "" ? null : Number(passageIdx) } : q))
        );
    };
    const removeQuestion = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx));
    const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion(form.taskType)]);

    const startEdit = (exercise: ExamExerciseResponse) => {
        setEditingExercise(exercise);
        setForm({
            title: exercise.title,
            taskType: exercise.taskType,
            level: exercise.level,
            partNumber: exercise.partNumber != null ? String(exercise.partNumber) : "",
            defaultExplanation: exercise.defaultExplanation ?? "",
            defaultCommonMistake: exercise.defaultCommonMistake ?? "",
            published: exercise.published,
        });
        setPassages(exercise.passages);
        setQuestions(exercise.questions);
        setAnswerOptions(exercise.answerOptions ?? []);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error("Title is required.");
            return;
        }

        const payload = {
            title: form.title,
            section: "LESEVERSTEHEN" as const,
            taskType: form.taskType,
            level: form.level,
            partNumber: form.partNumber.trim() ? Number(form.partNumber) : null,
            passages: passages.filter((p) => p.label.trim() && p.content.trim()),
            questions: questions
                .filter((q) => q.prompt.trim())
                .map((q) => ({
                    ...q,
                    options: q.options ? q.options.map((o) => o.trim()).filter(Boolean) : null,
                })),
            answerOptions: answerOptions.map((o) => o.trim()).filter(Boolean),
            defaultExplanation: form.defaultExplanation.trim() || null,
            defaultCommonMistake: form.defaultCommonMistake.trim() || null,
            published: form.published,
        };

        setIsSaving(true);
        const request = editingExercise
            ? updateExamExercise(editingExercise.id, payload)
            : createExamExercise(payload);

        request
            .then(() => {
                toast.success(editingExercise ? "Exercise updated." : "Exercise saved.");
                resetForm();
                fetchExercises();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save exercise."))
            .finally(() => setIsSaving(false));
    };

    const removeExercise = (exercise: ExamExerciseResponse) => {
        if (!confirm(`Delete "${exercise.title}"?`)) return;
        deleteExamExercise(exercise.id)
            .then(() => {
                toast.success("Exercise deleted.");
                fetchExercises();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete exercise."));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Prüfungsvorbereitung — Leseverstehen</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Create exam-style reading exercises: matching, multiple choice, or true/false/not-given.
                </p>

                <form onSubmit={submit} className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
                    {editingExercise && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Editing &quot;{editingExercise.title}&quot; —{" "}
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
                            placeholder="e.g. Leseverstehen B1 - Überschriften zuordnen"
                        />
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Task type</label>
                            <select
                                value={form.taskType}
                                onChange={(e) => changeTaskType(e.target.value as ExamTaskType)}
                                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {TASK_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Level</label>
                            <select
                                value={form.level}
                                onChange={(e) => setForm({ ...form, level: e.target.value })}
                                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {LEVELS.map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                        {lvl}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Teil (optional)</label>
                            <Input
                                value={form.partNumber}
                                onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                                placeholder="1"
                                required={false}
                                className="w-24"
                            />
                        </div>
                        <div className="flex items-end pb-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={form.published}
                                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                                />
                                Published
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Default explanation (fallback hint when a question has none)
                        </label>
                        <Input
                            value={form.defaultExplanation}
                            onChange={(e) => setForm({ ...form, defaultExplanation: e.target.value })}
                            required={false}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Default common mistake (fallback)
                        </label>
                        <Input
                            value={form.defaultCommonMistake}
                            onChange={(e) => setForm({ ...form, defaultCommonMistake: e.target.value })}
                            required={false}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-gray-700 dark:text-gray-300 text-sm">Passages / texts</label>
                        </div>
                        <div className="space-y-3">
                            {passages.map((p, idx) => (
                                <div key={p.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            value={p.label}
                                            onChange={(e) => updatePassage(idx, "label", e.target.value)}
                                            placeholder="Label (e.g. Text A)"
                                            required={false}
                                            className="flex-1"
                                        />
                                        <button type="button" onClick={() => removePassage(idx)} className="text-red-500 text-sm px-2">
                                            ✕
                                        </button>
                                    </div>
                                    <textarea
                                        value={p.content}
                                        onChange={(e) => updatePassage(idx, "content", e.target.value)}
                                        placeholder="Passage text"
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>
                            ))}
                            <Button type="button" variant="secondary" className="text-xs px-3 py-1" onClick={addPassage}>
                                + Add passage
                            </Button>
                        </div>
                    </div>

                    {form.taskType === "MATCHING" && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-gray-700 dark:text-gray-300 text-sm">
                                    Answer options (headlines) — include a few extra distractors that don&apos;t match any text
                                </label>
                            </div>
                            <div className="space-y-2">
                                {answerOptions.map((option, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 w-5">
                                            {String.fromCharCode(97 + idx)})
                                        </span>
                                        <Input
                                            value={option}
                                            onChange={(e) => updateAnswerOption(idx, e.target.value)}
                                            placeholder="Headline text"
                                            required={false}
                                            className="flex-1"
                                        />
                                        <button type="button" onClick={() => removeAnswerOption(idx)} className="text-red-500 text-sm px-2">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" className="text-xs px-3 py-1" onClick={addAnswerOption}>
                                    + Add headline
                                </Button>
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-gray-700 dark:text-gray-300 text-sm">Questions</label>
                        </div>
                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <div key={idx} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Question {idx + 1} ({q.taskType})
                                        </span>
                                        <button type="button" onClick={() => removeQuestion(idx)} className="text-red-500 text-sm px-2">
                                            ✕
                                        </button>
                                    </div>
                                    <Input
                                        value={q.prompt}
                                        onChange={(e) => updateQuestion(idx, "prompt", e.target.value)}
                                        placeholder={form.taskType === "MATCHING" ? "Prompt shown above the text (optional)" : "Question prompt"}
                                        required={false}
                                    />

                                    {form.taskType === "MATCHING" && (
                                        <div className="flex gap-2 flex-wrap items-center">
                                            <select
                                                value={q.sectionIndex ?? ""}
                                                onChange={(e) => updateSectionIndex(idx, e.target.value)}
                                                className="px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                            >
                                                <option value="">Select text...</option>
                                                {passages.map((p, pIdx) => (
                                                    <option key={p.id} value={pIdx}>
                                                        {p.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={q.correctAnswer}
                                                onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                                                className="px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm flex-1"
                                            >
                                                <option value="">Select correct headline...</option>
                                                {answerOptions.map((option, oIdx) => (
                                                    <option key={option || oIdx} value={option}>
                                                        {String.fromCharCode(97 + oIdx)}) {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {form.taskType === "MULTIPLE_CHOICE" && (
                                        <>
                                            <Input
                                                value={(q.options ?? []).join("; ")}
                                                onChange={(e) => updateQuestionOptions(idx, e.target.value)}
                                                placeholder="Options, separated by ;"
                                                required={false}
                                            />
                                            <Input
                                                value={q.correctAnswer}
                                                onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                                                placeholder="Correct answer (must match an option exactly)"
                                                required={false}
                                            />
                                        </>
                                    )}

                                    {form.taskType === "TRUE_FALSE_NOT_GIVEN" && (
                                        <div className="flex gap-2 flex-wrap items-center">
                                            <select
                                                value={q.sectionIndex ?? ""}
                                                onChange={(e) => updateSectionIndex(idx, e.target.value)}
                                                className="px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                            >
                                                <option value="">No specific passage</option>
                                                {passages.map((p, pIdx) => (
                                                    <option key={p.id} value={pIdx}>
                                                        {p.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={q.correctAnswer}
                                                onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                                                className="px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                            >
                                                {TFN_ANSWERS.map((a) => (
                                                    <option key={a} value={a}>
                                                        {a}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <Input
                                        value={q.explanation}
                                        onChange={(e) => updateQuestion(idx, "explanation", e.target.value)}
                                        placeholder="Explanation (how to solve this question type)"
                                        required={false}
                                    />
                                    <Input
                                        value={q.commonMistake}
                                        onChange={(e) => updateQuestion(idx, "commonMistake", e.target.value)}
                                        placeholder="Common mistake"
                                        required={false}
                                    />
                                </div>
                            ))}
                            <Button type="button" variant="secondary" className="text-xs px-3 py-1" onClick={addQuestion}>
                                + Add question
                            </Button>
                        </div>
                    </div>

                    <Button variant="primary" type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : editingExercise ? "Save changes" : "Save exercise"}
                    </Button>
                </form>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">Existing exercises</h2>
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading exercises...</div>
                    ) : (
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                    <tr>
                                        <th className="px-6 py-3">Title</th>
                                        <th className="px-6 py-3">Task type</th>
                                        <th className="px-6 py-3">Level</th>
                                        <th className="px-6 py-3">Questions</th>
                                        <th className="px-6 py-3">Published</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {exercises.map((exercise) => (
                                        <tr key={exercise.id}>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white">{exercise.title}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{exercise.taskType}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary">{exercise.level}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {exercise.questions.length}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {exercise.published ? "Yes" : "No"}
                                            </td>
                                            <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                                <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => startEdit(exercise)}>
                                                    Edit
                                                </Button>
                                                <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => removeExercise(exercise)}>
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {exercises.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                No exercises found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isSaving && <Loading message="Please wait..." />}
            <ToastContainer />
        </div>
    );
}
