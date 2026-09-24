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
    uploadExamPassageAudio,
} from "@/services/adminExamService";
import { ExamExerciseResponse, ExamPassage, ExamQuestion, ExamSection, ExamTaskType } from "@/types/exam";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import RichTextEditor from "@/componenets/RichTextEditor";
import { isEmptyTranscript } from "@/lib/transcriptFormat";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { extractGapNumbers } from "@/lib/examGap";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const TFN_ANSWERS = ["RICHTIG", "FALSCH", "NICHT_IM_TEXT"];

const TASK_TYPES_BY_SECTION: Record<ExamSection, ExamTaskType[]> = {
    LESEVERSTEHEN: ["MATCHING", "MULTIPLE_CHOICE", "TRUE_FALSE_NOT_GIVEN"],
    SPRACHBAUSTEINE: ["MULTIPLE_CHOICE", "WORD_BANK_CLOZE"],
    HOERVERSTEHEN: ["TRUE_FALSE_NOT_GIVEN"],
    SCHRIFTLICHER_AUSDRUCK: ["WRITING_TASK"],
    TESTFORMAT_INFORMATION: [],
};

/** Leseverstehen's three Teile conventionally map to these task types - used only as a starting
 * suggestion for "Teil" when the admin picks a task type; still freely editable afterward. */
