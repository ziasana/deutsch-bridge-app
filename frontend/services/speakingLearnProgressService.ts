import api from "./api";
import type { SpeakingExamCode } from "./speakingService";

export interface SpeakingStationProgress {
    part: number;
    station: string;
    correct: number;
    total: number;
}

export const getSpeakingLearnProgress = async (level: string, exam: SpeakingExamCode = "TELC") =>
    api.get<SpeakingStationProgress[]>("/speaking/learn-progress", { params: { level, exam } });

export const saveSpeakingLearnProgress = async (level: string, part: number, station: string, correct: number, total: number, exam: SpeakingExamCode = "TELC") =>
    api.put<SpeakingStationProgress>(`/speaking/learn-progress/${part}/${station}`, { part, station, correct, total }, { params: { level, exam } });

export const resetSpeakingLearnProgress = async (level: string, part: number, exam: SpeakingExamCode = "TELC") =>
    api.delete(`/speaking/learn-progress/${part}`, { params: { level, exam } });
