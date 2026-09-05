import api from "./api";
import { AdminUpdateUserPayload } from "@/types/admin";

export const getAllUsers = async () => {
    return await api.get("/admin/users");
};

export const updateUser = async (id: string, data: AdminUpdateUserPayload) => {
    return await api.put(`/admin/users/${id}`, data);
};

export const changeUserPassword = async (id: string, password: string) => {
    return await api.put(`/admin/users/${id}/password`, { password });
};
