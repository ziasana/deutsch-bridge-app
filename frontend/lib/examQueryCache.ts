import { QueryClient } from "@tanstack/react-query";
import { ExamExercisePublicResponse, ExamExerciseSummaryResponse, ExamPendingBookmark } from "@/types/exam";

export const pendingExamBookmarksQueryKey = ["exam", "pending-bookmarks"];

/**
 * After an exercise is bookmarked/unbookmarked: patch every cached exercise list and the cached exercise
 * in place (the flag lives on both), and keep the "saved for later" strip in sync - removal is instant,
 * adding needs the server's row (bookmark date, mastered check), so that refetches.
 */
export function markExamExerciseBookmarkedInCache(queryClient: QueryClient, exerciseId: string, bookmarked: boolean) {
    queryClient.setQueriesData<ExamExerciseSummaryResponse[]>({ queryKey: ["exam", "exercises"] }, (prev) =>
        Array.isArray(prev) ? prev.map((e) => (e.id === exerciseId ? { ...e, bookmarked } : e)) : prev
    );
    queryClient.setQueryData<ExamExercisePublicResponse>(["exam", "exercise", exerciseId], (prev) => (prev ? { ...prev, bookmarked } : prev));
    if (bookmarked) {
        queryClient.invalidateQueries({ queryKey: pendingExamBookmarksQueryKey });
    } else {
        queryClient.setQueryData<ExamPendingBookmark[]>(pendingExamBookmarksQueryKey, (prev) => prev?.filter((e) => e.id !== exerciseId));
    }
}
