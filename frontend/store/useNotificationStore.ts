import { create } from "zustand";
import {
    getNotificationPreferences,
    getNotifications,
    getUnreadCount,
    markAllNotificationsRead,
    markNotificationRead,
    trackNotificationClick,
    updateNotificationPreferences,
} from "@/services/notificationService";
import { NotificationItemDto, NotificationPreferences } from "@/types/notification";

const RECENT_SIZE = 6;

interface NotificationState {
    /** Most recent notifications, shown in the header bell's popover. */
    notifications: NotificationItemDto[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    preferences: NotificationPreferences | null;
    timezoneSynced: boolean;

    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    /** Records the click (which also marks it read) and returns the destination to navigate to. */
    openNotification: (notification: NotificationItemDto) => Promise<string | null>;
    fetchPreferences: () => Promise<void>;
    updatePreferences: (patch: Partial<NotificationPreferences>) => Promise<void>;
    /** Reports the device timezone once, if the backend doesn't know it yet, so reminders use local time. */
    ensureTimezone: () => Promise<void>;
    reset: () => void;
}

export function deviceTimezone(): string | null {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
    } catch {
        return null;
    }
}

/** Only follow in-app paths; the backend always sends them, this is a guard against anything else. */
export function safeActionUrl(url: string | null | undefined): string | null {
    return url && url.startsWith("/") && !url.startsWith("//") ? url : null;
}

/**
 * Client state for the notification center. Deliberately contains no decision logic about *when*
 * to notify - that lives entirely in the backend; this store only mirrors and updates what exists.
 */
const useNotificationStore = create<NotificationState>((set, get) => {
    const markLocallyRead = (id: string) =>
        set((state) => {
            const wasUnread = state.notifications.some((n) => n.id === id && !n.read);
            return {
                notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
            };
        });

    return {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        preferences: null,
        timezoneSynced: false,

        fetchNotifications: async () => {
            set({ loading: true, error: null });
            try {
                const [list, count] = await Promise.all([getNotifications({ size: RECENT_SIZE }), getUnreadCount()]);
                set({ notifications: list.data.items, unreadCount: count.data.count });
            } catch (err: unknown) {
                set({ error: err instanceof Error ? err.message : "Failed to load notifications" });
            } finally {
                set({ loading: false });
            }
        },

        fetchUnreadCount: async () => {
            try {
                const res = await getUnreadCount();
                set({ unreadCount: res.data.count });
            } catch {
                // Non-fatal: the badge just keeps its last known value.
            }
        },

        markAsRead: async (id) => {
            markLocallyRead(id);
            try {
                await markNotificationRead(id);
            } catch {
                await get().fetchUnreadCount();
            }
        },

        markAllAsRead: async () => {
            set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 }));
            try {
                await markAllNotificationsRead();
            } catch {
                await get().fetchNotifications();
            }
        },

        openNotification: async (notification) => {
            if (!notification.read) markLocallyRead(notification.id);
            try {
                const res = await trackNotificationClick(notification.id);
                return safeActionUrl(res.data.actionUrl);
            } catch {
                return safeActionUrl(notification.actionUrl);
            }
        },

        fetchPreferences: async () => {
            const res = await getNotificationPreferences();
            set({ preferences: res.data });
        },

        updatePreferences: async (patch) => {
            const previous = get().preferences;
            if (previous) set({ preferences: { ...previous, ...patch } });
            try {
                const res = await updateNotificationPreferences(patch);
                set({ preferences: res.data.data });
            } catch (err) {
                set({ preferences: previous });
                throw err;
            }
        },

        ensureTimezone: async () => {
            if (get().timezoneSynced) return;
            set({ timezoneSynced: true });
            const zone = deviceTimezone();
            if (!zone) return;
            try {
                const res = await getNotificationPreferences();
                set({ preferences: res.data });
                if (!res.data.timezone) {
                    await get().updatePreferences({ timezone: zone });
                }
            } catch {
                set({ timezoneSynced: false });
            }
        },

        reset: () => set({ notifications: [], unreadCount: 0, preferences: null, error: null, timezoneSynced: false }),
    };
});

export default useNotificationStore;
