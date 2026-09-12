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
    uploadExamPassageImage,
    uploadExamPassageAudio,
} from "@/services/adminExamService";
import { ExamExerciseResponse, ExamPassage, ExamQuestion, ExamSection, ExamTaskType } from "@/types/exam";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import RichTextEditor from "@/componenets/RichTextEditor";
import { Badge } from "@/componenets/ui/badge";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { extractGapNumbers } from "@/lib/examGap";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const TFN_ANSWERS = ["RICHTIG", "FALSCH", "NICHT_IM_TEXT"];

const TASK_TYPES_BY_SECTION: Record<ExamSection, ExamTaskType[]> = {
    LESEVERSTEHEN: ["MATCHING", "MULTIPLE_CHOICE", "TRUE_FALSE_NOT_GIVEN"],
    SPRACHBAUSTEINE: ["MULTIPLE_CHOICE", "WORD_BANK_CLOZE"],
    HOERVERSTEHEN: ["TRUE_FALSE_NOT_GIVEN"],
    SCHRIFTLICHER_AUSDRUCK: ["WRITING_TASK"],
};

const TASK_TYPE_LABELS: Partial<Record<ExamTaskType, string>> = {
    MULTIPLE_CHOICE: "Multiple choice",
    WRITING_TASK: "Schriftlicher Ausdruck",
};

const TASK_TYPE_LABELS_BY_SECTION: Partial<Record<ExamSection, Partial<Record<ExamTaskType, string>>>> = {
    SPRACHBAUSTEINE: {
        MULTIPLE_CHOICE: "Sprachbausteine Teil 1",
        WORD_BANK_CLOZE: "Sprachbausteine Teil 2",
    },
    HOERVERSTEHEN: {
        TRUE_FALSE_NOT_GIVEN: "Richtig / Falsch (+/-)",
    },
};

const SHARED_POOL_TASK_TYPES: ExamTaskType[] = ["MATCHING", "WORD_BANK_CLOZE"];

/** Hoerverstehen's Richtig/Falsch answer is authored via the same editable pool as MATCHING's
 * headlines, just pre-seeded with "+"/"-" - so the Section/Task type dropdowns don't govern this,
 * only the section does (all three Hoeren Teile share the one true/false format). */
const usesAnswerOptionsPool = (section: ExamSection, taskType: ExamTaskType) =>
    section === "HOERVERSTEHEN" || SHARED_POOL_TASK_TYPES.includes(taskType);

const taskTypeLabel = (section: ExamSection, taskType: ExamTaskType): string =>
    TASK_TYPE_LABELS_BY_SECTION[section]?.[taskType] ?? TASK_TYPE_LABELS[taskType] ?? taskType;

const sectionLabel = (section: ExamSection, partNumber: number | null): string => {
    if (section === "LESEVERSTEHEN") return `Leseverstehen Teil ${partNumber ?? 1}`;
    if (section === "HOERVERSTEHEN") return `Hörverstehen Teil ${partNumber ?? 1}`;
    if (section === "SCHRIFTLICHER_AUSDRUCK") return "Schriftlicher Ausdruck";
    return "Sprachbausteine";
};

type SectionOption =
    | "LESEVERSTEHEN_1"
    | "LESEVERSTEHEN_2"
    | "LESEVERSTEHEN_3"
    | "SPRACHBAUSTEINE"
    | "HOERVERSTEHEN"
    | "SCHRIFTLICHER_AUSDRUCK";

const SECTION_OPTIONS: { value: SectionOption; label: string }[] = [
    { value: "LESEVERSTEHEN_1", label: "Leseverstehen Teil 1" },
    { value: "LESEVERSTEHEN_2", label: "Leseverstehen Teil 2" },
    { value: "LESEVERSTEHEN_3", label: "Leseverstehen Teil 3" },
    { value: "SPRACHBAUSTEINE", label: "Sprachbausteine" },
    { value: "HOERVERSTEHEN", label: "Hörverstehen" },
    { value: "SCHRIFTLICHER_AUSDRUCK", label: "Schriftlicher Ausdruck" },
];

