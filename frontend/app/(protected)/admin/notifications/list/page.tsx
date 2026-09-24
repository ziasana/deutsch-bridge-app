"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bell, Send } from "lucide-react";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import { getAllUsers } from "@/services/adminService";
import {
    createNotificationBroadcast,
    deleteNotificationBroadcast,
    getAudienceCount,
    getNotificationBroadcasts,
    updateNotificationBroadcast,
} from "@/services/notificationService";
import { AdminUser } from "@/types/admin";
import {
    NotificationAudienceLanguage,
    NotificationAudienceType,
    NotificationBroadcast,
    NotificationBroadcastRequest,
    NotificationBroadcastType,
} from "@/types/notification";
import { Card, CardContent } from "@/componenets/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componenets/ui/table";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import NotificationsSubNav from "@/componenets/admin/NotificationsSubNav";
import AdminTablePagination from "@/componenets/admin/table/AdminTablePagination";
import AdminSearchInput from "@/componenets/admin/table/AdminSearchInput";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ACCOUNT_TYPES = ["BASIC", "PREMIUM"];
const LANGUAGES: NotificationAudienceLanguage[] = ["EN", "PR"];
const LANGUAGE_LABELS: Record<NotificationAudienceLanguage, string> = { EN: "English", PR: "Persian" };

const TYPE_LABELS: Record<NotificationBroadcastType, string> = {
    ANNOUNCEMENT: "Announcement",
    SYSTEM_MESSAGE: "System Message",
    PROMOTION: "Promotion",
};

const STATUS_VARIANT: Record<NotificationBroadcast["status"], "default" | "secondary" | "outline"> = {
    SCHEDULED: "secondary",
    SENT: "default",
    CANCELLED: "outline",
};

const PAGE_SIZE = 20;

const INPUT_CLASS =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-sm";

type ScheduleMode = "now" | "schedule";

const makeEmptyForm = () => ({
    title: "",
    message: "",
    type: "ANNOUNCEMENT" as NotificationBroadcastType,
    audienceType: "ALL" as NotificationAudienceType,
    audienceLevel: LEVELS[0],
    audienceAccountType: ACCOUNT_TYPES[0],
    audienceLanguage: LANGUAGES[0] as NotificationAudienceLanguage,
    audienceUserIds: [] as string[],
    scheduleMode: "now" as ScheduleMode,
    scheduledAt: "",
});

/** Backend scheduledAt is a UTC ISO string; datetime-local inputs read/write local wall-clock time with
 * no timezone info, so the UTC instant must be shifted by the browser's own offset before slicing. */
