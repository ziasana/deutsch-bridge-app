"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import useAuthStore from "@/store/useAuthStore";
import { getAllUsers, updateUser, changeUserPassword } from "@/services/adminService";
import { AdminUser } from "@/types/admin";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";

export default function AdminPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);

    const [editForm, setEditForm] = useState({ displayName: "", role: "STUDENT", verified: false });
    const [newPassword, setNewPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchUsers = useCallback(() => {
        setIsLoading(true);
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

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Manage users, roles, and account access.
                        </p>
                    </div>
                    <Button variant="secondary" onClick={() => router.push("/admin/reading")}>
                        Manage Reading Articles
                    </Button>
                </div>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Verified</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                {user.displayName || "—"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={user.verified ? "default" : "outline"}>
                                                    {user.verified ? "Verified" : "Unverified"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                                <Button
                                                    variant="secondary"
                                                    className="px-3 py-1 text-sm"
                                                    onClick={() => openEdit(user)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="px-3 py-1 text-sm"
                                                    onClick={() => setPasswordUser(user)}
                                                >
                                                    Change Password
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit user modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            Edit {editingUser.email}
                        </h2>
                        <form onSubmit={submitEdit} className="space-y-5">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
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
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                    Role
                                </label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                                    className="h-4 w-4"
                                />
                                <label htmlFor="verified" className="text-gray-700 dark:text-gray-300 text-sm">
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
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            Change password for {passwordUser.email}
                        </h2>
                        <form onSubmit={submitPassword} className="space-y-5">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
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

            {isSaving && <Loading message="Please wait..." />}
            <ToastContainer />
        </div>
    );
}