const HOERVERSTEHEN_TEIL_OPTIONS = [
    { value: "1", label: "Hörverstehen Teil 1" },
    { value: "2", label: "Hörverstehen Teil 2" },
    { value: "3", label: "Hörverstehen Teil 3" },
];

const emptyForm = {
    title: "",
    section: "LESEVERSTEHEN" as ExamSection,
    taskType: "MULTIPLE_CHOICE" as ExamTaskType,
    level: "B1",
    partNumber: "",
    defaultExplanation: "",
    defaultCommonMistake: "",
    modelSolution: "",
    published: true,
};

const hasPassageContent = (p: ExamPassage) => {
    const hasText = p.content.replace(/<[^>]*>/g, "").trim().length > 0;
    const hasEmbeddedImage = /<img[\s>]/i.test(p.content);
    return hasText || hasEmbeddedImage || Boolean(p.imageUrl) || Boolean(p.audioUrl);
};

const emptyPassage = (index: number): ExamPassage => ({
    id: crypto.randomUUID(),
    label: `Text ${index + 1}`,
    content: "",
    imageUrl: null,
    audioUrl: null,
    transcript: null,
});

const emptyQuestion = (taskType: ExamTaskType, section?: ExamSection): ExamQuestion => ({
    id: "",
    taskType,
    prompt: taskType === "MATCHING" ? "Welche Überschrift passt zu diesem Text?" : "",
    sectionIndex: null,
    options: taskType === "MULTIPLE_CHOICE" ? [] : null,
    correctAnswer: taskType === "TRUE_FALSE_NOT_GIVEN" && section !== "HOERVERSTEHEN" ? "RICHTIG" : "",
    gapNumber: null,
    explanation: "",
    commonMistake: "",
});

/**
 * WORD_BANK_CLOZE questions are auto-managed: the passage text (via the rich-text editor's
 * "insert blank" button) is the source of truth for which gaps exist. This reconciles the
 * questions list against whatever gap numbers are currently embedded in the passages, keeping
 * each gap's already-typed correctAnswer/explanation/commonMistake and ordering by gap number.
 */
