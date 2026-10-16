import { useQuery } from "@tanstack/react-query";
import { getSpeakingGuides } from "@/services/speakingService";
import { SpeakingGuide } from "@/types/exam";
import type { SpeakingExamCode } from "@/services/speakingService";

/** The Lernbereich of every speaking Teil at `level` (cached). `guideFor(part)` is undefined until loaded or when a Teil has none. */
export function useSpeakingGuides(level: string | null | undefined, exam: SpeakingExamCode = "TELC") {
    const query = useQuery({
        queryKey: ["speaking", "guides", exam, level],
        queryFn: () => getSpeakingGuides(level!, exam).then((res) => res.data),
        enabled: !!level,
        staleTime: 5 * 60 * 1000,
    });
    const guideFor = (part: number): SpeakingGuide | undefined => query.data?.find((g) => g.part === part);
    return { ...query, guideFor };
}
