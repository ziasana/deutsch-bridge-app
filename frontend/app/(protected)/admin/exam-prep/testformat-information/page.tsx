"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import {
    getExamExercisesForAdmin,
    createExamExercise,
    updateExamExercise,
    deleteExamExercise,
    uploadExamPassageImage,
} from "@/services/adminExamService";
import { ExamExerciseResponse } from "@/types/exam";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import RichTextEditor from "@/componenets/RichTextEditor";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";

const TITLE = "Testformat Information";
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const makeEmptyForm = () => ({ level: "", content: "", published: true });

/**
 * List+CRUD page for Testformat Information, styled to match ExamSectionManager (the other exam-prep
 * admin pages) for visual consistency. One rich-text block per level describing the exam format,
 * shown to students via TestformatInformationView. Reuses the same ExamExercise row shape as the
 * other exam sections (section=TESTFORMAT_INFORMATION, one passage, no task type/questions), but -
 * unlike those sections - only one row is allowed per level (enforced server-side too).
 */
export default function AdminExamTestformatInformationPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const queryClient = useQueryClient();

    // Shared across every exam-prep page: the admin endpoint returns all sections in one list.
    const EXERCISES_KEY = ["admin", "exam", "exercises"];

    const { data: allExercises = [], isLoading, error: exercisesError } = useQuery({
        queryKey: EXERCISES_KEY,
        queryFn: () => getExamExercisesForAdmin().then((res) => res.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });
    const entries = allExercises
        .filter((e) => e.section === "TESTFORMAT_INFORMATION")
        .sort((a, b) => (a.level ?? "").localeCompare(b.level ?? ""));

    const [isSaving, setIsSaving] = useState(false);
    const [exerciseToDelete, setExerciseToDelete] = useState<ExamExerciseResponse | null>(null);

    const [form, setForm] = useState(makeEmptyForm);
    const [editingExercise, setEditingExercise] = useState<ExamExerciseResponse | null>(null);

    const invalidateExercises = () => queryClient.invalidateQueries({ queryKey: EXERCISES_KEY });

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [hasHydrated, userProfile, router]);

    useEffect(() => {
        if (exercisesError) {
            const err = exercisesError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load content.");
        }
    }, [exercisesError]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const usedLevels = new Set(entries.map((e) => e.level));
    const availableLevelsForNew = LEVELS.filter((l) => !usedLevels.has(l));

    const resetForm = () => {
        setForm({ ...makeEmptyForm(), level: availableLevelsForNew[0] ?? "" });
        setEditingExercise(null);
    };

    const startEdit = (exercise: ExamExerciseResponse) => {
        setEditingExercise(exercise);
        setForm({
            level: exercise.level ?? "",
            content: exercise.passages[0]?.content ?? "",
            published: exercise.published,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const uploadInlineImage = async (file: File) => {
        try {
            const res = await uploadExamPassageImage(file);
            return res.data.url;
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Failed to upload image.");
            throw err;
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.level) {
            toast.error("Please select a level.");
            return;
        }

        const payload = {
            title: TITLE,
            section: "TESTFORMAT_INFORMATION" as const,
            taskType: null,
            level: form.level,
            partNumber: null,
            passages: [
                {
                    id: editingExercise?.passages[0]?.id ?? crypto.randomUUID(),
                    label: TITLE,
                    content: form.content,
                    imageUrl: null,
                    audioUrl: null,
                    transcript: null,
                },
            ],
            questions: [],
            answerOptions: [],
            defaultExplanation: null,
            defaultCommonMistake: null,
            teilDescription: null,
            modelSolution: null,
            published: form.published,
        };

        setIsSaving(true);
        const request = editingExercise ? updateExamExercise(editingExercise.id, payload) : createExamExercise(payload);

        request
            .then(() => {
                toast.success(editingExercise ? "Content updated." : "Content saved.");
                resetForm();
                invalidateExercises();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save."))
            .finally(() => setIsSaving(false));
    };

    const removeExercise = (exercise: ExamExerciseResponse) => setExerciseToDelete(exercise);

    const confirmRemoveExercise = () => {
        const exercise = exerciseToDelete;
        if (!exercise) return;
        setExerciseToDelete(null);
        deleteExamExercise(exercise.id)
            .then(() => {
                toast.success("Content deleted.");
                if (editingExercise?.id === exercise.id) resetForm();
                invalidateExercises();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete."));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{TITLE}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    One rich-text block per level describing the exam format, shown to students before they start
                    practicing.
                </p>

                <form
                    onSubmit={submit}
                    className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-6"
                >
                    {editingExercise && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Editing &quot;{editingExercise.level}&quot; —{" "}
                            <button type="button" className="underline" onClick={resetForm}>
                                cancel
                            </button>
                        </p>
                    )}

                    <div className="flex gap-4 flex-wrap">
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Level</label>
                            <select
                                value={form.level}
                                onChange={(e) => setForm({ ...form, level: e.target.value })}
                                disabled={!!editingExercise}
                                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
                            >
                                <option value="" disabled>
                                    Select level
                                </option>
                                {(editingExercise ? LEVELS : availableLevelsForNew).map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                        {lvl}
                                    </option>
                                ))}
                            </select>
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
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Content</label>
                        <RichTextEditor
                            value={form.content}
                            onChange={(html) => setForm({ ...form, content: html })}
                            placeholder="Describe the exam format: sections, timing, scoring, tips..."
                            onUploadImage={uploadInlineImage}
                        />
                    </div>

                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isSaving || (!editingExercise && availableLevelsForNew.length === 0)}
                    >
                        {isSaving ? "Saving..." : editingExercise ? "Save changes" : "Save content"}
                    </Button>
                </form>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6 pb-4">
                        Existing content
                    </h2>

                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading content...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                    <tr>
                                        <th className="px-6 py-3">Level</th>
                                        <th className="px-6 py-3">Published</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {entries.map((exercise) => (
                                        <tr key={exercise.id}>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary">{exercise.level}</Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={exercise.published ? "default" : "outline"}>
                                                    {exercise.published ? "Published" : "Draft"}
                                                </Badge>
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
                                    {entries.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                No content yet.
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
            <ConfirmDialog
                isOpen={Boolean(exerciseToDelete)}
                title="Delete this content?"
                message={`Delete the ${exerciseToDelete?.level ?? ""} Testformat Information content? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemoveExercise}
                onCancel={() => setExerciseToDelete(null)}
            />
        </div>
    );
}
