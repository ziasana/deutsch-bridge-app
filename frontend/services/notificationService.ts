import api from "./api";
import {
    AdminNotificationSettings,
    NotificationAnalytics,
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
