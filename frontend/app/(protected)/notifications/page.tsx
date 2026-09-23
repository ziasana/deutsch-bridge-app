"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchParamsSuspense from "@/componenets/SearchParamsSuspense";
import { useI18n } from "@/componenets/I18nProvider";
import { Card } from "@/componenets/ui/card";
import NotificationItem from "@/componenets/notifications/NotificationItem";
import NotificationEmptyState from "@/componenets/notifications/NotificationEmptyState";
import useNotificationStore, { safeActionUrl } from "@/store/useNotificationStore";
import { getNotifications, trackNotificationClick } from "@/services/notificationService";
import { DayBucket, dayBucket } from "@/lib/notificationTime";
import { NotificationCategory, NotificationItemDto } from "@/types/notification";

type Tab = "all" | "learning" | "progress" | "system";

const TAB_CATEGORIES: Record<Tab, NotificationCategory[]> = {
    all: [],
    learning: ["LEARNING", "REMINDER"],
    progress: ["PROGRESS"],
    system: ["SYSTEM", "PREMIUM"],
};

const TABS: Tab[] = ["all", "learning", "progress", "system"];
const BUCKETS: DayBucket[] = ["today", "yesterday", "earlier"];
const PAGE_SIZE = 20;

/**
 * Landing point for clicks on OS push notifications (/notifications?open=<id>): records the click,
 * then deep-links to the notification's destination. Falls back to showing the list.
 */
function PushClickHandler() {
    const router = useRouter();
    const openId = useSearchParams().get("open");
    const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

    useEffect(() => {
        if (!openId) return;
        trackNotificationClick(openId)
            .then((res) => {
                fetchUnreadCount();
                const destination = safeActionUrl(res.data.actionUrl);
                router.replace(destination ?? "/notifications");
            })
            .catch(() => router.replace("/notifications"));
    }, [openId, router, fetchUnreadCount]);

    return null;
}

export default function NotificationsPage() {
    return (
        <>
            <SearchParamsSuspense fallback={null}>
                <PushClickHandler />
            </SearchParamsSuspense>
            <NotificationsList />
        </>
    );
}

function NotificationsList() {
    const { t } = useI18n();
    const router = useRouter();
    const { unreadCount, markAllAsRead, openNotification } = useNotificationStore();

    const [tab, setTab] = useState<Tab>("all");
    const [items, setItems] = useState<NotificationItemDto[]>([]);
    const [page, setPage] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    /** Only sets state asynchronously; callers flip `loading` on before calling (see load()). */
    const fetchPage = useCallback((nextTab: Tab, nextPage: number) => {
        getNotifications({ page: nextPage, size: PAGE_SIZE, categories: TAB_CATEGORIES[nextTab] })
            .then((res) => {
                setItems((prev) => (nextPage === 0 ? res.data.items : [...prev, ...res.data.items]));
                setHasNext(res.data.hasNext);
                setPage(nextPage);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    const load = (nextTab: Tab, nextPage: number) => {
        setLoading(true);
        setError(false);
        fetchPage(nextTab, nextPage);
    };

    useEffect(() => {
        fetchPage(tab, 0);
    }, [tab, fetchPage]);

    const changeTab = (next: Tab) => {
        if (next === tab) return;
        setItems([]);
        setHasNext(false);
        setLoading(true);
        setError(false);
        setTab(next);
    };

    const handleOpen = async (notification: NotificationItemDto) => {
        setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
        const destination = await openNotification(notification);
        if (destination) router.push(destination);
    };

    const handleMarkAll = async () => {
        await markAllAsRead();
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const grouped = BUCKETS.map((bucket) => ({
        bucket,
        items: items.filter((n) => dayBucket(n.createdAt) === bucket),
    })).filter((g) => g.items.length > 0);

    const bucketLabel: Record<DayBucket, string> = {
        today: t.notifications.today,
        yesterday: t.notifications.yesterday,
        earlier: t.notifications.earlier,
    };

    return (
        <div className="px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-foreground">{t.notifications.title}</h1>
                    {unreadCount > 0 && (
                        <button type="button" onClick={handleMarkAll} className="text-sm font-medium text-primary hover:underline">
                            {t.notifications.markAllRead}
                        </button>
                    )}
                </div>

                <div role="tablist" className="mt-5 flex gap-2 overflow-x-auto pb-1">
                    {TABS.map((key) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={tab === key}
                            onClick={() => changeTab(key)}
                            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                                tab === key
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-foreground/70 hover:bg-accent"
                            }`}
                        >
                            {t.notifications.tabs[key]}
                        </button>
                    ))}
                </div>

                <div className="mt-6 space-y-6">
                    {loading && items.length === 0 && (
                        <Card className="gap-0 space-y-3 p-4" aria-busy>
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                            ))}
                        </Card>
                    )}

                    {error && (
                        <Card className="items-center p-6 text-center">
                            <p className="text-sm text-foreground/60">{t.notifications.loadError}</p>
                            <button type="button" onClick={() => load(tab, 0)} className="text-sm font-medium text-primary hover:underline">
                                {t.notifications.retry}
                            </button>
                        </Card>
                    )}

                    {!loading && !error && items.length === 0 && (
                        <Card className="py-0">
                            <NotificationEmptyState />
                        </Card>
                    )}

                    {grouped.map((group) => (
                        <section key={group.bucket}>
                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                                {bucketLabel[group.bucket]}
                            </h2>
                            <Card className="gap-0 overflow-hidden py-0 divide-y divide-border">
                                {group.items.map((n) => (
                                    <NotificationItem key={n.id} notification={n} onOpen={handleOpen} compact />
                                ))}
                            </Card>
                        </section>
                    ))}

                    {hasNext && (
                        <div className="text-center">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => load(tab, page + 1)}
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-accent disabled:opacity-50"
                            >
                                {t.notifications.loadMore}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
