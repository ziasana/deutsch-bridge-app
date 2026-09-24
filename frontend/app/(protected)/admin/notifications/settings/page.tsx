"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, FlaskConical, Play } from "lucide-react";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import {
    getAdminNotificationSettings,
    getNotificationAnalytics,
    getNotificationTemplates,
    runNotificationSweep,
    updateAdminNotificationSettings,
    updateNotificationTemplates,
} from "@/services/notificationService";
import { AdminNotificationSettings, NotificationAnalytics, NotificationTemplate } from "@/types/notification";
import { Card, CardContent } from "@/componenets/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componenets/ui/table";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import ToggleSwitch from "@/componenets/notifications/ToggleSwitch";
import NotificationsSubNav from "@/componenets/admin/NotificationsSubNav";

const TYPE_LABELS: Record<string, string> = {
    REVIEW_DUE: "Review reminders",
    DAILY_WORDS_READY: "Daily Words",
    DAILY_PLAN_INCOMPLETE: "Daily Plan",
    CONTINUE_LEARNING: "Continue learning",
    MILESTONE_REACHED: "Milestones",
};

const TEMPLATE_LABELS: Record<string, string> = {
    REVIEW_DUE: "Review due",
    DAILY_WORDS_READY: "Daily Words ready",
    DAILY_PLAN_INCOMPLETE: "Daily plan incomplete",
    "CONTINUE_LEARNING.READING": "Continue learning — reading",
    "CONTINUE_LEARNING.EXAM": "Continue learning — exam",
    "MILESTONE_REACHED.WORDS": "Milestone — words",
    "MILESTONE_REACHED.GRAMMAR": "Milestone — grammar",
    "MILESTONE_REACHED.READING": "Milestone — reading",
    "MILESTONE_REACHED.STREAK": "Milestone — streak",
};

const LANGUAGE_LABELS: Record<string, string> = { de: "Deutsch", en: "English", fa: "فارسی" };
const ANALYTICS_RANGES = [7, 30, 90];

const INPUT_CLASS =
    "rounded-lg border border-border bg-muted text-foreground px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const templateId = (t: Pick<NotificationTemplate, "templateKey" | "language">) => `${t.templateKey}:${t.language}`;

