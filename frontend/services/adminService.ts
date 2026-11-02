import api from "./api";
import {
    AccountType,
    AdminBulkDeleteUsersResult,
    AdminCreateUserPayload,
    AdminUser,
    AdminUpdateUserPayload,
    EmailConfig,
    EmailSendLogEntry,
    EmailTestType,
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

export const getDeletedUsers = async () => {
    return await api.get<AdminUser[]>("/admin/users/deleted");
};

export const restoreUser = async (id: string) => {
    return await api.post(`/admin/users/${id}/restore`);
};

/** Irreversible hard delete; the server also checks that confirmEmail matches the user's email. */
export const permanentlyDeleteUser = async (id: string, confirmEmail: string) => {
    return await api.post(`/admin/users/${id}/permanent-delete`, { confirmEmail });
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

export const getDownloadSetting = async () => {
    return await api.get("/admin/settings/downloads");
};

export const updateDownloadSetting = async (premiumOnly: boolean) => {
    return await api.put("/admin/settings/downloads", { premiumOnly });
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

export const getEmailTestConfig = async () => {
    return await api.get<EmailConfig>("/admin/settings/email-test/config");
};

export const getEmailTestLogs = async () => {
    return await api.get<EmailSendLogEntry[]>("/admin/settings/email-test/logs");
};

export const sendTestEmail = async (recipientEmail: string, type: EmailTestType) => {
    return await api.post<EmailSendLogEntry>("/admin/settings/email-test", { recipientEmail, type });
};
