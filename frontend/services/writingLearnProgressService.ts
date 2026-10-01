import api from "./api";

export interface StationProgress {
    station: string;
    correct: number;
    total: number;
}

export const getWritingLearnProgress = async (level: string) => {
    return await api.get<StationProgress[]>("/writing/learn-progress", { params: { level } });
};

export const saveWritingLearnProgress = async (level: string, station: string, correct: number, total: number) => {
    return await api.put<StationProgress>(`/writing/learn-progress/${station}`, { station, correct, total }, { params: { level } });
};

export const resetWritingLearnProgress = async (level: string) => {
    return await api.delete("/writing/learn-progress", { params: { level } });
};
