import { useQuery } from "@tanstack/react-query";
import { getPendingGrammarBookmarks } from "@/services/grammarService";
import { pendingBookmarksQueryKey } from "@/lib/grammarQueryCache";

/** The user's bookmarked-but-unlearned grammar lessons across all levels, oldest bookmark first. */
export function usePendingGrammarBookmarks(enabled = true) {
    return useQuery({
        queryKey: pendingBookmarksQueryKey,
        queryFn: () => getPendingGrammarBookmarks().then((res) => res.data),
        enabled,
    });
}
