import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useI18n } from "@/componenets/I18nProvider";
import { addGrammarLessonBookmark, removeGrammarLessonBookmark } from "@/services/grammarService";
import { markLessonBookmarkedInCache } from "@/lib/grammarQueryCache";

/** Bookmark/unbookmark a grammar lesson, keeping the cached lesson and level lists in sync. */
export function useGrammarBookmark() {
    const queryClient = useQueryClient();
    const { t } = useI18n();
    const [pendingId, setPendingId] = useState<string | null>(null);

    const toggle = (lessonId: string, currentlyBookmarked: boolean) => {
        setPendingId(lessonId);
        const request = currentlyBookmarked ? removeGrammarLessonBookmark(lessonId) : addGrammarLessonBookmark(lessonId);
        return request
            .then(() => {
                markLessonBookmarkedInCache(queryClient, lessonId, !currentlyBookmarked);
                toast.success(currentlyBookmarked ? t.grammar.bookmarkRemoved : t.grammar.bookmarkAdded);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? t.grammar.bookmarkFailed))
            .finally(() => setPendingId(null));
    };

    return { toggle, pendingId };
}
