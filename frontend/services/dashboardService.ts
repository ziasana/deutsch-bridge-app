import api from "./api";
import { DashboardResponse } from "@/types/dashboard";

export const getDashboard = async () => {
    return await api.get<DashboardResponse>("/dashboard");
};