function syncGapQuestions(passagesList: ExamPassage[], existingQuestions: ExamQuestion[]): ExamQuestion[] {
    const gapNumbers = passagesList.flatMap((p) => extractGapNumbers(p.content));
    const uniqueGapNumbers = Array.from(new Set(gapNumbers));
    const byGapNumber = new Map(existingQuestions.filter((q) => q.gapNumber != null).map((q) => [q.gapNumber, q]));

    return uniqueGapNumbers.map((gapNumber) => {
        const existing = byGapNumber.get(gapNumber);
        if (existing) return existing;
        return {
            ...emptyQuestion("WORD_BANK_CLOZE"),
            id: crypto.randomUUID(),
            prompt: `Lücke ${gapNumber}`,
            gapNumber,
        };
    });
}

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
    const [uploadingPassageImage, setUploadingPassageImage] = useState<number | null>(null);
    const [uploadingPassageAudio, setUploadingPassageAudio] = useState<number | null>(null);

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

    const sectionOptionValue: SectionOption =
        form.section === "SPRACHBAUSTEINE"
            ? "SPRACHBAUSTEINE"
            : form.section === "HOERVERSTEHEN"
                ? "HOERVERSTEHEN"
                : form.section === "SCHRIFTLICHER_AUSDRUCK"
                    ? "SCHRIFTLICHER_AUSDRUCK"
                    : (`LESEVERSTEHEN_${form.partNumber === "2" || form.partNumber === "3" ? form.partNumber : "1"}` as SectionOption);

    const changeSectionOption = (value: SectionOption) => {
        const section: ExamSection =
            value === "SPRACHBAUSTEINE"
                ? "SPRACHBAUSTEINE"
                : value === "HOERVERSTEHEN"
                    ? "HOERVERSTEHEN"
                    : value === "SCHRIFTLICHER_AUSDRUCK"
                        ? "SCHRIFTLICHER_AUSDRUCK"
                        : "LESEVERSTEHEN";
        const partNumber =
            value === "SPRACHBAUSTEINE" || value === "SCHRIFTLICHER_AUSDRUCK"
                ? ""
                : value === "HOERVERSTEHEN"
                    ? "1"
                    : value.replace("LESEVERSTEHEN_", "");
        const taskType = TASK_TYPES_BY_SECTION[section][0] ?? form.taskType;
        setForm({ ...form, section, partNumber, taskType });
        setQuestions([]);
        setAnswerOptions(section === "HOERVERSTEHEN" ? ["+", "-"] : []);
    };

    const changeTaskType = (taskType: ExamTaskType) => {
        setForm({ ...form, taskType });
        setQuestions((prev) => prev.map((q) => ({ ...q, taskType })));
    };

    const changeHoerenTeil = (partNumber: string) => {
        setForm({ ...form, partNumber });
    };

    const updatePassage = (idx: number, field: "label" | "content" | "transcript", value: string) => {
        setPassages((prev) => {
            const next = prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
            if (field === "content" && form.taskType === "WORD_BANK_CLOZE") {
                setQuestions((prevQuestions) => syncGapQuestions(next, prevQuestions));
            }
            return next;
        });
    };
    const removePassage = (idx: number) => setPassages((prev) => prev.filter((_, i) => i !== idx));
    const addPassage = () => setPassages((prev) => [...prev, emptyPassage(prev.length)]);

    const uploadPassageImage = (idx: number, file: File) => {
        setUploadingPassageImage(idx);
        uploadExamPassageImage(file)
            .then((res) => {
                setPassages((prev) => prev.map((p, i) => (i === idx ? { ...p, imageUrl: res.data.url } : p)));
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to upload image."))
            .finally(() => setUploadingPassageImage(null));
    };
    const removePassageImage = (idx: number) => {
        setPassages((prev) => prev.map((p, i) => (i === idx ? { ...p, imageUrl: null } : p)));
    };

    const uploadPassageAudio = (idx: number, file: File) => {
        setUploadingPassageAudio(idx);
        uploadExamPassageAudio(file)
            .then((res) => {
                setPassages((prev) => prev.map((p, i) => (i === idx ? { ...p, audioUrl: res.data.url } : p)));
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to upload audio."))
            .finally(() => setUploadingPassageAudio(null));
    };
    const removePassageAudio = (idx: number) => {
        setPassages((prev) => prev.map((p, i) => (i === idx ? { ...p, audioUrl: null } : p)));
    };

    /** Used by RichTextEditor for both the toolbar's "insert image" button and pasted images. */
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
    const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion(form.taskType, form.section)]);

    const startEdit = (exercise: ExamExerciseResponse) => {
        setEditingExercise(exercise);
        setForm({
            title: exercise.title,
            section: exercise.section,
            taskType: exercise.taskType,
            level: exercise.level,
            partNumber: exercise.partNumber != null ? String(exercise.partNumber) : "",
            defaultExplanation: exercise.defaultExplanation ?? "",
            defaultCommonMistake: exercise.defaultCommonMistake ?? "",
            modelSolution: exercise.modelSolution ?? "",
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

        // Passages with no content are dropped, but that shifts array indices - remap each
        // question's sectionIndex (which points into the passages array) so links survive.
        const passageIndexRemap = new Map<number, number>();
        const cleanedPassages = passages
            .map((p, originalIdx) => ({ p, originalIdx }))
            .filter(({ p }) => hasPassageContent(p))
            .map(({ p, originalIdx }, newIdx) => {
                passageIndexRemap.set(originalIdx, newIdx);
                return { ...p, label: p.label.trim() || `Text ${newIdx + 1}` };
            });

        const payload = {
            title: form.title,
            section: form.section,
            taskType: form.taskType,
            level: form.level,
            partNumber: form.partNumber.trim() ? Number(form.partNumber) : null,
            passages: cleanedPassages,
            questions: questions
                .filter((q) => q.prompt.trim())
                .map((q) => ({
                    ...q,
                    sectionIndex: q.sectionIndex != null ? passageIndexRemap.get(q.sectionIndex) ?? null : null,
                    options: q.options ? q.options.map((o) => o.trim()).filter(Boolean) : null,
                })),
            answerOptions: answerOptions.map((o) => o.trim()).filter(Boolean),
            defaultExplanation: form.defaultExplanation.trim() || null,
            defaultCommonMistake: form.defaultCommonMistake.trim() || null,
            modelSolution: form.modelSolution.trim() || null,
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
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Prüfungsvorbereitung</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Create exam-style Leseverstehen, Sprachbausteine, and Hörverstehen exercises.
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
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Section</label>
                            <select
                                value={sectionOptionValue}
                                onChange={(e) => changeSectionOption(e.target.value as SectionOption)}
                                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {SECTION_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Task type</label>
                            {form.section === "HOERVERSTEHEN" ? (
                                <select
                                    value={form.partNumber || "1"}
                                    onChange={(e) => changeHoerenTeil(e.target.value)}
                                    className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {HOERVERSTEHEN_TEIL_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    value={form.taskType}
                                    onChange={(e) => changeTaskType(e.target.value as ExamTaskType)}
                                    className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {TASK_TYPES_BY_SECTION[form.section].map((t) => (
                                        <option key={t} value={t}>
                                            {taskTypeLabel(form.section, t)}
                                        </option>
                                    ))}
                                </select>
                            )}
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
                        {form.section !== "HOERVERSTEHEN" && (
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
                        )}
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

                    {form.section !== "SCHRIFTLICHER_AUSDRUCK" && (
                        <>
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
                        </>
                    )}

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
                                    <RichTextEditor
                                        value={p.content}
                                        onChange={(html) => updatePassage(idx, "content", html)}
                                        placeholder="Passage text"
                                        onUploadImage={uploadInlineImage}
                                        allowGapInsertion={form.taskType === "WORD_BANK_CLOZE"}
                                    />

                                    <div className="flex items-center gap-4 pt-1">
                                        {p.imageUrl && (
                                            <img
                                                src={resolveUploadUrl(p.imageUrl) ?? undefined}
                                                alt=""
                                                className="w-24 h-16 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                                            />
                                        )}
                                        <div className="flex flex-col gap-1">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                disabled={uploadingPassageImage === idx}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    e.target.value = "";
                                                    if (file) uploadPassageImage(idx, file);
                                                }}
                                                className="text-xs text-gray-600 dark:text-gray-300"
                                            />
                                            {p.imageUrl && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-left underline text-gray-500 dark:text-gray-400 w-fit"
                                                    onClick={() => removePassageImage(idx)}
                                                >
                                                    Remove image
                                                </button>
                                            )}
                                            {uploadingPassageImage === idx && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Uploading...</span>
                                            )}
                                        </div>
                                    </div>

                                    {form.section === "HOERVERSTEHEN" && (
                                        <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-4">
                                                {p.audioUrl && (
                                                    <audio controls src={resolveUploadUrl(p.audioUrl) ?? undefined} className="h-9" />
                                                )}
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        type="file"
                                                        accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg,.mp3,.m4a,.wav,.ogg"
                                                        disabled={uploadingPassageAudio === idx}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            e.target.value = "";
                                                            if (file) uploadPassageAudio(idx, file);
                                                        }}
                                                        className="text-xs text-gray-600 dark:text-gray-300"
                                                    />
                                                    {p.audioUrl && (
                                                        <button
                                                            type="button"
                                                            className="text-xs text-left underline text-gray-500 dark:text-gray-400 w-fit"
                                                            onClick={() => removePassageAudio(idx)}
                                                        >
                                                            Remove audio
                                                        </button>
                                                    )}
                                                    {uploadingPassageAudio === idx && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Uploading...</span>
                                                    )}
                                                </div>
                                            </div>
                                            <textarea
                                                value={p.transcript ?? ""}
                                                onChange={(e) => updatePassage(idx, "transcript", e.target.value)}
                                                placeholder="Transcript (shown to students only after they answer the related question)"
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <Button type="button" variant="secondary" className="text-xs px-3 py-1" onClick={addPassage}>
                                + Add passage
                            </Button>
                        </div>
                    </div>

                    {usesAnswerOptionsPool(form.section, form.taskType) && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-gray-700 dark:text-gray-300 text-sm">
                                    {form.section === "HOERVERSTEHEN"
                                        ? "Answer options (Richtig/Falsch) — e.g. \"+\" and \"-\", used by every question below"
                                        : form.taskType === "WORD_BANK_CLOZE"
                                            ? "Answer options (words) — include a few extra distractors that don't fit any gap"
                                            : "Answer options (headlines) — include a few extra distractors that don't match any text"}
                                </label>
                            </div>
                            <div className="space-y-2">
                                {answerOptions.map((option, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        {form.section !== "HOERVERSTEHEN" && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 w-5">
                                                {String.fromCharCode(97 + idx)})
                                            </span>
                                        )}
                                        <Input
                                            value={option}
                                            onChange={(e) => updateAnswerOption(idx, e.target.value)}
                                            placeholder={form.section === "HOERVERSTEHEN" ? "e.g. + or -" : "Headline text"}
                                            required={false}
                                            className={form.section === "HOERVERSTEHEN" ? "w-24" : "flex-1"}
                                        />
                                        <button type="button" onClick={() => removeAnswerOption(idx)} className="text-red-500 text-sm px-2">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" className="text-xs px-3 py-1" onClick={addAnswerOption}>
                                    {form.section === "HOERVERSTEHEN" ? "+ Add option" : "+ Add headline"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {form.taskType === "WORD_BANK_CLOZE" && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-gray-700 dark:text-gray-300 text-sm">
                                    Gaps — click the ▢N button in the text above to add a numbered blank
                                </label>
                            </div>
                            <div className="space-y-3">
                                {questions.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No blanks yet - insert one from the text editor above.
                                    </p>
                                )}
                                {questions
                                    .slice()
                                    .sort((a, b) => (a.gapNumber ?? 0) - (b.gapNumber ?? 0))
                                    .map((q) => {
                                        const idx = questions.indexOf(q);
                                        return (
                                            <div
                                                key={q.id}
                                                className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2"
                                            >
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                    Lücke {q.gapNumber}
                                                </span>
                                                <select
                                                    value={q.correctAnswer}
                                                    onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                                                    className="w-full px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                                >
                                                    <option value="">Select correct word...</option>
                                                    {answerOptions.map((option, oIdx) => (
                                                        <option key={option || oIdx} value={option}>
                                                            {String.fromCharCode(97 + oIdx)}) {option}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Input
                                                    value={q.explanation}
                                                    onChange={(e) => updateQuestion(idx, "explanation", e.target.value)}
                                                    placeholder="Explanation (why this word fits)"
                                                    required={false}
                                                />
                                                <Input
                                                    value={q.commonMistake}
                                                    onChange={(e) => updateQuestion(idx, "commonMistake", e.target.value)}
                                                    placeholder="Common mistake"
                                                    required={false}
                                                />
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {form.taskType !== "WORD_BANK_CLOZE" && form.taskType !== "WRITING_TASK" && (
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
                                        placeholder={
                                            form.taskType === "MATCHING"
                                                ? "Prompt shown above the text (optional)"
                                                : form.section === "HOERVERSTEHEN"
                                                    ? "Statement, e.g. \"Der Zug hat Verspätung.\""
                                                    : "Question prompt"
                                        }
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
                                                <option value="">
                                                    {form.section === "HOERVERSTEHEN" ? "Select audio clip..." : "No specific passage"}
                                                </option>
                                                {passages.map((p, pIdx) => (
                                                    <option key={p.id} value={pIdx}>
                                                        {p.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.section === "HOERVERSTEHEN" ? (
                                                <select
                                                    value={q.correctAnswer}
                                                    onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                                                    className="px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                                >
                                                    <option value="">Select correct answer...</option>
                                                    {answerOptions.map((option, oIdx) => (
                                                        <option key={option || oIdx} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
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
                                            )}
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
                    )}

                    {form.section === "SCHRIFTLICHER_AUSDRUCK" && (
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                Mögliche Antwort (model solution, shown to students behind a &quot;Lösung anzeigen&quot; button)
                            </label>
                            <RichTextEditor
                                value={form.modelSolution}
                                onChange={(html) => setForm({ ...form, modelSolution: html })}
                                placeholder="Mögliche Antwort..."
                                onUploadImage={uploadInlineImage}
                            />
                        </div>
                    )}

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
                                        <th className="px-6 py-3">Section</th>
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
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {sectionLabel(exercise.section, exercise.partNumber)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {taskTypeLabel(exercise.section, exercise.taskType)}
                                            </td>
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
                                            <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
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
