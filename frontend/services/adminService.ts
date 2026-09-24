import api from "./api";
import {
    AccountType,
    AdminBulkDeleteUsersResult,
    AdminCreateUserPayload,
    AdminUpdateUserPayload,
    FeatureLimitUpdatePayload,
} from "@/types/admin";

export const getAllUsers = async () => {
    return await api.get("/admin/users");
};

export const createUser = async (data: AdminCreateUserPayload) => {
    return await api.post("/admin/users", data);
};

export const updateUser = async (id: string, data: AdminUpdateUserPayload) => {
    return await api.put(`/admin/users/${id}`, data);
};

export const setUserEnabled = async (id: string, enabled: boolean) => {
    return await api.put(`/admin/users/${id}/enabled`, { enabled });
};

export const deleteUser = async (id: string) => {
    return await api.delete(`/admin/users/${id}`);
};

export const bulkDeleteUsers = async (ids: string[]) => {
    return await api.post<AdminBulkDeleteUsersResult>("/admin/users/bulk-delete", { ids });
};

export const changeUserPassword = async (id: string, password: string) => {
    return await api.put(`/admin/users/${id}/password`, { password });
};

export const changeAccountType = async (id: string, accountType: AccountType) => {
    return await api.put(`/admin/users/${id}/account-type`, { accountType });
};

export const getPremiumSetting = async () => {
    return await api.get("/admin/settings/premium");
};

export const updatePremiumSetting = async (enabled: boolean) => {
    return await api.put("/admin/settings/premium", { enabled });
};

export const getFeatureLimits = async () => {
    return await api.get("/admin/settings/feature-limits");
};

export const updateFeatureLimits = async (payload: FeatureLimitUpdatePayload[]) => {
    return await api.put("/admin/settings/feature-limits", payload);
};

export const getAuditLog = async () => {
    return await api.get("/admin/settings/audit-log");
};