function toLocalDatetimeInputValue(isoUtc: string): string {
    const date = new Date(isoUtc);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

function audienceSummary(b: NotificationBroadcast): string {
    if (b.audienceType === "ALL") return "All users";
    if (b.audienceType === "LEVEL") return `Level ${b.audienceLevel ?? "?"}`;
    if (b.audienceType === "ACCOUNT_TYPE") return b.audienceAccountType === "PREMIUM" ? "Premium users" : "Basic users";
    if (b.audienceType === "LANGUAGE") return LANGUAGE_LABELS[b.audienceLanguage as NotificationAudienceLanguage] ?? b.audienceLanguage ?? "?";
    return `${b.audienceUserIds.length} specific user${b.audienceUserIds.length === 1 ? "" : "s"}`;
}

export default function AdminNotificationsListPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(0);
    const [form, setForm] = useState(makeEmptyForm);
    const [editingBroadcast, setEditingBroadcast] = useState<NotificationBroadcast | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [broadcastToDelete, setBroadcastToDelete] = useState<NotificationBroadcast | null>(null);
    const [userSearch, setUserSearch] = useState("");
    const [recipientCount, setRecipientCount] = useState<number | null>(null);

    const BROADCASTS_KEY = ["admin", "notifications", "broadcasts", page];
    const { data: broadcastPage, isLoading } = useQuery({
        queryKey: BROADCASTS_KEY,
        queryFn: () => getNotificationBroadcasts(page, PAGE_SIZE).then((res) => res.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ["admin", "users", "all"],
        queryFn: () => getAllUsers().then((res) => res.data as AdminUser[]),
        enabled: hasHydrated && userProfile?.role === "ADMIN" && form.audienceType === "SPECIFIC_USERS",
    });

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") router.push("/dashboard");
    }, [hasHydrated, userProfile, router]);

    // Debounced recipient-count preview. Always asks the backend (even for SPECIFIC_USERS) so the count
    // reflects the same deleted/disabled filtering AudienceResolverService applies at actual send time.
    // No selection yet is a pure function of existing state, so it's derived below rather than synced
    // through an effect-driven setState.
    const noSelectionYet = form.audienceType === "SPECIFIC_USERS" && form.audienceUserIds.length === 0;
    const previewRecipientCount = noSelectionYet ? 0 : recipientCount;

    useEffect(() => {
        if (noSelectionYet) return;
        const level = form.audienceType === "LEVEL" ? form.audienceLevel : null;
        const accountType = form.audienceType === "ACCOUNT_TYPE" ? form.audienceAccountType : null;
        const language = form.audienceType === "LANGUAGE" ? form.audienceLanguage : null;
        const userIds = form.audienceType === "SPECIFIC_USERS" ? form.audienceUserIds : null;
        const timer = setTimeout(() => {
            getAudienceCount(form.audienceType, level, accountType, language, userIds)
                .then((res) => setRecipientCount(res.data.data))
                .catch(() => setRecipientCount(null));
        }, 300);
        return () => clearTimeout(timer);
    }, [form.audienceType, form.audienceLevel, form.audienceAccountType, form.audienceLanguage, form.audienceUserIds, noSelectionYet]);

    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        if (!q) return allUsers.slice(0, 50);
        return allUsers.filter((u) => u.email.toLowerCase().includes(q) || (u.displayName ?? "").toLowerCase().includes(q)).slice(0, 50);
    }, [allUsers, userSearch]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const invalidateBroadcasts = () => queryClient.invalidateQueries({ queryKey: ["admin", "notifications", "broadcasts"] });

    const resetForm = () => {
        setForm(makeEmptyForm());
        setEditingBroadcast(null);
        setUserSearch("");
    };

    const startEdit = (broadcast: NotificationBroadcast) => {
        setEditingBroadcast(broadcast);
        setForm({
            title: broadcast.title,
            message: broadcast.message,
            type: broadcast.type,
            audienceType: broadcast.audienceType,
            audienceLevel: broadcast.audienceLevel ?? LEVELS[0],
            audienceAccountType: broadcast.audienceAccountType ?? ACCOUNT_TYPES[0],
            audienceLanguage: (broadcast.audienceLanguage as NotificationAudienceLanguage) ?? LANGUAGES[0],
            audienceUserIds: broadcast.audienceUserIds,
            scheduleMode: broadcast.scheduledAt ? "schedule" : "now",
            scheduledAt: broadcast.scheduledAt ? toLocalDatetimeInputValue(broadcast.scheduledAt) : "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleUser = (id: string) => {
        setForm((prev) => ({
            ...prev,
            audienceUserIds: prev.audienceUserIds.includes(id)
                ? prev.audienceUserIds.filter((u) => u !== id)
                : [...prev.audienceUserIds, id],
        }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) {
            toast.error("Title and message are required.");
            return;
        }
        if (form.audienceType === "SPECIFIC_USERS" && form.audienceUserIds.length === 0) {
            toast.error("Select at least one user.");
            return;
        }
        if (form.scheduleMode === "schedule" && !form.scheduledAt) {
            toast.error("Pick a date and time to schedule.");
            return;
        }

        const payload: NotificationBroadcastRequest = {
            title: form.title.trim(),
            message: form.message.trim(),
            type: form.type,
            audienceType: form.audienceType,
            audienceLevel: form.audienceType === "LEVEL" ? form.audienceLevel : null,
            audienceAccountType: form.audienceType === "ACCOUNT_TYPE" ? form.audienceAccountType : null,
            audienceLanguage: form.audienceType === "LANGUAGE" ? form.audienceLanguage : null,
            audienceUserIds: form.audienceType === "SPECIFIC_USERS" ? form.audienceUserIds : null,
            scheduledAt: form.scheduleMode === "schedule" ? new Date(form.scheduledAt).toISOString() : null,
        };

        setIsSaving(true);
        const request = editingBroadcast
            ? updateNotificationBroadcast(editingBroadcast.id, payload)
            : createNotificationBroadcast(payload);

        request
            .then(() => {
                toast.success(editingBroadcast ? "Broadcast updated." : payload.scheduledAt ? "Broadcast scheduled." : "Notification sent.");
                resetForm();
                invalidateBroadcasts();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save broadcast."))
            .finally(() => setIsSaving(false));
    };

    const confirmDelete = () => {
        const broadcast = broadcastToDelete;
        if (!broadcast) return;
        setBroadcastToDelete(null);
        deleteNotificationBroadcast(broadcast.id)
            .then(() => {
                toast.success("Broadcast cancelled.");
                if (editingBroadcast?.id === broadcast.id) resetForm();
                invalidateBroadcasts();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to cancel broadcast."));
    };

    const items = broadcastPage?.items ?? [];
    const totalElements = broadcastPage?.totalElements ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

    return (
        <div className="px-6 py-10">
            <div className="max-w-5xl mx-auto">
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
                <p className="text-foreground/60 mt-2">Compose and schedule notifications, and review what&apos;s already gone out.</p>

                <NotificationsSubNav />

                <Card>
                    <CardContent className="p-6 space-y-6">
                        {editingBroadcast && (
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Editing &quot;{editingBroadcast.title}&quot; —{" "}
                                <button type="button" className="underline" onClick={resetForm}>
                                    cancel
                                </button>
                            </p>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <label className="text-sm text-foreground/80">
                                    <span className="block font-medium mb-1.5">Title</span>
                                    <input
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className={INPUT_CLASS}
                                        placeholder="New feature available"
                                    />
                                </label>
                                <label className="text-sm text-foreground/80">
                                    <span className="block font-medium mb-1.5">Type</span>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value as NotificationBroadcastType })}
                                        className={INPUT_CLASS}
                                    >
                                        {Object.entries(TYPE_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label className="block text-sm text-foreground/80">
                                <span className="block font-medium mb-1.5">Message</span>
                                <textarea
                                    rows={3}
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    className={INPUT_CLASS}
                                    placeholder="What's new, in a sentence or two."
                                />
                            </label>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <label className="text-sm text-foreground/80">
                                    <span className="block font-medium mb-1.5">Audience</span>
                                    <select
                                        value={form.audienceType}
                                        onChange={(e) => setForm({ ...form, audienceType: e.target.value as NotificationAudienceType })}
                                        className={INPUT_CLASS}
                                    >
                                        <option value="ALL">All users</option>
                                        <option value="LEVEL">By level</option>
                                        <option value="ACCOUNT_TYPE">By account type</option>
                                        <option value="LANGUAGE">By language</option>
                                        <option value="SPECIFIC_USERS">Specific user(s)</option>
                                    </select>
                                </label>

                                {form.audienceType === "LEVEL" && (
                                    <label className="text-sm text-foreground/80">
                                        <span className="block font-medium mb-1.5">Level</span>
                                        <select
                                            value={form.audienceLevel}
                                            onChange={(e) => setForm({ ...form, audienceLevel: e.target.value })}
                                            className={INPUT_CLASS}
                                        >
                                            {LEVELS.map((lvl) => (
                                                <option key={lvl} value={lvl}>
                                                    {lvl}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                {form.audienceType === "ACCOUNT_TYPE" && (
                                    <label className="text-sm text-foreground/80">
                                        <span className="block font-medium mb-1.5">Account type</span>
                                        <select
                                            value={form.audienceAccountType}
                                            onChange={(e) => setForm({ ...form, audienceAccountType: e.target.value })}
                                            className={INPUT_CLASS}
                                        >
                                            {ACCOUNT_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t === "PREMIUM" ? "Premium" : "Basic"}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                {form.audienceType === "LANGUAGE" && (
                                    <label className="text-sm text-foreground/80">
                                        <span className="block font-medium mb-1.5">Language</span>
                                        <select
                                            value={form.audienceLanguage}
                                            onChange={(e) => setForm({ ...form, audienceLanguage: e.target.value as NotificationAudienceLanguage })}
                                            className={INPUT_CLASS}
                                        >
                                            {LANGUAGES.map((lang) => (
                                                <option key={lang} value={lang}>
                                                    {LANGUAGE_LABELS[lang]}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                {previewRecipientCount !== null && form.audienceType !== "SPECIFIC_USERS" && (
                                    <p className="sm:col-span-2 text-xs text-foreground/50">~{previewRecipientCount} recipient(s)</p>
                                )}
                            </div>

                            {form.audienceType === "SPECIFIC_USERS" && (
                                <div className="space-y-2">
                                    <span className="block text-sm font-medium text-foreground/80">
                                        Users ({form.audienceUserIds.length} selected)
                                        {previewRecipientCount !== null && previewRecipientCount !== form.audienceUserIds.length && (
                                            <span className="ml-2 font-normal text-foreground/50">
                                                {previewRecipientCount} will actually receive it (some selected accounts are disabled or deleted)
                                            </span>
                                        )}
                                    </span>
                                    <AdminSearchInput value={userSearch} onChange={setUserSearch} placeholder="Search by name or email" />
                                    <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredUsers.map((u) => (
                                            <label
                                                key={u.id}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.audienceUserIds.includes(u.id)}
                                                    onChange={() => toggleUser(u.id)}
                                                />
                                                <span>{u.displayName || u.email}</span>
                                                <span className="text-foreground/40 text-xs">{u.email}</span>
                                            </label>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <p className="px-3 py-4 text-center text-sm text-foreground/50">No users found.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-5 sm:grid-cols-2">
                                <fieldset className="text-sm text-foreground/80">
                                    <legend className="font-medium mb-1.5">Schedule</legend>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-1.5">
                                            <input
                                                type="radio"
                                                name="scheduleMode"
                                                checked={form.scheduleMode === "now"}
                                                onChange={() => setForm({ ...form, scheduleMode: "now", scheduledAt: "" })}
                                            />
                                            Now
                                        </label>
                                        <label className="flex items-center gap-1.5">
                                            <input
                                                type="radio"
                                                name="scheduleMode"
                                                checked={form.scheduleMode === "schedule"}
                                                onChange={() => setForm({ ...form, scheduleMode: "schedule" })}
                                            />
                                            Schedule
                                        </label>
                                    </div>
                                </fieldset>

                                {form.scheduleMode === "schedule" && (
                                    <label className="text-sm text-foreground/80">
                                        <span className="block font-medium mb-1.5">Send at</span>
                                        <input
                                            type="datetime-local"
                                            value={form.scheduledAt}
                                            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                                            className={INPUT_CLASS}
                                        />
                                    </label>
                                )}
                            </div>

                            <Button variant="primary" className="flex items-center gap-2" type="submit" disabled={isSaving}>
                                <Send className="size-4" />
                                {isSaving ? "Saving..." : editingBroadcast ? "Save changes" : "Send"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="mt-8">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
                        {isLoading ? (
                            <div className="p-10 text-center text-foreground/50">Loading...</div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Audience</TableHead>
                                            <TableHead>Recipients</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Scheduled / Sent</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-foreground/50">
                                                    No notifications yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {items.map((b) => (
                                            <TableRow key={b.id}>
                                                <TableCell className="font-medium">{b.title}</TableCell>
                                                <TableCell>{TYPE_LABELS[b.type]}</TableCell>
                                                <TableCell>{audienceSummary(b)}</TableCell>
                                                <TableCell>{b.recipientCount ?? "—"}</TableCell>
                                                <TableCell>
                                                    <span className="flex items-center gap-1.5">
                                                        <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
                                                        {b.status === "SCHEDULED" && b.lastDispatchError && (
                                                            <span
                                                                title={`Last attempt failed${b.lastDispatchAttemptAt ? " at " + new Date(b.lastDispatchAttemptAt).toLocaleString() : ""}: ${b.lastDispatchError}`}
                                                            >
                                                                <AlertTriangle className="size-4 text-amber-500" />
                                                            </span>
                                                        )}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-foreground/60">
                                                    {new Date(b.sentAt ?? b.scheduledAt ?? b.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="space-x-2 whitespace-nowrap">
                                                    {b.status === "SCHEDULED" && (
                                                        <>
                                                            <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => startEdit(b)}>
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                className="px-3 py-1 text-sm"
                                                                onClick={() => setBroadcastToDelete(b)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="mt-4">
                                    <AdminTablePagination
                                        page={page + 1}
                                        totalPages={totalPages}
                                        totalItems={totalElements}
                                        startIndex={totalElements === 0 ? 0 : page * PAGE_SIZE + 1}
                                        endIndex={Math.min(totalElements, (page + 1) * PAGE_SIZE)}
                                        onPageChange={(p) => setPage(p - 1)}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {isSaving && <Loading message="Please wait..." />}
            <ConfirmDialog
                isOpen={Boolean(broadcastToDelete)}
                title="Cancel this notification?"
                message={`Cancel "${broadcastToDelete?.title ?? ""}"? It will not be sent.`}
                confirmLabel="Cancel notification"
                cancelLabel="Keep it"
                onConfirm={confirmDelete}
                onCancel={() => setBroadcastToDelete(null)}
            />
        </div>
    );
}
