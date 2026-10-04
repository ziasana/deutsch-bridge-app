import { useQuery } from "@tanstack/react-query";
import { getPendingReadingBookmarks } from "@/services/readingService";
import { pendingReadingBookmarksQueryKey } from "@/lib/readingQueryCache";

/** The user's bookmarked-but-unlearned reading articles across all levels, oldest bookmark first. */
export function usePendingReadingBookmarks() {
    return useQuery({
        queryKey: pendingReadingBookmarksQueryKey,
        queryFn: () => getPendingReadingBookmarks().then((res) => res.data),
    });
}
