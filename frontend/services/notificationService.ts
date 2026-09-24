import api from "./api";
import {
    AdminNotificationSettings,
    NotificationAnalytics,
    NotificationAudienceType,
    NotificationBroadcastPage,
    NotificationBroadcastRequest,
    NotificationCategory,
    NotificationItemDto,
    NotificationPage,
    NotificationPreferences,
    NotificationTemplate,
} from "@/types/notification";

export interface NotificationQuery {
    page?: number;
    size?: number;
    categories?: NotificationCategory[];
    unread?: boolean;
}

export const getNotifications = async ({ page = 0, size = 20, categories = [], unread = false }: NotificationQuery = {}) => {
    // Repeated `category=` params (not axios' default `category[]=`) so Spring binds them to a List.
    const params = new URLSearchParams({ page: String(page), size: String(size), unread: String(unread) });
    categories.forEach((c) => params.append("category", c));
    return await api.get<NotificationPage>(`/notifications?${params.toString()}`);
};

export const getUnreadCount = async () => {
    return await api.get<{ count: number }>("/notifications/unread-count");
};

export const markNotificationRead = async (id: string) => {
    return await api.patch<NotificationItemDto>(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
    return await api.post("/notifications/read-all");
};

export const trackNotificationClick = async (id: string) => {
    return await api.post<NotificationItemDto>(`/notifications/${id}/click`);
};

export const getNotificationPreferences = async () => {
    return await api.get<NotificationPreferences>("/notification-preferences");
};

export const updateNotificationPreferences = async (patch: Partial<NotificationPreferences>) => {
    return await api.put<{ message: string; data: NotificationPreferences }>("/notification-preferences", patch);
};

// ---------------- Admin ----------------

export const getAdminNotificationSettings = async () => {
    return await api.get<AdminNotificationSettings>("/admin/notifications/settings");
};

export const updateAdminNotificationSettings = async (settings: AdminNotificationSettings) => {
    return await api.put<{ message: string; data: AdminNotificationSettings }>("/admin/notifications/settings", settings);
};

export const getNotificationTemplates = async () => {
    return await api.get<NotificationTemplate[]>("/admin/notifications/templates");
};

export const updateNotificationTemplates = async (templates: Pick<NotificationTemplate, "templateKey" | "language" | "title" | "body">[]) => {
    return await api.put<{ message: string; data: NotificationTemplate[] }>("/admin/notifications/templates", templates);
};

export const getNotificationAnalytics = async (days: number) => {
    return await api.get<NotificationAnalytics>(`/admin/notifications/analytics?days=${days}`);
};

export const runNotificationSweep = async () => {
    return await api.post("/admin/notifications/run-sweep");
};

export const getNotificationBroadcasts = async (page = 0, size = 20) => {
    return await api.get<NotificationBroadcastPage>(`/admin/notifications/broadcasts?page=${page}&size=${size}`);
};

export const createNotificationBroadcast = async (payload: NotificationBroadcastRequest) => {
    return await api.post<{ message: string; data: NotificationBroadcastPage["items"][number] }>(
        "/admin/notifications/broadcasts",
        payload
    );
};

export const updateNotificationBroadcast = async (id: string, payload: NotificationBroadcastRequest) => {
    return await api.put<{ message: string; data: NotificationBroadcastPage["items"][number] }>(
        `/admin/notifications/broadcasts/${id}`,
        payload
    );
};

export const deleteNotificationBroadcast = async (id: string) => {
    return await api.delete(`/admin/notifications/broadcasts/${id}`);
};

export const getAudienceCount = async (
    audienceType: NotificationAudienceType,
    level: string | null,
    accountType: string | null,
    language: string | null,
    userIds: string[] | null = null
) => {
    const params = new URLSearchParams({ audienceType });
    if (level) params.set("level", level);
    if (language) params.set("language", language);
    if (accountType) params.set("accountType", accountType);
    userIds?.forEach((id) => params.append("userIds", id));
    return await api.get<{ message: string | null; data: number }>(`/admin/notifications/broadcasts/audience-count?${params.toString()}`);
};
