import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { addExamExerciseBookmark, removeExamExerciseBookmark } from "@/services/examService";
import { markExamExerciseBookmarkedInCache } from "@/lib/examQueryCache";

/** Bookmark/unbookmark an exam exercise, keeping the cached lists, the exercise and the saved strip in sync. */
export function useExamBookmark() {
    const queryClient = useQueryClient();
    const [pendingId, setPendingId] = useState<string | null>(null);

    const toggle = (exerciseId: string, currentlyBookmarked: boolean) => {
        setPendingId(exerciseId);
        const request = currentlyBookmarked ? removeExamExerciseBookmark(exerciseId) : addExamExerciseBookmark(exerciseId);
        return request
            .then(() => {
                markExamExerciseBookmarkedInCache(queryClient, exerciseId, !currentlyBookmarked);
                toast.success(currentlyBookmarked ? "Merkzeichen entfernt." : "Aufgabe gemerkt.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Merkzeichen konnte nicht geändert werden."))
            .finally(() => setPendingId(null));
    };

    return { toggle, pendingId };
}
