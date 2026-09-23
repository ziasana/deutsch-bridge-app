"use client";

import { useI18n } from "@/componenets/I18nProvider";
import { formatRelativeTime } from "@/lib/notificationTime";
import { NotificationItemDto } from "@/types/notification";

interface NotificationItemProps {
    notification: NotificationItemDto;
    onOpen: (notification: NotificationItemDto) => void;
    compact?: boolean;
}

/**
 * One notification row. Unread vs read is intentionally subtle (a soft tint and a small primary dot,
 * never an alarming red) - learning notifications should invite, not create urgency.
 */
export default function NotificationItem({ notification, onOpen, compact }: Readonly<NotificationItemProps>) {
    const { language } = useI18n();
    const unread = !notification.read;

    return (
        <button
            type="button"
            onClick={() => onOpen(notification)}
            className={`group flex w-full items-start gap-3 text-start transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none ${
                compact ? "px-4 py-3" : "rounded-xl px-4 py-3.5"
            } ${unread ? "bg-accent/30" : ""}`}
        >
            <span
                aria-hidden
                className={`mt-1.5 size-2 shrink-0 rounded-full ${unread ? "bg-primary" : "bg-transparent"}`}
            />
            <span className="min-w-0 flex-1">
                <span className={`block text-sm text-foreground ${unread ? "font-semibold" : "font-medium text-foreground/80"}`}>
                    {notification.title}
                </span>
                {notification.body && (
                    <span className={`mt-0.5 block text-sm text-foreground/60 ${compact ? "line-clamp-2" : ""}`}>
                        {notification.body}
                    </span>
                )}
                <span className="mt-1 block text-xs text-foreground/45">
                    {formatRelativeTime(notification.createdAt, language)}
                </span>
            </span>
            {unread && <span className="sr-only">(unread)</span>}
        </button>
    );
}
