import { useQuery } from "@tanstack/react-query";
import { getPendingExamBookmarks } from "@/services/examService";
import { pendingExamBookmarksQueryKey } from "@/lib/examQueryCache";

/** The user's bookmarked-but-unmastered exam exercises across all levels, oldest bookmark first. */
export function usePendingExamBookmarks() {
    return useQuery({
        queryKey: pendingExamBookmarksQueryKey,
        queryFn: () => getPendingExamBookmarks().then((res) => res.data),
    });
}
