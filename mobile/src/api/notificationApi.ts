import type {
  NotificationCategory,
  NotificationItem,
  NotificationPage,
  NotificationPreferences,
} from '@/types/notification';
import { api } from './client';

export const notificationApi = {
  page: (page: number, size: number, categories: NotificationCategory[]) =>
    api.get<NotificationPage>('/notifications', {
      page,
      size,
      unread: false,
      category: categories.length > 0 ? categories : undefined,
    }),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<NotificationItem>(`/notifications/${id}/read`),
  markAllRead: () => api.post<unknown>('/notifications/read-all'),
  /** Records the click (which also marks it read) and returns the notification with its destination. */
  click: (id: string) => api.post<NotificationItem>(`/notifications/${id}/click`),
  /** Registers this app install for push (idempotent; the token moves to the signed-in account). */
  registerDevice: (token: string, platform: 'ios' | 'android') =>
    api.post<unknown>('/notifications/devices', { token, platform }),
  unregisterDevice: (token: string) =>
    api.delete<unknown>(`/notifications/devices?token=${encodeURIComponent(token)}`),
  preferences: () => api.get<NotificationPreferences>('/notification-preferences'),
  updatePreferences: (patch: Partial<NotificationPreferences>) =>
    api.put<{ message: string; data: NotificationPreferences }>('/notification-preferences', patch),
};
