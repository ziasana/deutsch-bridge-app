import { QueryClient } from "@tanstack/react-query";
import { GrammarLesson, GrammarLevelView } from "@/types/grammar";

export const grammarLessonQueryKey = (lessonId: string) => ["grammar", "lesson", lessonId];

/**
 * After a lesson's learned state changes: patch the cached lesson in place, and mark the level
 * cards and level lists stale so they refetch the next time they're shown.
 */
export function markLessonLearnedInCache(queryClient: QueryClient, lessonId: string, learned: boolean) {
    queryClient.setQueryData<GrammarLesson>(grammarLessonQueryKey(lessonId), (prev) =>
        prev ? { ...prev, learningProgresses: [{ id: "local", learned }] } : prev
    );
    queryClient.invalidateQueries({ queryKey: ["grammar", "level-summary"] });
    queryClient.invalidateQueries({ queryKey: ["grammar", "level"] });
}

/**
 * After a lesson is bookmarked/unbookmarked: patch the cached lesson and every cached level list in
 * place (the flag lives on the light rows too), so the list's "Bookmarked" filter and the lesson page
 * update instantly without refetching anything.
 */
export function markLessonBookmarkedInCache(queryClient: QueryClient, lessonId: string, bookmarked: boolean) {
    queryClient.setQueryData<GrammarLesson>(grammarLessonQueryKey(lessonId), (prev) => (prev ? { ...prev, bookmarked } : prev));
    queryClient.setQueriesData<GrammarLevelView>({ queryKey: ["grammar", "level"] }, (prev) => {
        if (!prev?.categories) return prev;
        const patch = <T extends { id: string }>(lessons: T[]) => lessons.map((l) => (l.id === lessonId ? { ...l, bookmarked } : l));
        return {
            ...prev,
            categories: prev.categories.map((c) => ({ ...c, lessons: patch(c.lessons) })),
            uncategorized: patch(prev.uncategorized),
        };
    });
}
