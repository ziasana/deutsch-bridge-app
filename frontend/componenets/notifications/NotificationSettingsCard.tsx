"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent } from "@/componenets/ui/card";
import { useI18n } from "@/componenets/I18nProvider";
import ToggleSwitch from "@/componenets/notifications/ToggleSwitch";
import useNotificationStore, { deviceTimezone } from "@/store/useNotificationStore";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "@/lib/toast";
import { NotificationPreferences } from "@/types/notification";

const TIME_CLASS =
    "rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50";

type BooleanKey = {
    [K in keyof NotificationPreferences]: NotificationPreferences[K] extends boolean ? K : never;
}[keyof NotificationPreferences];

function Row({ label, hint, children }: Readonly<{ label: string; hint?: string; children: React.ReactNode }>) {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
                <p className="text-sm font-medium text-foreground/85">{label}</p>
                {hint && <p className="mt-0.5 text-xs text-foreground/50">{hint}</p>}
            </div>
            {children}
        </div>
    );
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{title}</p>
            <div className="mt-1 divide-y divide-border">{children}</div>
        </div>
    );
}

/**
 * Learner notification settings. Every change is saved immediately (optimistically) - there's no
 * separate save button, matching how toggles behave elsewhere in settings UIs.
 */
export default function NotificationSettingsCard() {
    const { t } = useI18n();
    const s = t.notifications.settings;
    const { preferences, fetchPreferences, updatePreferences } = useNotificationStore();
    const { userProfile, updateUserProfile } = useAuthStore();
    const [loadFailed, setLoadFailed] = useState(false);
    const device = deviceTimezone();

    useEffect(() => {
        fetchPreferences().catch(() => setLoadFailed(true));
    }, [fetchPreferences]);

    const save = (patch: Partial<NotificationPreferences>) => {
        updatePreferences(patch)
            .then(() => {
                // The profile's older notificationsEnabled flag mirrors the master switch on the backend.
                if (patch.learningRemindersEnabled !== undefined && userProfile) {
                    updateUserProfile({ ...userProfile, notificationsEnabled: patch.learningRemindersEnabled });
                }
            })
            .catch(() => toast.error(s.saveFailed));
    };

    const toggle = (key: BooleanKey, label: string, options: { hint?: string; disabled?: boolean } = {}) =>
        preferences && (
            <Row label={label} hint={options.hint}>
                <ToggleSwitch
                    label={label}
                    checked={preferences[key]}
                    disabled={options.disabled}
                    onChange={(value) => save({ [key]: value })}
                />
            </Row>
        );

    const learningOff = preferences ? !preferences.learningRemindersEnabled : false;
    const progressOff = preferences ? !preferences.progressNotificationsEnabled : false;

    return (
        <Card>
            <CardContent>
                <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                        <Bell className="size-4.5 text-accent-foreground" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
                        <p className="text-xs text-foreground/55">{s.subtitle}</p>
                    </div>
                </div>

                {!preferences && !loadFailed && (
                    <div className="mt-5 space-y-3" aria-busy>
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
                        ))}
                    </div>
                )}
                {loadFailed && <p className="mt-5 text-sm text-foreground/60">{t.notifications.loadError}</p>}

                {preferences && (
                    <div className="mt-5 space-y-6">
                        <Section title={s.learningSection}>
                            {toggle("learningRemindersEnabled", s.dailyReminders, { hint: s.dailyRemindersHint })}
                            {toggle("reviewRemindersEnabled", s.reviewReminders, { disabled: learningOff })}
                            {toggle("dailyPlanRemindersEnabled", s.dailyPlan, { disabled: learningOff })}
                            {toggle("examRemindersEnabled", s.examReminders, { disabled: learningOff })}
                        </Section>

                        <Section title={s.progressSection}>
                            {toggle("milestoneNotificationsEnabled", s.milestones, { disabled: progressOff })}
                            {toggle("weeklyProgressEnabled", s.weeklyProgress, { disabled: progressOff })}
                        </Section>

                        <Section title={s.scheduleSection}>
                            <Row label={s.preferredTime} hint={s.preferredTimeHint}>
                                <input
                                    type="time"
                                    aria-label={s.preferredTime}
                                    value={preferences.preferredReminderTime}
                                    disabled={learningOff}
                                    onChange={(e) => e.target.value && save({ preferredReminderTime: e.target.value })}
                                    className={TIME_CLASS}
                                />
                            </Row>

                            {toggle("quietHoursEnabled", s.quietHours, { hint: s.quietHoursHint })}
                            {preferences.quietHoursEnabled && (
                                <div className="flex flex-wrap items-center gap-3 pb-3 pt-1">
                                    <label className="flex items-center gap-2 text-sm text-foreground/70">
                                        {s.quietFrom}
                                        <input
                                            type="time"
                                            value={preferences.quietHoursStart}
                                            onChange={(e) => e.target.value && save({ quietHoursStart: e.target.value })}
                                            className={TIME_CLASS}
                                        />
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-foreground/70">
                                        {s.quietTo}
                                        <input
                                            type="time"
                                            value={preferences.quietHoursEnd}
                                            onChange={(e) => e.target.value && save({ quietHoursEnd: e.target.value })}
                                            className={TIME_CLASS}
                                        />
                                    </label>
                                </div>
                            )}

                            <div className="py-3 text-xs text-foreground/50">
                                {preferences.timezone && <p>{s.timezone(preferences.timezone)}</p>}
                                {device && device !== preferences.timezone && (
                                    <button
                                        type="button"
                                        onClick={() => save({ timezone: device })}
                                        className="mt-1 font-medium text-primary hover:underline"
                                    >
                                        {s.useDeviceTimezone(device)}
                                    </button>
                                )}
                            </div>
                        </Section>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
