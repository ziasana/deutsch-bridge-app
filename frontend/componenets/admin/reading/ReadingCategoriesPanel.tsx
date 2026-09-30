"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
    createReadingCategory,
    deleteReadingCategory,
    getAdminReadingCategories,
    updateReadingCategory,
} from "@/services/adminReadingService";
import { ReadingCategoryAdmin } from "@/types/reading";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import { Pencil, Trash2, X } from "lucide-react";

export const READING_CATEGORIES_KEY = ["admin", "reading", "categories"];

/** Admin CRUD for reading categories ("Thema") - a flat, title-only list. Delete is blocked
 * server-side while any article still references the category, so we just surface that error. */
export default function ReadingCategoriesPanel() {
    const queryClient = useQueryClient();
    const { data: categories = [], isLoading, error } = useQuery({
        queryKey: READING_CATEGORIES_KEY,
        queryFn: () => getAdminReadingCategories().then((res) => res.data),
    });

    const [newTitle, setNewTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<ReadingCategoryAdmin | null>(null);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: READING_CATEGORIES_KEY });
        queryClient.invalidateQueries({ queryKey: ["reading"] });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setIsCreating(true);
        createReadingCategory(newTitle.trim())
            .then(() => {
                toast.success("Category added.");
                setNewTitle("");
                invalidate();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to add category."))
            .finally(() => setIsCreating(false));
    };

    const startEdit = (category: ReadingCategoryAdmin) => {
        setEditingId(category.id);
        setEditingTitle(category.title);
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditingTitle("");
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId || !editingTitle.trim()) return;
        setIsSaving(true);
        updateReadingCategory(editingId, editingTitle.trim())
            .then(() => {
                toast.success("Category updated.");
                cancelEdit();
                invalidate();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update category."))
            .finally(() => setIsSaving(false));
    };

    const confirmDelete = () => {
        const category = categoryToDelete;
        if (!category) return;
        setCategoryToDelete(null);
        deleteReadingCategory(category.id)
            .then(() => {
                toast.success("Category deleted.");
                invalidate();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete category."));
    };

    if (error) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message ?? "Failed to load categories.");
    }

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categories (Thema)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage the fixed list of topics articles can be filed under. Students filter the reading
                    list by these. A category in use by any article can&apos;t be deleted until it&apos;s
                    reassigned or removed from those articles.
                </p>
            </div>

            <form onSubmit={submitCreate} className="flex items-end gap-3">
                <div className="flex-1 max-w-sm">
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">New category</label>
                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Reisen" />
                </div>
                <Button type="submit" variant="primary" disabled={isCreating || !newTitle.trim()}>
                    {isCreating ? "Adding..." : "Add category"}
                </Button>
            </form>

            {isLoading && <Loading />}

            {!isLoading && categories.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No categories yet.</p>
            )}

            {categories.length > 0 && (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categories.map((category) => (
                        <li key={category.id} className="py-3 flex items-center justify-between gap-4">
                            {editingId === category.id ? (
                                <form onSubmit={submitEdit} className="flex flex-1 items-center gap-3">
                                    <div className="flex-1 max-w-sm">
                                        <Input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} />
                                    </div>
                                    <Button type="submit" variant="primary" className="text-sm px-3 py-1.5" disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="text-sm px-3 py-1.5"
                                        onClick={cancelEdit}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </form>
                            ) : (
                                <>
                                    <div className="min-w-0">
                                        <span className="font-medium text-gray-900 dark:text-white">{category.title}</span>
                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                            {category.articleCount} article{category.articleCount === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="text-sm px-3 py-1.5 flex items-center gap-1.5"
                                            onClick={() => startEdit(category)}
                                        >
                                            <Pencil className="size-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="text-sm px-3 py-1.5 flex items-center gap-1.5 text-red-600 dark:text-red-400"
                                            onClick={() => setCategoryToDelete(category)}
                                        >
                                            <Trash2 className="size-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <ConfirmDialog
                isOpen={!!categoryToDelete}
                title="Delete category?"
                message={
                    categoryToDelete
                        ? `Delete "${categoryToDelete.title}"? This can't be undone.`
                        : ""
                }
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setCategoryToDelete(null)}
            />
        </div>
    );
}
