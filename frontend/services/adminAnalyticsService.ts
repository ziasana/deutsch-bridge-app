import api from "./api";
import { AdminAnalyticsResponse, AnalyticsLevel, AnalyticsRange } from "@/types/adminAnalytics";

export const getAdminAnalytics = async (range: AnalyticsRange, level: AnalyticsLevel) => {
    return await api.get<AdminAnalyticsResponse>("/admin/dashboard/analytics", {
        params: { range, level },
    });
};
