import api from "./api";
import { AdminDashboardResponse } from "@/types/adminDashboard";

export const getAdminDashboard = async () => {
    return await api.get<AdminDashboardResponse>("/admin/dashboard");
};
