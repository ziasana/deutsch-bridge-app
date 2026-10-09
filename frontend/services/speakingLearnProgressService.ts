import api from "./api";

export interface SpeakingStationProgress {
    part: number;
    station: string;
    correct: number;
    total: number;
}

export const getSpeakingLearnProgress = async (level: string) =>
    api.get<SpeakingStationProgress[]>("/speaking/learn-progress", { params: { level } });

export const saveSpeakingLearnProgress = async (level: string, part: number, station: string, correct: number, total: number) =>
    api.put<SpeakingStationProgress>(`/speaking/learn-progress/${part}/${station}`, { part, station, correct, total }, { params: { level } });

export const resetSpeakingLearnProgress = async (level: string, part: number) =>
    api.delete(`/speaking/learn-progress/${part}`, { params: { level } });
