import { QueryClient } from "@tanstack/react-query";
import { GrammarLesson } from "@/types/grammar";

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