const LESEVERSTEHEN_DEFAULT_PART: Partial<Record<ExamTaskType, string>> = {
    MATCHING: "1",
    MULTIPLE_CHOICE: "2",
    TRUE_FALSE_NOT_GIVEN: "3",
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
const usesAnswerOptionsPool = (section: ExamSection, taskType: ExamTaskType | null) =>
    section === "HOERVERSTEHEN" || (taskType != null && SHARED_POOL_TASK_TYPES.includes(taskType));

const taskTypeLabel = (section: ExamSection, taskType: ExamTaskType): string =>
    TASK_TYPE_LABELS_BY_SECTION[section]?.[taskType] ?? TASK_TYPE_LABELS[taskType] ?? taskType;

const sectionLabel = (section: ExamSection, partNumber: number | null): string => {
    if (section === "LESEVERSTEHEN") return `Leseverstehen Teil ${partNumber ?? 1}`;
    if (section === "HOERVERSTEHEN") return `Hörverstehen Teil ${partNumber ?? 1}`;
    if (section === "SCHRIFTLICHER_AUSDRUCK") return "Schriftlicher Ausdruck";
    if (section === "TESTFORMAT_INFORMATION") return "Testformat Information";
    return "Sprachbausteine";
};

const SECTION_META: Record<Exclude<ExamSection, "TESTFORMAT_INFORMATION">, { heading: string; description: string }> = {
    LESEVERSTEHEN: {
        heading: "Leseverstehen",
        description: "Create Leseverstehen exercises: Überschriften zuordnen, Multiple Choice, and Richtig/Falsch/Nicht im Text.",
    },
    SPRACHBAUSTEINE: {
        heading: "Sprachbausteine",
        description: "Create Sprachbausteine exercises: Multiple Choice (Teil 1) and word-bank cloze gaps (Teil 2).",
    },
    HOERVERSTEHEN: {
        heading: "Hörverstehen",
        description: "Create Hörverstehen exercises with audio clips, transcripts, and Richtig/Falsch statements.",
    },
    SCHRIFTLICHER_AUSDRUCK: {
        heading: "Schriftlicher Ausdruck",
        description: "Create writing-task prompts with a revealable \"mögliche Antwort\" model solution.",
    },
};

const HOERVERSTEHEN_TEIL_OPTIONS = [
    { value: "1", label: "Hörverstehen Teil 1" },
    { value: "2", label: "Hörverstehen Teil 2" },
    { value: "3", label: "Hörverstehen Teil 3" },
];

type PublishedFilter = "ALL" | "YES" | "NO";
type SortOrder = "NEWEST" | "OLDEST";

const makeEmptyForm = (section: ExamSection) => ({
    title: "",
    section,
    taskType: (TASK_TYPES_BY_SECTION[section][0] ?? null) as ExamTaskType | null,
    level: "B1",
    partNumber: section === "HOERVERSTEHEN" ? "1" : "",
    defaultExplanation: "",
    defaultCommonMistake: "",
    teilDescription: "",
    modelSolution: "",
    published: true,
});

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
    questionNumber: null,
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

interface ExamSectionManagerProps {
    section: Exclude<ExamSection, "TESTFORMAT_INFORMATION">;
}

/** Admin CRUD for one exam section (Leseverstehen, Sprachbausteine, Hörverstehen, or Schriftlicher
 * Ausdruck) - each reachable from its own sidebar sub-link instead of one crowded shared page. */
export default function ExamSectionManager({ section }: Readonly<ExamSectionManagerProps>) {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const queryClient = useQueryClient();
    const meta = SECTION_META[section];
    const taskTypes = TASK_TYPES_BY_SECTION[section];

    // Shared across every exam-prep page: the admin endpoint returns all sections in one list.
    const EXERCISES_KEY = ["admin", "exam", "exercises"];

    const { data: allExercises = [], isLoading, error: exercisesError } = useQuery({
        queryKey: EXERCISES_KEY,
        queryFn: () => getExamExercisesForAdmin().then((res) => res.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });
    const exercises = allExercises.filter((e) => e.section === section);

    const [isSaving, setIsSaving] = useState(false);
    const [exerciseToDelete, setExerciseToDelete] = useState<ExamExerciseResponse | null>(null);

    const [form, setForm] = useState(() => makeEmptyForm(section));
    const [passages, setPassages] = useState<ExamPassage[]>([]);
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [answerOptions, setAnswerOptions] = useState<string[]>(section === "HOERVERSTEHEN" ? ["+", "-"] : []);
    const [editingExercise, setEditingExercise] = useState<ExamExerciseResponse | null>(null);
    const [uploadingPassageImage, setUploadingPassageImage] = useState<number | null>(null);
    const [uploadingPassageAudio, setUploadingPassageAudio] = useState<number | null>(null);

    const [filterLevel, setFilterLevel] = useState<string>("ALL");
    const [filterPublished, setFilterPublished] = useState<PublishedFilter>("ALL");
    const [sortOrder, setSortOrder] = useState<SortOrder>("NEWEST");
    const [exercisesPage, setExercisesPage] = useState(1);
    const [exercisesPageSize, setExercisesPageSize] = useState(10);
    const [exerciseSearch, setExerciseSearch] = useState("");

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
            toast.error(err?.response?.data?.message ?? "Failed to load exercises.");
        }
    }, [exercisesError]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const resetForm = () => {
        setForm(makeEmptyForm(section));
        setPassages([]);
        setQuestions([]);
        setAnswerOptions(section === "HOERVERSTEHEN" ? ["+", "-"] : []);
        setEditingExercise(null);
    };

    const changeTaskType = (taskType: ExamTaskType) => {
        const suggestedPart = section === "LESEVERSTEHEN" ? LESEVERSTEHEN_DEFAULT_PART[taskType] ?? form.partNumber : form.partNumber;
        setForm({ ...form, taskType, partNumber: suggestedPart });
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
    const updateQuestionNumber = (idx: number, value: string) => {
        const parsed = value.trim() === "" ? null : Number(value);
        setQuestions((prev) =>
            prev.map((q, i) => (i === idx ? { ...q, questionNumber: parsed !== null && Number.isNaN(parsed) ? q.questionNumber : parsed } : q))
        );
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
    const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion(form.taskType ?? "MULTIPLE_CHOICE", section)]);

    const startEdit = (exercise: ExamExerciseResponse) => {
        setEditingExercise(exercise);
        setForm({
            title: exercise.title,
            section,
            taskType: exercise.taskType,
            level: exercise.level ?? "B1",
            partNumber: exercise.partNumber != null ? String(exercise.partNumber) : "",
            defaultExplanation: exercise.defaultExplanation ?? "",
            defaultCommonMistake: exercise.defaultCommonMistake ?? "",
            teilDescription: exercise.teilDescription ?? "",
            modelSolution: exercise.modelSolution ?? "",
            published: exercise.published,
        });
        setPassages(exercise.passages);
        setQuestions(exercise.questions);
        setAnswerOptions(exercise.answerOptions ?? []);
        window.scrollTo({ top: 0, behavior: "smooth" });
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
            section,
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
            teilDescription: form.teilDescription.trim() || null,
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
                invalidateExercises();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save exercise."))
            .finally(() => setIsSaving(false));
    };

    const changeExercisesFilter = (fn: () => void) => {
        fn();
        setExercisesPage(1);
    };

    const exerciseLevels = Array.from(new Set(exercises.map((e) => e.level).filter((lvl): lvl is string => lvl != null))).sort();

    const exerciseSearchQuery = exerciseSearch.trim().toLowerCase();

    const filteredExercises = exercises
        .filter((e) => filterLevel === "ALL" || e.level === filterLevel)
        .filter((e) => filterPublished === "ALL" || (filterPublished === "YES" ? e.published : !e.published))
        .filter((e) => !exerciseSearchQuery || e.title.toLowerCase().includes(exerciseSearchQuery))
        .sort((a, b) => {
            const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            return sortOrder === "NEWEST" ? -diff : diff;
        });

    const exercisesTotalPages = Math.max(1, Math.ceil(filteredExercises.length / exercisesPageSize));
    const exercisesCurrentPage = Math.min(exercisesPage, exercisesTotalPages);
    const exercisesStartIndex = filteredExercises.length === 0 ? 0 : (exercisesCurrentPage - 1) * exercisesPageSize + 1;
    const exercisesEndIndex = Math.min(exercisesCurrentPage * exercisesPageSize, filteredExercises.length);
    const pagedExercises = filteredExercises.slice(
        (exercisesCurrentPage - 1) * exercisesPageSize,
        exercisesCurrentPage * exercisesPageSize
    );
    const exercisesPageNumbers = Array.from({ length: exercisesTotalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === exercisesTotalPages || Math.abs(p - exercisesCurrentPage) <= 1
    );

    const removeExercise = (exercise: ExamExerciseResponse) => setExerciseToDelete(exercise);

    const confirmRemoveExercise = () => {
        const exercise = exerciseToDelete;
        if (!exercise) return;
        setExerciseToDelete(null);
        deleteExamExercise(exercise.id)
            .then(() => {
                toast.success("Exercise deleted.");
                invalidateExercises();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete exercise."));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{meta.heading}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{meta.description}</p>

                <form onSubmit={submit} className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-6">
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
                        {(section === "HOERVERSTEHEN" || taskTypes.length > 1) && (
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Task type</label>
                                {section === "HOERVERSTEHEN" ? (
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
                                        value={form.taskType ?? ""}
                                        onChange={(e) => changeTaskType(e.target.value as ExamTaskType)}
                                        className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        {taskTypes.map((t) => (
                                            <option key={t} value={t}>
                                                {taskTypeLabel(section, t)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
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
                        {section !== "HOERVERSTEHEN" && (
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

                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Teil description (shown to students before the passages/questions)
                        </label>
                        <Input
                            value={form.teilDescription}
                            onChange={(e) => setForm({ ...form, teilDescription: e.target.value })}
                            required={false}
                        />
                    </div>

                    {section !== "SCHRIFTLICHER_AUSDRUCK" && (
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

                                    {section === "HOERVERSTEHEN" && (
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
                                            <div>
                                                <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    Transcript — shown to students on the result page after they finish
                                                </p>
                                                <RichTextEditor
                                                    value={p.transcript ?? ""}
                                                    onChange={(html) => updatePassage(idx, "transcript", isEmptyTranscript(html) ? "" : html)}
                                                    placeholder="Transcript of the audio. Use paragraphs, bold speaker names, etc."
                                                    onUploadImage={uploadInlineImage}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <Button type="button" variant="secondary" className="text-xs px-3 py-1" onClick={addPassage}>
                                + Add passage
                            </Button>
                        </div>
                    </div>

                    {usesAnswerOptionsPool(section, form.taskType) && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-gray-700 dark:text-gray-300 text-sm">
                                    {section === "HOERVERSTEHEN"
                                        ? "Answer options (Richtig/Falsch) — e.g. \"+\" and \"-\", used by every question below"
                                        : form.taskType === "WORD_BANK_CLOZE"
                                            ? "Answer options (words) — include a few extra distractors that don't fit any gap"
                                            : "Answer options (headlines) — include a few extra distractors that don't match any text"}
                                </label>
                            </div>
                            <div className="space-y-2">
                                {answerOptions.map((option, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        {section !== "HOERVERSTEHEN" && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 w-5">
                                                {String.fromCharCode(97 + idx)})
                                            </span>
                                        )}
                                        <Input
                                            value={option}
                                            onChange={(e) => updateAnswerOption(idx, e.target.value)}
                                            placeholder={section === "HOERVERSTEHEN" ? "e.g. + or -" : "Headline text"}
                                            required={false}
                                            className={section === "HOERVERSTEHEN" ? "w-24" : "flex-1"}
                                        />
                                        <button type="button" onClick={() => removeAnswerOption(idx)} className="text-red-500 text-sm px-2">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" className="text-xs px-3 py-1" onClick={addAnswerOption}>
                                    {section === "HOERVERSTEHEN" ? "+ Add option" : "+ Add headline"}
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
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Question {q.questionNumber ?? idx + 1} ({q.taskType})
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-500 dark:text-gray-400" htmlFor={`question-number-${idx}`}>
                                                Nr.
                                            </label>
                                            <input
                                                id={`question-number-${idx}`}
                                                type="number"
                                                value={q.questionNumber ?? ""}
                                                onChange={(e) => updateQuestionNumber(idx, e.target.value)}
                                                placeholder={String(idx + 1)}
                                                className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                            />
                                            <button type="button" onClick={() => removeQuestion(idx)} className="text-red-500 text-sm px-2">
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                    <Input
                                        value={q.prompt}
                                        onChange={(e) => updateQuestion(idx, "prompt", e.target.value)}
                                        placeholder={
                                            form.taskType === "MATCHING"
                                                ? "Prompt shown above the text (optional)"
                                                : section === "HOERVERSTEHEN"
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
                                                    {section === "HOERVERSTEHEN" ? "Select audio clip..." : "No specific passage"}
                                                </option>
                                                {passages.map((p, pIdx) => (
                                                    <option key={p.id} value={pIdx}>
                                                        {p.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {section === "HOERVERSTEHEN" ? (
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

                    {section === "SCHRIFTLICHER_AUSDRUCK" && (
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

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">Existing exercises</h2>

                    <div className="px-6 pt-4 flex items-center gap-3 flex-wrap">
                        <select
                            value={filterLevel}
                            onChange={(e) => changeExercisesFilter(() => setFilterLevel(e.target.value))}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                            <option value="ALL">All levels</option>
                            {exerciseLevels.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                    {lvl}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterPublished}
                            onChange={(e) => changeExercisesFilter(() => setFilterPublished(e.target.value as PublishedFilter))}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                            <option value="ALL">Published: all</option>
                            <option value="YES">Published: yes</option>
                            <option value="NO">Published: no</option>
                        </select>

                        <select
                            value={sortOrder}
                            onChange={(e) => changeExercisesFilter(() => setSortOrder(e.target.value as SortOrder))}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                            <option value="NEWEST">Newest first</option>
                            <option value="OLDEST">Oldest first</option>
                        </select>
                    </div>

                    <div className="px-6 pt-4 flex flex-wrap items-center justify-between gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            Show
                            <select
                                value={exercisesPageSize}
                                onChange={(e) => changeExercisesFilter(() => setExercisesPageSize(Number(e.target.value)))}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                {PAGE_SIZE_OPTIONS.map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                            entries
                        </label>

                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            Search:
                            <input
                                type="text"
                                value={exerciseSearch}
                                onChange={(e) => changeExercisesFilter(() => setExerciseSearch(e.target.value))}
                                placeholder="Exercise title..."
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </label>
                    </div>

                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading exercises...</div>
                    ) : (
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                    <tr>
                                        <th className="px-6 py-3">Title</th>
                                        <th className="px-6 py-3">Teil</th>
                                        <th className="px-6 py-3">Task type</th>
                                        <th className="px-6 py-3">Level</th>
                                        <th className="px-6 py-3">Questions</th>
                                        <th className="px-6 py-3">Published</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {pagedExercises.map((exercise) => (
                                        <tr key={exercise.id}>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white">{exercise.title}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {sectionLabel(exercise.section, exercise.partNumber)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {exercise.taskType ? taskTypeLabel(exercise.section, exercise.taskType) : "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary">{exercise.level ?? "All levels"}</Badge>
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
                                    {filteredExercises.length === 0 && (
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

                    {!isLoading && filteredExercises.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Showing {exercisesStartIndex} to {exercisesEndIndex} of {filteredExercises.length} entries
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={exercisesCurrentPage === 1}
                                    onClick={() => setExercisesPage(1)}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <ChevronsLeft className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={exercisesCurrentPage === 1}
                                    onClick={() => setExercisesPage((p) => Math.max(1, p - 1))}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                {exercisesPageNumbers.map((p, idx) => {
                                    const prev = exercisesPageNumbers[idx - 1];
                                    const showEllipsis = prev !== undefined && p - prev > 1;
                                    return (
                                        <div key={p} className="flex items-center gap-1">
                                            {showEllipsis && <span className="px-1 text-gray-400 dark:text-gray-500">…</span>}
                                            <button
                                                type="button"
                                                onClick={() => setExercisesPage(p)}
                                                className={`min-w-9 h-9 px-2 rounded-lg text-sm font-medium border ${
                                                    p === exercisesCurrentPage
                                                        ? "bg-blue-600 border-blue-600 text-white"
                                                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    disabled={exercisesCurrentPage === exercisesTotalPages}
                                    onClick={() => setExercisesPage((p) => Math.min(exercisesTotalPages, p + 1))}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={exercisesCurrentPage === exercisesTotalPages}
                                    onClick={() => setExercisesPage(exercisesTotalPages)}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <ChevronsRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isSaving && <Loading message="Please wait..." />}
            <ConfirmDialog
                isOpen={Boolean(exerciseToDelete)}
                title="Delete this exercise?"
                message={`Delete "${exerciseToDelete?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemoveExercise}
                onCancel={() => setExerciseToDelete(null)}
            />
        </div>
    );
}
