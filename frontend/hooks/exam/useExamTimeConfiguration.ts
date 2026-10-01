import { useQuery } from "@tanstack/react-query";
import { getExamTimeConfigurations } from "@/services/examTimeService";
import { ExamSection } from "@/types/exam";

/**
 * The recommended time for one Teil, loaded from the backend. `minutes` is null whenever there is
 * no usable configuration (none set, disabled, unknown level, or the request failed) - callers
 * must treat that as "no timing information" and keep the exercise fully usable.
 */
export function useExamTimeConfiguration(level: string | null | undefined, section: ExamSection, teil: number | null | undefined) {
    const { data, isLoading } = useQuery({
        queryKey: ["exam", "time-configurations", level],
        queryFn: () => getExamTimeConfigurations(level!).then((res) => res.data),
        enabled: !!level,
        staleTime: 5 * 60 * 1000,
    });

    const config = data?.find((c) => c.section === section && c.teil === teil) ?? null;
    return { minutes: config?.recommendedMinutes ?? null, isLoading: !!level && isLoading };
}