export default function AdminNotificationsPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<AdminNotificationSettings | null>(null);
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [dirtyTemplates, setDirtyTemplates] = useState<Set<string>>(new Set());
    const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
    const [days, setDays] = useState(30);
    /** Raw textarea text; parsed into settings.testUserEmails on save. */
    const [testEmailsText, setTestEmailsText] = useState("");

    const fetchAnalytics = useCallback((range: number) => {
        getNotificationAnalytics(range)
            .then((res) => setAnalytics(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load analytics."));
    }, []);

    const fetchAll = useCallback(() => {
        Promise.all([getAdminNotificationSettings(), getNotificationTemplates()])
            .then(([settingsRes, templatesRes]) => {
                setSettings(settingsRes.data);
                setTestEmailsText(settingsRes.data.testUserEmails.join("\n"));
                setTemplates(templatesRes.data);
                setDirtyTemplates(new Set());
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load notification settings."))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchAll();
    }, [hasHydrated, userProfile, router, fetchAll]);

    useEffect(() => {
        if (hasHydrated && userProfile?.role === "ADMIN") fetchAnalytics(days);
    }, [hasHydrated, userProfile, days, fetchAnalytics]);

    const templateGroups = useMemo(() => {
        const groups = new Map<string, NotificationTemplate[]>();
        templates.forEach((t) => groups.set(t.templateKey, [...(groups.get(t.templateKey) ?? []), t]));
        return Array.from(groups.entries());
    }, [templates]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const patchSettings = (patch: Partial<AdminNotificationSettings>) =>
        setSettings((prev) => (prev ? { ...prev, ...patch } : prev));

    const saveSettings = () => {
        if (!settings) return;
        const testUserEmails = testEmailsText
            .split(/[\s,;]+/)
            .map((e) => e.trim())
            .filter((e) => e.includes("@"));
        setIsSaving(true);
        updateAdminNotificationSettings({ ...settings, testUserEmails })
            .then((res) => {
                setSettings(res.data.data);
                setTestEmailsText(res.data.data.testUserEmails.join("\n"));
                toast.success("Notification settings saved.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save notification settings."))
            .finally(() => setIsSaving(false));
    };

    const editTemplate = (target: NotificationTemplate, patch: Partial<Pick<NotificationTemplate, "title" | "body">>) => {
        setTemplates((prev) => prev.map((t) => (templateId(t) === templateId(target) ? { ...t, ...patch } : t)));
        setDirtyTemplates((prev) => new Set(prev).add(templateId(target)));
    };

    const saveTemplates = () => {
        const payload = templates
            .filter((t) => dirtyTemplates.has(templateId(t)))
            .map(({ templateKey, language, title, body }) => ({ templateKey, language, title, body }));
        if (payload.length === 0) return;
        setIsSaving(true);
        updateNotificationTemplates(payload)
            .then((res) => {
                setTemplates(res.data.data);
                setDirtyTemplates(new Set());
                toast.success("Templates saved.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save templates."))
            .finally(() => setIsSaving(false));
    };

    const runSweep = () => {
        setIsSaving(true);
        runNotificationSweep()
            .then(() => {
                toast.success(
                    settings?.testModeEnabled && settings.testUserEmails.length > 0
                        ? "Evaluation finished — test learners were sent their current best notification."
                        : "Evaluation finished."
                );
                fetchAnalytics(days);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to run evaluation."))
            .finally(() => setIsSaving(false));
    };

    return (
        <div className="px-6 py-10">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <button
                            type="button"
                            onClick={() => router.push("/admin")}
                            className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-2"
                        >
                            <ArrowLeft className="size-4" /> Back to Admin
                        </button>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                            <Bell className="size-7 text-primary" /> Notifications
                        </h1>
                        <p className="text-foreground/60 mt-2">
                            Limits, notification types, localized copy, and whether notifications actually lead to learning.
                        </p>
                    </div>
                    <Button variant="secondary" className="flex items-center gap-2" onClick={runSweep} disabled={isSaving}>
                        <Play className="size-4" /> Run evaluation now
                    </Button>
                </div>

                <NotificationsSubNav />

                {settings?.testModeEnabled && (
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                        <FlaskConical className="mt-0.5 size-4 shrink-0" />
                        <p>
                            Test mode is on. &ldquo;Run evaluation now&rdquo; sends{" "}
                            {settings.testUserEmails.length > 0 ? settings.testUserEmails.join(", ") : "no one (add test learners below)"}{" "}
                            a notification right away, ignoring quiet hours, daily limits, the minimum gap and the
                            once-per-day rule. Everyone else, and all scheduled runs, follow the normal rules.
                        </p>
                    </div>
                )}

                {isLoading || !settings ? (
                    <div className="mt-10 text-center text-foreground/50">Loading notification settings...</div>
                ) : (
                    <div className="mt-8 space-y-8">
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">Notifications enabled</h2>
                                        <p className="text-sm text-foreground/60 mt-1">
                                            Master switch. When off, no new learner notifications are created.
                                        </p>
                                    </div>
                                    <ToggleSwitch
                                        label="Notifications enabled"
                                        checked={settings.enabled}
                                        onChange={(v) => patchSettings({ enabled: v })}
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <label className="text-sm text-foreground/80">
                                        <span className="block font-medium">Max learning notifications / day</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={settings.maxLearningPerDay}
                                            onChange={(e) => patchSettings({ maxLearningPerDay: Number(e.target.value) })}
                                            className={`${INPUT_CLASS} mt-1.5 w-24`}
                                        />
                                    </label>
                                    <label className="text-sm text-foreground/80">
                                        <span className="block font-medium">Max reminder notifications / day</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={settings.maxReminderPerDay}
                                            onChange={(e) => patchSettings({ maxReminderPerDay: Number(e.target.value) })}
                                            className={`${INPUT_CLASS} mt-1.5 w-24`}
                                        />
                                    </label>
                                    <label className="text-sm text-foreground/80">
                                        <span className="block font-medium">Minimum time between reminders (minutes)</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={15}
                                            value={settings.minGapMinutes}
                                            onChange={(e) => patchSettings({ minGapMinutes: Number(e.target.value) })}
                                            className={`${INPUT_CLASS} mt-1.5 w-24`}
                                        />
                                    </label>
                                    <label className="text-sm text-foreground/80">
                                        <span className="block font-medium">Default reminder time</span>
                                        <input
                                            type="time"
                                            value={settings.defaultReminderTime}
                                            onChange={(e) => e.target.value && patchSettings({ defaultReminderTime: e.target.value })}
                                            className={`${INPUT_CLASS} mt-1.5`}
                                        />
                                    </label>
                                    <div className="text-sm text-foreground/80">
                                        <span className="block font-medium">Default quiet hours</span>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <input
                                                type="time"
                                                aria-label="Quiet hours start"
                                                value={settings.quietHoursStart}
                                                onChange={(e) => e.target.value && patchSettings({ quietHoursStart: e.target.value })}
                                                className={INPUT_CLASS}
                                            />
                                            <span>–</span>
                                            <input
                                                type="time"
                                                aria-label="Quiet hours end"
                                                value={settings.quietHoursEnd}
                                                onChange={(e) => e.target.value && patchSettings({ quietHoursEnd: e.target.value })}
                                                className={INPUT_CLASS}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-foreground/50">
                                    Reminder time and quiet hours are defaults for learners who haven&apos;t chosen their own.
                                    Learners can lower the daily limits for themselves, never raise them.
                                </p>

                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-1">Notification types</h3>
                                    <div className="divide-y divide-border">
                                        {Object.entries(settings.types).map(([type, enabled]) => (
                                            <div key={type} className="flex items-center justify-between py-2.5">
                                                <span className="text-sm text-foreground/80">{TYPE_LABELS[type] ?? type}</span>
                                                <ToggleSwitch
                                                    label={TYPE_LABELS[type] ?? type}
                                                    checked={enabled}
                                                    onChange={(v) => patchSettings({ types: { ...settings.types, [type]: v } })}
                                                    disabled={isSaving}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                                <FlaskConical className="size-4 text-primary" /> Test mode
                                            </h3>
                                            <p className="text-sm text-foreground/60 mt-1">
                                                For trying out notifications without waiting. Only affects the test learners
                                                below, and only when you press &ldquo;Run evaluation now&rdquo;: they get their
                                                current best notification immediately, every time. Their own notification
                                                preferences and the type switches above still apply.
                                            </p>
                                        </div>
                                        <ToggleSwitch
                                            label="Test mode"
                                            checked={settings.testModeEnabled}
                                            onChange={(v) => patchSettings({ testModeEnabled: v })}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <label className="mt-3 block text-sm text-foreground/80">
                                        <span className="block font-medium">Test learners (one email per line)</span>
                                        <textarea
                                            rows={3}
                                            value={testEmailsText}
                                            onChange={(e) => setTestEmailsText(e.target.value)}
                                            placeholder="learner@example.com"
                                            className={`${INPUT_CLASS} mt-1.5 w-full font-mono`}
                                        />
                                    </label>
                                </div>

                                <div className="flex justify-end">
                                    <Button variant="primary" onClick={saveSettings} disabled={isSaving}>
                                        Save settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">Notification → learning</h2>
                                        <p className="text-sm text-foreground/60 mt-1">
                                            Clicked = the learner opened the activity from the notification. Completed = they
                                            then finished it (e.g. emptied the review queue).
                                        </p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {ANALYTICS_RANGES.map((range) => (
                                            <button
                                                key={range}
                                                type="button"
                                                onClick={() => setDays(range)}
                                                className={`rounded-lg px-3 py-1 text-sm ${
                                                    days === range ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"
                                                }`}
                                            >
                                                {range}d
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {analytics && (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-end">Sent</TableHead>
                                                <TableHead className="text-end">Opened</TableHead>
                                                <TableHead className="text-end">Clicked</TableHead>
                                                <TableHead className="text-end">Completed</TableHead>
                                                <TableHead className="text-end">Conversion</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.byType.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-foreground/50">
                                                        No notifications sent in this period.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {[...analytics.byType, ...(analytics.byType.length > 1 ? [analytics.totals] : [])].map((row) => (
                                                <TableRow key={row.type} className={row.type === "ALL" ? "font-semibold" : ""}>
                                                    <TableCell>{row.type === "ALL" ? "All types" : TYPE_LABELS[row.type] ?? row.type}</TableCell>
                                                    <TableCell className="text-end tabular-nums">{row.sent}</TableCell>
                                                    <TableCell className="text-end tabular-nums">{row.opened}</TableCell>
                                                    <TableCell className="text-end tabular-nums">
                                                        {row.clicked} <span className="text-foreground/45">({percent(row.clickRate)})</span>
                                                    </TableCell>
                                                    <TableCell className="text-end tabular-nums">{row.completed}</TableCell>
                                                    <TableCell className="text-end tabular-nums">{percent(row.conversionRate)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">Templates</h2>
                                        <p className="text-sm text-foreground/60 mt-1">
                                            Use the listed <code className="text-xs">{"{{placeholders}}"}</code> — they&apos;re filled in per learner.
                                        </p>
                                    </div>
                                    <Button variant="primary" onClick={saveTemplates} disabled={isSaving || dirtyTemplates.size === 0}>
                                        Save templates{dirtyTemplates.size > 0 ? ` (${dirtyTemplates.size})` : ""}
                                    </Button>
                                </div>

                                <div className="divide-y divide-border">
                                    {templateGroups.map(([key, group]) => (
                                        <div key={key} className="py-5">
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <h3 className="font-semibold text-foreground">{TEMPLATE_LABELS[key] ?? key}</h3>
                                                <p className="text-xs text-foreground/50">
                                                    {group[0]?.placeholders.map((p) => `{{${p}}}`).join("  ") || "No placeholders"}
                                                </p>
                                            </div>
                                            <div className="mt-3 space-y-3">
                                                {group.map((tpl) => (
                                                    <div key={templateId(tpl)} dir={tpl.language === "fa" ? "rtl" : "ltr"} className="grid gap-2 sm:grid-cols-[6rem_1fr]">
                                                        <span className="pt-1.5 text-xs font-medium text-foreground/60">{LANGUAGE_LABELS[tpl.language]}</span>
                                                        <div className="space-y-1.5">
                                                            <input
                                                                aria-label={`${key} ${tpl.language} title`}
                                                                value={tpl.title}
                                                                onChange={(e) => editTemplate(tpl, { title: e.target.value })}
                                                                className={`${INPUT_CLASS} w-full`}
                                                            />
                                                            <input
                                                                aria-label={`${key} ${tpl.language} body`}
                                                                value={tpl.body ?? ""}
                                                                onChange={(e) => editTemplate(tpl, { body: e.target.value })}
                                                                className={`${INPUT_CLASS} w-full text-foreground/80`}
                                                            />
                                                            {tpl.defaultTitle && (tpl.title !== tpl.defaultTitle || (tpl.body ?? "") !== (tpl.defaultBody ?? "")) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => editTemplate(tpl, { title: tpl.defaultTitle ?? "", body: tpl.defaultBody })}
                                                                    className="text-xs text-primary hover:underline"
                                                                >
                                                                    Reset to default
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {isSaving && <Loading message="Please wait..." />}
        </div>
    );
}
