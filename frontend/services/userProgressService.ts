import api from "./api";
import {
    OverviewResponse,
    RecentVocabularyType,
    StreakResponse
} from "@/types/userProgress";

export const getRecentVocabularies = async () => {
    return await api.get<RecentVocabularyType[]>("/learning-progress/recent-vocabulary-progress");
}

export const getOverview = async () => {
    return await api.get<OverviewResponse>("/learning-progress/overview");
}

export const getStreak = async () => {
    return await api.get<StreakResponse>("/learning-progress/streak");
}
