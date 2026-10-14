import api from "./api";
import type { ContentIssue } from "@/types/examContent";
import type { SpeakingGuide } from "@/types/exam";

export type SpeakingExamCode = "TELC" | "DTZ";

/** The Lernbereich of all three Mündlicher Ausdruck Teile at a level. */
export const getSpeakingGuides = async (level: string, exam: SpeakingExamCode = "TELC") =>
    api.get<SpeakingGuide[]>("/speaking/guides", { params: { level, exam } });

export interface SaveSpeakingGuideResult {
    saved: boolean;
    issues: ContentIssue[];
    guide: SpeakingGuide | null;
}

/** Admin: validates (and, unless dryRun, stores) the Lernbereich of one Teil. */
export const saveSpeakingGuide = async (level: string, part: number, content: unknown, dryRun = false, exam: SpeakingExamCode = "TELC") =>
    api.put<SaveSpeakingGuideResult>(`/admin/speaking/guides/${part}`, { content, dryRun }, { params: { level, exam } });
