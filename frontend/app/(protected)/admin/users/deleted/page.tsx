"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import { getDeletedUsers, restoreUser, permanentlyDeleteUser } from "@/services/adminService";
import { AdminUser } from "@/types/admin";
import { Badge } from "@/componenets/ui/badge";
import { Card } from "@/componenets/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componenets/ui/table";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import Button from "@/componenets/Button";
import Loading from "@/componenets/Loading";
import { ArrowLeft, RotateCcw, UserX } from "lucide-react";

const BUTTON_HOVER = "transition-transform duration-200 hover:-translate-y-0.5";

export default function AdminDeletedUsersPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [userToRestore, setUserToRestore] = useState<AdminUser | null>(null);
    const [userToPurge, setUserToPurge] = useState<AdminUser | null>(null);

    const fetchUsers = useCallback(() => {
        getDeletedUsers()
            .then((res) => setUsers(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load deleted users."))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchUsers();
    }, [hasHydrated, userProfile, router, fetchUsers]);

    const confirmRestore = () => {
        const user = userToRestore;
        if (!user) return;
        setUserToRestore(null);
        setIsSaving(true);
        restoreUser(user.id)
            .then(() => {
                toast.success(`${user.email} restored.`);
                fetchUsers();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to restore user."))
            .finally(() => setIsSaving(false));
    };

    const confirmPurge = () => {
        const user = userToPurge;
        if (!user) return;
        setUserToPurge(null);
        setIsSaving(true);
        permanentlyDeleteUser(user.id, user.email)
            .then(() => {
                toast.success(`${user.email} permanently deleted.`);
                fetchUsers();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to permanently delete user."))
            .finally(() => setIsSaving(false));
    };

    const query = search.trim().toLowerCase();
    const visibleUsers = users.filter(
        (u) => !query || u.email.toLowerCase().includes(query) || (u.displayName ?? "").toLowerCase().includes(query),
    );

    return (
        <div className="px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Deleted Users</h1>
                        <p className="text-foreground/60 mt-2">
                            Deleted accounts are hidden and cannot log in, but their data is kept. Restore them, or delete them
                            permanently.
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        className={`flex items-center gap-2 ${BUTTON_HOVER}`}
                        onClick={() => router.push("/admin/users")}
                    >
                        <ArrowLeft className="size-4" />
                        Back to Users
                    </Button>
                </div>

                <Card className="mt-8 py-0 overflow-hidden">
                    {isLoading ? (
                        <Loading message="Loading deleted users..." />
                    ) : (
                        <div className="p-6">
                            <label className="mb-4 flex items-center justify-end gap-2 text-sm text-foreground/70">
                                Search:
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name or email..."
                                    className="rounded-lg border border-border bg-muted text-foreground px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                                />
                            </label>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.displayName || user.username || "-"}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>{user.accountType}</TableCell>
                                            <TableCell className="flex justify-end gap-2">
                                                <Button
                                                    variant="secondary"
                                                    className={`flex items-center gap-1.5 px-3 py-1 text-sm ${BUTTON_HOVER}`}
                                                    onClick={() => setUserToRestore(user)}
                                                >
                                                    <RotateCcw className="size-3.5" />
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className={`flex items-center gap-1.5 px-3 py-1 text-sm text-destructive ${BUTTON_HOVER}`}
                                                    onClick={() => setUserToPurge(user)}
                                                >
                                                    <UserX className="size-3.5" />
                                                    Delete permanently
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {visibleUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-foreground/50 py-10">
                                                No deleted users.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>
            </div>

            <ConfirmDialog
                isOpen={Boolean(userToRestore)}
                title="Restore this user?"
                message={`"${userToRestore?.email}" will appear in the Users list again${userToRestore?.enabled === false ? " (the account is still disabled)" : " and can log in"}.`}
                confirmLabel="Restore"
                cancelLabel="Cancel"
                danger={false}
                onConfirm={confirmRestore}
                onCancel={() => setUserToRestore(null)}
            />

            <ConfirmDialog
                isOpen={Boolean(userToPurge)}
                title="Permanently delete this user?"
                message={`This permanently deletes "${userToPurge?.email}" and ALL of their data (progress, bookmarks, attempts, chats, notifications, exam data). This cannot be undone.`}
                confirmLabel="Delete permanently"
                cancelLabel="Cancel"
                requireText={userToPurge?.email}
                requireTextLabel="Type the user's email to confirm"
                onConfirm={confirmPurge}
                onCancel={() => setUserToPurge(null)}
            />

            {isSaving && <Loading message="Please wait..." />}
        </div>
    );
}
