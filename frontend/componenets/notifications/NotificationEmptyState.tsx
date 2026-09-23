"use client";

import { BellRing } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";

export default function NotificationEmptyState({ compact }: Readonly<{ compact?: boolean }>) {
    const { t } = useI18n();
    return (
        <div className={`flex flex-col items-center text-center ${compact ? "px-6 py-8" : "px-6 py-16"}`}>
            <div className="rounded-full bg-accent p-3">
                <BellRing className="size-6 text-accent-foreground" />
            </div>
            <p className="mt-3 font-semibold text-foreground">{t.notifications.emptyTitle}</p>
            <p className="mt-1 max-w-xs text-sm text-foreground/60">{t.notifications.emptyBody}</p>
        </div>
    );
}
