import api from "./api";
import {
    OverviewResponse,
    ProgressStatsResponse
} from "@/types/userProgress";

export const getOverview = async () => {
    return await api.get<OverviewResponse>("/learning-progress/overview");
}

export const getProgressStats = async () => {
    return await api.get<ProgressStatsResponse>("/learning-progress/stats");
}
