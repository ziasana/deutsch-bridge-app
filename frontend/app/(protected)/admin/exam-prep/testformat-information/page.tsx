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
    uploadExamPassageImage,
} from "@/services/adminExamService";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import RichTextEditor from "@/componenets/RichTextEditor";

const TITLE = "Testformat Information";

/**
 * Singleton content page (not a list+CRUD grid like the other sections): one rich-text block
 * describing the exam format overall, shown to students via TestformatInformationView. Reuses the
 * same ExamExercise row shape (section=TESTFORMAT_INFORMATION, one passage, no task type/questions).
 */
export default function AdminExamTestformatInformationPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const queryClient = useQueryClient();

    const EXERCISES_KEY = ["admin", "exam", "exercises"];

    const { data: allExercises = [], isLoading, error: exercisesError } = useQuery({
        queryKey: EXERCISES_KEY,
        queryFn: () => getExamExercisesForAdmin().then((res) => res.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });
    const existing = allExercises.find((e) => e.section === "TESTFORMAT_INFORMATION") ?? null;

    const [content, setContent] = useState("");
    const [published, setPublished] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [initialized, setInitialized] = useState(false);

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

    // Seed local edit state from the fetched row once loaded (avoids clobbering in-progress edits
    // on a later refetch). Adjusting state during render, per React's guidance for this exact case,
    // instead of an effect - see https://react.dev/learn/you-might-not-need-an-effect.
    if (!isLoading && !initialized) {
        setContent(existing?.passages[0]?.content ?? "");
        setPublished(existing?.published ?? true);
        setInitialized(true);
    }

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

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

        const payload = {
            title: TITLE,
            section: "TESTFORMAT_INFORMATION" as const,
            taskType: null,
            level: null,
            partNumber: null,
            passages: [
                {
                    id: existing?.passages[0]?.id ?? crypto.randomUUID(),
                    label: TITLE,
                    content,
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
            published,
        };

        setIsSaving(true);
        const request = existing ? updateExamExercise(existing.id, payload) : createExamExercise(payload);

        request
            .then(() => {
                toast.success("Testformat Information saved.");
                queryClient.invalidateQueries({ queryKey: EXERCISES_KEY });
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save."))
            .finally(() => setIsSaving(false));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Testformat Information</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    One rich-text block describing the exam format overall, shown to students before they start
                    practicing.
                </p>

                {isLoading ? (
                    <div className="mt-8 p-10 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : (
                    <form
                        onSubmit={submit}
                        className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-6"
                    >
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Content</label>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Describe the exam format: sections, timing, scoring, tips..."
                                onUploadImage={uploadInlineImage}
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={(e) => setPublished(e.target.checked)}
                            />
                            Published (visible to students)
                        </label>

                        <Button variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </form>
                )}
            </div>

            {isSaving && <Loading message="Please wait..." />}
        </div>
    );
}
