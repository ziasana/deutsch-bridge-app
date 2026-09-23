"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Bell } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import useNotificationStore from "@/store/useNotificationStore";
import NotificationItem from "@/componenets/notifications/NotificationItem";
import NotificationEmptyState from "@/componenets/notifications/NotificationEmptyState";
import { NotificationItemDto } from "@/types/notification";

const POLL_INTERVAL_MS = 60_000;

export function formatBadge(count: number): string {
    return count > 99 ? "99+" : String(count);
}

/** Header bell with unread badge; opens a popover with the latest notifications. */
export default function NotificationBell() {
    const { t } = useI18n();
    const router = useRouter();
    const { notifications, unreadCount, loading, fetchNotifications, fetchUnreadCount, markAllAsRead, openNotification, ensureTimezone, reset } =
        useNotificationStore();

    useEffect(() => {
        fetchUnreadCount();
        ensureTimezone();
        const interval = globalThis.setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
        const onFocus = () => fetchUnreadCount();
        globalThis.addEventListener("focus", onFocus);
        return () => {
            globalThis.clearInterval(interval);
            globalThis.removeEventListener("focus", onFocus);
            // The bell unmounts on logout; don't leak one learner's notifications to the next session.
            reset();
        };
    }, [fetchUnreadCount, ensureTimezone, reset]);

    const handleOpen = async (notification: NotificationItemDto, close: () => void) => {
        close();
        const destination = await openNotification(notification);
        if (destination) router.push(destination);
    };

    return (
        <Popover className="relative">
            {({ close }) => (
                <>
                    <PopoverButton
                        onClick={() => fetchNotifications()}
                        className="relative flex size-9 items-center justify-center rounded-lg hover:bg-topbar-accent transition focus-visible:outline-2 focus-visible:outline-offset-2"
                        aria-label={t.notifications.bellLabel(unreadCount)}
                    >
                        <Bell className="size-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -end-0.5 min-w-[1.125rem] rounded-full bg-topbar-foreground px-1 text-[10px] font-semibold leading-[1.125rem] text-topbar text-center">
                                {formatBadge(unreadCount)}
                            </span>
                        )}
                    </PopoverButton>

                    <PopoverPanel
                        transition
                        className="absolute end-0 z-40 mt-2 w-[calc(100vw-2rem)] max-w-sm origin-top-right rtl:origin-top-left overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-border transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-leave:duration-75"
                    >
                        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                            <p className="font-semibold text-foreground">{t.notifications.title}</p>
                            {unreadCount > 0 && (
                                <button type="button" onClick={() => markAllAsRead()} className="text-xs font-medium text-primary hover:underline">
                                    {t.notifications.markAllRead}
                                </button>
                            )}
                        </div>

                        <div className="max-h-[26rem] overflow-y-auto divide-y divide-border">
                            {loading && notifications.length === 0 && (
                                <div className="space-y-3 p-4" aria-busy>
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                                    ))}
                                </div>
                            )}
                            {!loading && notifications.length === 0 && <NotificationEmptyState compact />}
                            {notifications.map((n) => (
                                <NotificationItem key={n.id} notification={n} compact onOpen={(item) => handleOpen(item, close)} />
                            ))}
                        </div>

                        <Link
                            href="/notifications"
                            onClick={() => close()}
                            className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-accent/50"
                        >
                            {t.notifications.viewAll} <span className="inline-block rtl:rotate-180">→</span>
                        </Link>
                    </PopoverPanel>
                </>
            )}
        </Popover>
    );
}
