import { QueryClient } from "@tanstack/react-query";
import { ReadingPendingBookmark } from "@/types/reading";

export const pendingReadingBookmarksQueryKey = ["reading", "pending-bookmarks"];

/** After an article is learned/un-learned or bookmarked: the "saved for later" strip must refetch. */
export function invalidatePendingReadingBookmarks(queryClient: QueryClient) {
    queryClient.invalidateQueries({ queryKey: pendingReadingBookmarksQueryKey });
}

/** After a bookmark is removed from the strip: drop it instantly and mark the cached lists/article stale. */
export function removePendingReadingBookmark(queryClient: QueryClient, articleId: string) {
    queryClient.setQueryData<ReadingPendingBookmark[]>(pendingReadingBookmarksQueryKey, (prev) =>
        prev?.filter((a) => a.id !== articleId)
    );
    queryClient.invalidateQueries({ queryKey: ["reading", "list"] });
    queryClient.invalidateQueries({ queryKey: ["reading", "article", articleId] });
}
