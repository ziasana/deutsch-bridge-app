import { useQuery } from "@tanstack/react-query";
import { getExamExerciseLastTimes } from "@/services/examTimeService";
import { ExamSection } from "@/types/exam";
import { ExamExerciseLastTime } from "@/types/examTime";

/** Last finished time per exercise (by exercise id) for the lists. Empty while loading or if the request fails. */
export function useExerciseLastTimes(section: ExamSection, level: string | null | undefined) {
    const { data } = useQuery({
        queryKey: ["exam", "last-times", section, level],
        queryFn: () => getExamExerciseLastTimes(section, level!).then((res) => res.data),
        enabled: !!level,
    });
    return Object.fromEntries((data ?? []).map((t) => [t.exerciseId, t])) as Record<string, ExamExerciseLastTime>;
}
