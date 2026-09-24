"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import {
    getAllUsers,
    createUser,
    updateUser,
    changeUserPassword,
    changeAccountType,
    setUserEnabled,
    deleteUser,
    bulkDeleteUsers,
} from "@/services/adminService";
import { AccountType, AdminCreateUserPayload, AdminUser } from "@/types/admin";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { Badge } from "@/componenets/ui/badge";
import { Card, CardContent } from "@/componenets/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componenets/ui/table";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ShieldCheck,
    Trash2,
    UserPlus,
    Users,
} from "lucide-react";

const CARD_HOVER = "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";
const BUTTON_HOVER = "transition-transform duration-200 hover:-translate-y-0.5";
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getInitials(name?: string | null, email?: string | null): string {
    return (name ?? email ?? "?")
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

type UserSortKey = "name" | "email" | "role" | "verified";
type SortDirection = "asc" | "desc";

const emptyNewUserForm: AdminCreateUserPayload = { displayName: "", email: "", password: "", role: "STUDENT" };

export default function AdminUsersPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
    const [accountTypeUser, setAccountTypeUser] = useState<AdminUser | null>(null);
    const [selectedAccountType, setSelectedAccountType] = useState<AccountType>("BASIC");
    const [showAddUser, setShowAddUser] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

    const [editForm, setEditForm] = useState({ displayName: "", role: "STUDENT", verified: false });
    const [newPassword, setNewPassword] = useState("");
    const [newUserForm, setNewUserForm] = useState<AdminCreateUserPayload>(emptyNewUserForm);
    const [isSaving, setIsSaving] = useState(false);

    const [userSearch, setUserSearch] = useState("");
    const [userPageSize, setUserPageSize] = useState(10);
    const [userPage, setUserPage] = useState(1);
    const [userSortKey, setUserSortKey] = useState<UserSortKey>("name");
    const [userSortDirection, setUserSortDirection] = useState<SortDirection>("asc");

    const fetchUsers = useCallback(() => {
        getAllUsers()
            .then((res) => setUsers(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load users."))
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

    const openEdit = (user: AdminUser) => {
        setEditingUser(user);
        setEditForm({
            displayName: user.displayName ?? "",
            role: user.role,
            verified: user.verified,
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSaving(true);
        updateUser(editingUser.id, editForm)
            .then(() => {
                toast.success("User updated successfully.");
                setEditingUser(null);
                fetchUsers();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update user."))
            .finally(() => setIsSaving(false));
    };

    const submitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordUser) return;
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setIsSaving(true);
        changeUserPassword(passwordUser.id, newPassword)
            .then(() => {
                toast.success(`Password updated for ${passwordUser.email}.`);
                setPasswordUser(null);
                setNewPassword("");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update password."))
            .finally(() => setIsSaving(false));
    };

    const openAccountType = (user: AdminUser) => {
        setAccountTypeUser(user);
        setSelectedAccountType(user.accountType ?? "BASIC");
    };

    const submitAccountType = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountTypeUser) return;
        setIsSaving(true);
        changeAccountType(accountTypeUser.id, selectedAccountType)
            .then(() => {
                toast.success(`${accountTypeUser.email} is now ${selectedAccountType}.`);
                setAccountTypeUser(null);
                fetchUsers();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update account type."))
            .finally(() => setIsSaving(false));
    };

    const openAddUser = () => {
        setNewUserForm(emptyNewUserForm);
        setShowAddUser(true);
    };

    const submitAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserForm.displayName.trim() || !newUserForm.email.trim()) {
            toast.error("Display name and email are required.");
            return;
        }
        if (newUserForm.password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setIsSaving(true);
        createUser(newUserForm)
            .then(() => {
                toast.success(`User ${newUserForm.email} created.`);
                setShowAddUser(false);
                fetchUsers();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to create user."))
            .finally(() => setIsSaving(false));
    };

    const toggleEnabled = (user: AdminUser) => {
        setIsSaving(true);
        setUserEnabled(user.id, !user.enabled)
            .then(() => {
                toast.success(user.enabled ? `${user.email} disabled.` : `${user.email} enabled.`);
                fetchUsers();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update user status."))
            .finally(() => setIsSaving(false));
    };

    const confirmRemoveUser = () => {
        const user = userToDelete;
        if (!user) return;
        setUserToDelete(null);
        setIsSaving(true);
        deleteUser(user.id)
            .then(() => {
                toast.success(`${user.email} deleted.`);
                fetchUsers();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete user."))
            .finally(() => setIsSaving(false));
    };

    const toggleSelectUser = (id: string) => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const runBulkDelete = () => {
        setConfirmBulkDelete(false);
        const ids = [...validSelectedIds];
        if (ids.length === 0) return;
        setIsSaving(true);
        bulkDeleteUsers(ids)
            .then((res) => {
                const { successCount, failureCount, rows } = res.data;
                if (failureCount === 0) {
                    toast.success(`${successCount} user(s) deleted.`);
                } else {
                    const reasons = rows.filter((r) => !r.success).map((r) => `${r.email ?? r.id}: ${r.errorMessage}`);
                    toast.error(
                        <div style={{ whiteSpace: "pre-line" }}>
                            {successCount} deleted, {failureCount} failed:{"\n"}
                            {reasons.join("\n")}
                        </div>
                    );
                }
                setSelectedUserIds(new Set());
                fetchUsers();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Bulk delete failed."))
            .finally(() => setIsSaving(false));
    };

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const totalUsers = users.length;
    const totalAdmins = users.filter((u) => u.role === "ADMIN").length;
    const totalVerified = users.filter((u) => u.verified).length;

    const toggleUserSort = (key: UserSortKey) => {
        if (userSortKey === key) {
            setUserSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setUserSortKey(key);
            setUserSortDirection("asc");
        }
        setUserPage(1);
    };

    const renderUserSortIcon = (column: UserSortKey) => {
        if (userSortKey !== column) return <ArrowUpDown className="size-3.5 opacity-40" />;
        return userSortDirection === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
    };

    const userSearchQuery = userSearch.trim().toLowerCase();
    const filteredUsers = userSearchQuery
        ? users.filter(
              (u) =>
                  (u.displayName ?? "").toLowerCase().includes(userSearchQuery) ||
                  u.email.toLowerCase().includes(userSearchQuery)
          )
        : users;

    const userValueFor = (u: AdminUser) => {
        switch (userSortKey) {
            case "name":
                return (u.displayName ?? "").toLowerCase();
            case "email":
                return u.email.toLowerCase();
            case "role":
                return u.role;
            case "verified":
                return u.verified ? 1 : 0;
        }
    };
    const sortedUsers = filteredUsers.slice().sort((a, b) => {
        const dir = userSortDirection === "asc" ? 1 : -1;
        const va = userValueFor(a);
        const vb = userValueFor(b);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });

    const userTotalPages = Math.max(1, Math.ceil(sortedUsers.length / userPageSize));
    const userCurrentPage = Math.min(userPage, userTotalPages);
    const userStartIndex = sortedUsers.length === 0 ? 0 : (userCurrentPage - 1) * userPageSize + 1;
    const userEndIndex = Math.min(userCurrentPage * userPageSize, sortedUsers.length);
    const paginatedUsers = sortedUsers.slice((userCurrentPage - 1) * userPageSize, userCurrentPage * userPageSize);
    const userPageNumbers = Array.from({ length: userTotalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === userTotalPages || Math.abs(p - userCurrentPage) <= 1
    );

    // Drop selections that no longer exist in the list (deleted elsewhere, or by a refresh).
    const validUserIds = new Set(users.map((u) => u.id));
    const validSelectedIds = new Set([...selectedUserIds].filter((id) => validUserIds.has(id)));

    const selectablePageUserIds = paginatedUsers.filter((u) => u.email !== userProfile?.email).map((u) => u.id);
    const allOnPageSelected = selectablePageUserIds.length > 0 && selectablePageUserIds.every((id) => validSelectedIds.has(id));

    const toggleSelectAllOnPage = () => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (allOnPageSelected) {
                selectablePageUserIds.forEach((id) => next.delete(id));
            } else {
                selectablePageUserIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    return (
        <div className="px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Users</h1>
                        <p className="text-foreground/60 mt-2">
                            Manage users, roles, and account access.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {validSelectedIds.size > 0 && (
                            <Button
                                variant="secondary"
                                className={`flex items-center gap-2 text-destructive ${BUTTON_HOVER}`}
                                onClick={() => setConfirmBulkDelete(true)}
                            >
                                <Trash2 className="size-4" />
                                Delete Selected ({validSelectedIds.size})
                            </Button>
                        )}
                        <Button variant="primary" className={`flex items-center gap-2 ${BUTTON_HOVER}`} onClick={openAddUser}>
                            <UserPlus className="size-4" />
                            Add User
                        </Button>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Card className={CARD_HOVER}>
                        <CardContent className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                                    <Users className="size-6 text-accent-foreground" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                                    <span className="text-sm text-foreground/60">Total Users</span>
                                </div>
                            </div>
                            <ChevronRight className="size-5 text-foreground/30" />
                        </CardContent>
                    </Card>

                    <Card className={CARD_HOVER}>
                        <CardContent className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                                    <ShieldCheck className="size-6 text-accent-foreground" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{totalAdmins}</p>
                                    <span className="text-sm text-foreground/60">Admins</span>
                                </div>
                            </div>
                            <ChevronRight className="size-5 text-foreground/30" />
                        </CardContent>
                    </Card>

                    <Card className={CARD_HOVER}>
                        <CardContent className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                                    <BadgeCheck className="size-6 text-accent-foreground" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{totalVerified}</p>
                                    <span className="text-sm text-foreground/60">Verified</span>
                                </div>
                            </div>
                            <ChevronRight className="size-5 text-foreground/30" />
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-8 py-0 overflow-hidden">
                    {isLoading ? (
                        <div className="p-10 text-center text-foreground/50">Loading users...</div>
                    ) : (
                        <div className="p-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <label className="flex items-center gap-2 text-sm text-foreground/70">
                                    Show
                                    <select
                                        value={userPageSize}
                                        onChange={(e) => {
                                            setUserPageSize(Number(e.target.value));
                                            setUserPage(1);
                                        }}
                                        className="rounded-lg border border-border bg-muted text-foreground px-2 py-1 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    entries
                                </label>

                                <label className="flex items-center gap-2 text-sm text-foreground/70">
                                    Search:
                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={(e) => {
                                            setUserSearch(e.target.value);
                                            setUserPage(1);
                                        }}
                                        placeholder="Name or email..."
                                        className="rounded-lg border border-border bg-muted text-foreground px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                                    />
                                </label>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <input
                                                type="checkbox"
                                                checked={allOnPageSelected}
                                                onChange={toggleSelectAllOnPage}
                                                disabled={selectablePageUserIds.length === 0}
                                                className="h-4 w-4 accent-primary"
                                                aria-label="Select all users on this page"
                                            />
                                        </TableHead>
                                        <TableHead>
                                            <button type="button" onClick={() => toggleUserSort("name")} className="flex items-center gap-1.5 font-medium hover:text-foreground">
                                                Name {renderUserSortIcon("name")}
                                            </button>
                                        </TableHead>
                                        <TableHead>
                                            <button type="button" onClick={() => toggleUserSort("email")} className="flex items-center gap-1.5 font-medium hover:text-foreground">
                                                Email {renderUserSortIcon("email")}
                                            </button>
                                        </TableHead>
                                        <TableHead>
                                            <button type="button" onClick={() => toggleUserSort("role")} className="flex items-center gap-1.5 font-medium hover:text-foreground">
                                                Role {renderUserSortIcon("role")}
                                            </button>
                                        </TableHead>
                                        <TableHead>
                                            <button type="button" onClick={() => toggleUserSort("verified")} className="flex items-center gap-1.5 font-medium hover:text-foreground">
                                                Verified {renderUserSortIcon("verified")}
                                            </button>
                                        </TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedUsers.map((user) => {
                                        const isSelf = user.email === userProfile?.email;
                                        return (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={validSelectedIds.has(user.id)}
                                                    onChange={() => toggleSelectUser(user.id)}
                                                    disabled={isSelf}
                                                    title={isSelf ? "You can't select your own account." : undefined}
                                                    className="h-4 w-4 accent-primary"
                                                    aria-label={`Select ${user.email}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                <div className="flex items-center gap-3">
                                                    {resolveUploadUrl(user.avatarUrl) ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={resolveUploadUrl(user.avatarUrl)!}
                                                            alt={user.displayName || "avatar"}
                                                            className="size-8 shrink-0 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                                                            {getInitials(user.displayName, user.email)}
                                                        </div>
                                                    )}
                                                    <span>{user.displayName || "—"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-foreground/70">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.verified ? "default" : "outline"}>
                                                    {user.verified ? "Verified" : "Unverified"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.accountType === "PREMIUM" ? "default" : "secondary"}>
                                                    {user.accountType ?? "BASIC"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.enabled ? "default" : "outline"}>
                                                    {user.enabled ? "Enabled" : "Disabled"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="space-x-2">
                                                <Button
                                                    variant="secondary"
                                                    className={`px-3 py-1 text-sm ${BUTTON_HOVER}`}
                                                    onClick={() => openEdit(user)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className={`px-3 py-1 text-sm ${BUTTON_HOVER}`}
                                                    onClick={() => setPasswordUser(user)}
                                                >
                                                    Change Password
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className={`px-3 py-1 text-sm ${BUTTON_HOVER}`}
                                                    onClick={() => openAccountType(user)}
                                                >
                                                    Change Plan
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className={`px-3 py-1 text-sm ${BUTTON_HOVER}`}
                                                    onClick={() => toggleEnabled(user)}
                                                    disabled={isSelf}
                                                    title={isSelf ? "You can't disable your own account." : undefined}
                                                >
                                                    {user.enabled ? "Disable" : "Enable"}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className={`px-3 py-1 text-sm text-destructive ${BUTTON_HOVER}`}
                                                    onClick={() => setUserToDelete(user)}
                                                    disabled={isSelf}
                                                    title={isSelf ? "You can't delete your own account." : undefined}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        );
                                    })}
                                    {sortedUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-foreground/50 py-10">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {sortedUsers.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                                    <p className="text-sm text-foreground/60">
                                        Showing {userStartIndex} to {userEndIndex} of {sortedUsers.length} entries
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={userCurrentPage === 1}
                                            onClick={() => setUserPage(1)}
                                            className="p-2 rounded-lg border border-border text-foreground/70 disabled:opacity-40 hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <ChevronsLeft className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={userCurrentPage === 1}
                                            onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                                            className="p-2 rounded-lg border border-border text-foreground/70 disabled:opacity-40 hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <ChevronLeft className="size-4" />
                                        </button>
                                        {userPageNumbers.map((p, idx) => {
                                            const prev = userPageNumbers[idx - 1];
                                            const showEllipsis = prev !== undefined && p - prev > 1;
                                            return (
                                                <div key={p} className="flex items-center gap-1">
                                                    {showEllipsis && <span className="px-1 text-foreground/40">…</span>}
                                                    <button
                                                        type="button"
                                                        onClick={() => setUserPage(p)}
                                                        className={`min-w-9 h-9 px-2 rounded-lg text-sm font-medium border ${
                                                            p === userCurrentPage
                                                                ? "bg-primary border-primary text-primary-foreground"
                                                                : "border-border text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            disabled={userCurrentPage === userTotalPages}
                                            onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
                                            className="p-2 rounded-lg border border-border text-foreground/70 disabled:opacity-40 hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <ChevronRight className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={userCurrentPage === userTotalPages}
                                            onClick={() => setUserPage(userTotalPages)}
                                            className="p-2 rounded-lg border border-border text-foreground/70 disabled:opacity-40 hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <ChevronsRight className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>

            {/* Edit user modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-4">
                    <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
                        <h2 className="text-2xl font-bold text-foreground mb-6">
                            Edit {editingUser.email}
                        </h2>
                        <form onSubmit={submitEdit} className="space-y-5">
                            <div>
                                <label className="block text-foreground/70 mb-2 text-sm">
                                    Display Name
                                </label>
                                <Input
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                    placeholder="Display name"
                                    required={false}
                                />
                            </div>

                            <div>
                                <label className="block text-foreground/70 mb-2 text-sm">
                                    Role
                                </label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full mt-2 px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                                >
                                    <option value="STUDENT">Student</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="verified"
                                    type="checkbox"
                                    checked={editForm.verified}
                                    onChange={(e) => setEditForm({ ...editForm, verified: e.target.checked })}
                                    className="h-4 w-4 accent-primary"
                                />
                                <label htmlFor="verified" className="text-foreground/70 text-sm">
                                    Verified
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="primary" type="submit" className="flex-1" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save changes"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setEditingUser(null)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change password modal */}
            {passwordUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-4">
                    <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
                        <h2 className="text-2xl font-bold text-foreground mb-6">
                            Change password for {passwordUser.email}
                        </h2>
                        <form onSubmit={submitPassword} className="space-y-5">
                            <div>
                                <label className="block text-foreground/70 mb-2 text-sm">
                                    New Password
                                </label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="primary" type="submit" className="flex-1" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Update password"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                        setPasswordUser(null);
                                        setNewPassword("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change account type modal */}
            {accountTypeUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-4">
                    <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Change plan for {accountTypeUser.email}
                        </h2>
                        <p className="text-sm text-foreground/60 mb-6">
                            This user will {selectedAccountType === "PREMIUM" ? "receive" : "lose"} Premium features
                            {selectedAccountType === "PREMIUM" ? " once Premium is enabled." : " immediately."}
                        </p>
                        <form onSubmit={submitAccountType} className="space-y-5">
                            <div>
                                <label className="block text-foreground/70 mb-2 text-sm">Account Type</label>
                                <select
                                    value={selectedAccountType}
                                    onChange={(e) => setSelectedAccountType(e.target.value as AccountType)}
                                    className="w-full mt-2 px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                                >
                                    <option value="BASIC">Basic</option>
                                    <option value="PREMIUM">Premium</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="primary" type="submit" className="flex-1" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save changes"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setAccountTypeUser(null)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add user modal */}
            {showAddUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-4">
                    <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
                        <h2 className="text-2xl font-bold text-foreground mb-6">Add User</h2>
                        <form onSubmit={submitAddUser} className="space-y-5">
                            <div>
                                <label className="block text-foreground/70 mb-2 text-sm">Display Name</label>
                                <Input
                                    value={newUserForm.displayName}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })}
                                    placeholder="Display name"
                                />
                            </div>

                            <div>
                                <label className="block text-foreground/70 mb-2 text-sm">Email</label>
                                <Input
                                    type="email"
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    placeholder="learner@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-foreground/70 mb-2 text-sm">Password</label>
                                <Input
                                    type="password"
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                    placeholder="At least 6 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-foreground/70 mb-2 text-sm">Role</label>
                                <select
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                    className="w-full mt-2 px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                                >
                                    <option value="STUDENT">Student</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <p className="text-xs text-foreground/50">
                                The account is created verified and enabled - the learner can sign in with this
                                password right away.
                            </p>

                            <div className="flex gap-3 pt-2">
                                <Button variant="primary" type="submit" className="flex-1" disabled={isSaving}>
                                    {isSaving ? "Creating..." : "Create user"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowAddUser(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={Boolean(userToDelete)}
                title="Delete this user?"
                message={`Delete "${userToDelete?.email}"? Their account will be hidden and login blocked, but their data is kept.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemoveUser}
                onCancel={() => setUserToDelete(null)}
            />

            <ConfirmDialog
                isOpen={confirmBulkDelete}
                title={`Delete ${validSelectedIds.size} selected user(s)?`}
                message="Their accounts will be hidden and login blocked, but their data is kept. This can't be undone from here."
                confirmLabel="Delete Selected"
                cancelLabel="Cancel"
                onConfirm={runBulkDelete}
                onCancel={() => setConfirmBulkDelete(false)}
            />

            {isSaving && <Loading message="Please wait..." />}
        </div>
    );
}
