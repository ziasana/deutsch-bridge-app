"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import AdminTableControls from "@/componenets/admin/table/AdminTableControls";
import AdminTablePagination from "@/componenets/admin/table/AdminTablePagination";
import SortableTh from "@/componenets/admin/table/SortableTh";
import {
    createAdminRedemittelFunction,
    deleteAdminRedemittelFunction,
    getAdminRedemittelFunctions,
    updateAdminRedemittelFunction,
} from "@/services/adminWritingService";
import { AdminRedemittelFunction } from "@/types/redemittel";
import { FUNCTIONS_KEY } from "./RedemittelManager";

const cardClass =
    "bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)]";
const labelClass = "block text-gray-700 dark:text-gray-300 mb-2 text-sm";

type SortKey = "label" | "sortOrder" | "redemittelCount";
type SortDirection = "asc" | "desc";

const emptyFunction: AdminRedemittelFunction = { label: "", sortOrder: 0 };

const errorMessage = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

/** Admin screen for the "Funktion" of a Redemittel (e.g. "Meinung äußern"): create, rename, reorder, delete. */
export default function RedemittelFunctionManager() {
    const queryClient = useQueryClient();
    const { data: functions = [], isLoading } = useQuery({ queryKey: FUNCTIONS_KEY, queryFn: () => getAdminRedemittelFunctions().then((r) => r.data) });

    const [form, setForm] = useState<AdminRedemittelFunction>(emptyFunction);
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState<AdminRedemittelFunction | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("sortOrder");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // Function labels are shown on Redemittel, in the learner views and in the hub, so refresh them all.
    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: FUNCTIONS_KEY });
        await queryClient.invalidateQueries({ queryKey: ["admin", "writing"] });
        await queryClient.invalidateQueries({ queryKey: ["writing", "learn"] });
        await queryClient.invalidateQueries({ queryKey: ["redemittel"] });
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (form.id) await updateAdminRedemittelFunction(form.id, form);
            else await createAdminRedemittelFunction(form);
            toast.success(form.id ? "Entry updated." : "Entry saved.");
            setForm(emptyFunction);
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Failed to save entry."));
        } finally {
            setSaving(false);
        }
    };

    const confirmRemove = async () => {
        const fn = toDelete;
        if (!fn?.id) return;
        setToDelete(null);
        try {
            await deleteAdminRedemittelFunction(fn.id);
            toast.success("Entry deleted.");
            if (form.id === fn.id) setForm(emptyFunction);
            await refresh();
        } catch (err) {
            toast.error(errorMessage(err, "Failed to delete entry."));
        }
    };

    const toggleSort = (k: SortKey) => {
        if (sortKey === k) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(k);
            setSortDirection("asc");
        }
        setPage(1);
    };

    const query = search.trim().toLowerCase();
    const filtered = query ? functions.filter((f) => f.label.toLowerCase().includes(query)) : functions;
    const sorted = filtered.slice().sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        const va = sortKey === "label" ? a.label.toLowerCase() : (a[sortKey] ?? 0);
        const vb = sortKey === "label" ? b.label.toLowerCase() : (b[sortKey] ?? 0);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, sorted.length);
    const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10" dir="ltr">
            <div className="max-w-7xl mx-auto">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Redemittel Funktionen</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        Manage the functions (Funktion) that Redemittel are grouped by, e.g. &quot;Meinung äußern&quot;.
                    </p>
                </div>

                <form onSubmit={save} className={`${cardClass} mt-6 p-6 space-y-6`}>
                    {form.id && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Editing &quot;{form.label}&quot; —{" "}
                            <button type="button" className="underline" onClick={() => setForm(emptyFunction)}>
                                cancel
                            </button>
                        </p>
                    )}
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-[3] min-w-[240px]">
                            <label className={labelClass}>Name</label>
                            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Meinung äußern" />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className={labelClass}>Reihenfolge</label>
                            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                        </div>
                    </div>
                    <Button type="submit" disabled={saving}>{saving ? "Saving..." : form.id ? "Save changes" : "Save entry"}</Button>
                </form>

                <div className={`${cardClass} mt-8 overflow-hidden`}>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 pt-6">Existing entries</h2>
                    {isLoading ? (
                        <Loading message="Loading entries..." />
                    ) : (
                        <div className="px-6 pb-6">
                            <div className="mt-4 mb-3">
                                <AdminTableControls
                                    pageSize={pageSize}
                                    onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                                    search={search}
                                    onSearchChange={(v) => { setSearch(v); setPage(1); }}
                                    searchPlaceholder="Name..."
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                        <tr>
                                            <SortableTh label="Name" active={sortKey === "label"} direction={sortDirection} onClick={() => toggleSort("label")} />
                                            <SortableTh label="Reihenfolge" active={sortKey === "sortOrder"} direction={sortDirection} onClick={() => toggleSort("sortOrder")} />
                                            <SortableTh label="Redemittel" active={sortKey === "redemittelCount"} direction={sortDirection} onClick={() => toggleSort("redemittelCount")} />
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginated.map((f) => (
                                            <tr key={f.id}>
                                                <td className="px-6 py-4 text-gray-900 dark:text-white">{f.label}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{f.sortOrder}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{f.redemittelCount ?? 0}</td>
                                                <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                                    <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => { setForm(f); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</Button>
                                                    <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => setToDelete(f)}>Delete</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {sorted.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No entries found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4">
                                <AdminTablePagination
                                    page={currentPage}
                                    totalPages={totalPages}
                                    totalItems={sorted.length}
                                    startIndex={startIndex}
                                    endIndex={endIndex}
                                    onPageChange={setPage}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {saving && <Loading message="Please wait..." />}
            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                title="Delete this entry?"
                message={`Delete "${toDelete?.label}"? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemove}
                onCancel={() => setToDelete(null)}
            />
        </div>
    );
}
