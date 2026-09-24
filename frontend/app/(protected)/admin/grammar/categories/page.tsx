"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";
import {
    getGrammarCategoriesAdmin,
    createGrammarCategory,
    updateGrammarCategory,
    deleteGrammarCategory,
} from "@/services/grammarAdminService";
import { GrammarCategory, GrammarCategoryManualRequest } from "@/types/grammar";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import GrammarSubNav from "@/componenets/admin/GrammarSubNav";
import { isTranslatableLevel } from "@/lib/grammarLocalization";
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

type CategorySortKey = "title" | "level" | "lessonCount";
type SortDirection = "asc" | "desc";

const emptyCategoryForm = {
    title: "",
    titleFa: "",
    level: "A2",
    sortOrder: 0,
    passThreshold: 70,
};

export default function AdminGrammarCategoriesPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const queryClient = useQueryClient();

    const CATEGORIES_KEY = ["admin", "grammar", "categories"];

    const { data: categories = [], error: categoriesError } = useQuery({
        queryKey: CATEGORIES_KEY,
        queryFn: () => getGrammarCategoriesAdmin().then((res) => res.data),
        enabled: hasHydrated && userProfile?.role === "ADMIN",
    });

    const [categoryToDelete, setCategoryToDelete] = useState<GrammarCategory | null>(null);
    const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
    const [editingCategory, setEditingCategory] = useState<GrammarCategory | null>(null);
    const [isSavingCategory, setIsSavingCategory] = useState(false);

    const [categoriesPage, setCategoriesPage] = useState(1);
    const [categoriesPageSize, setCategoriesPageSize] = useState(5);
    const [categorySearch, setCategorySearch] = useState("");
    const [categorySortKey, setCategorySortKey] = useState<CategorySortKey>("title");
    const [categorySortDirection, setCategorySortDirection] = useState<SortDirection>("asc");

    // Also drop the learner-side grammar caches in this browser - category edits change the level lists.
    const invalidateCategories = () => {
        queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
        queryClient.invalidateQueries({ queryKey: ["grammar"] });
    };

    useEffect(() => {
        if (!hasHydrated) return;
        if (userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [hasHydrated, userProfile, router]);

    useEffect(() => {
        if (categoriesError) {
            const err = categoriesError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load categories.");
        }
    }, [categoriesError]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const resetCategoryForm = () => {
        setCategoryForm(emptyCategoryForm);
        setEditingCategory(null);
    };

    const startEditCategory = (category: GrammarCategory) => {
        setEditingCategory(category);
        setCategoryForm({
            title: category.title,
            titleFa: category.titleFa ?? "",
            level: category.level,
            sortOrder: category.sortOrder,
            passThreshold: category.passThreshold,
        });
    };

    const submitCategoryForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryForm.title.trim()) {
            toast.error("Category title is required.");
            return;
        }

        const payload: GrammarCategoryManualRequest = {
            title: categoryForm.title.trim(),
            titleFa: categoryForm.titleFa.trim() || null,
            level: categoryForm.level,
            sortOrder: categoryForm.sortOrder,
            passThreshold: categoryForm.passThreshold,
        };

        setIsSavingCategory(true);
        const request = editingCategory
            ? updateGrammarCategory(editingCategory.id, payload)
            : createGrammarCategory(payload);

        request
            .then(() => {
                toast.success(editingCategory ? "Category updated." : "Category created.");
                resetCategoryForm();
                invalidateCategories();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save category."))
            .finally(() => setIsSavingCategory(false));
    };

    const removeCategory = (category: GrammarCategory) => setCategoryToDelete(category);

    const confirmRemoveCategory = () => {
        const category = categoryToDelete;
        if (!category) return;
        setCategoryToDelete(null);
        deleteGrammarCategory(category.id)
            .then(() => {
                toast.success("Category deleted.");
                invalidateCategories();
                queryClient.invalidateQueries({ queryKey: ["admin", "grammar", "lessons"] });
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete category."));
    };

    const toggleCategorySort = (key: CategorySortKey) => {
        if (categorySortKey === key) {
            setCategorySortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setCategorySortKey(key);
            setCategorySortDirection("asc");
        }
        setCategoriesPage(1);
    };

    const renderCategorySortIcon = (column: CategorySortKey) => {
        if (categorySortKey !== column) return <ArrowUpDown className="size-3.5 opacity-40" />;
        return categorySortDirection === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
    };

    const categorySearchQuery = categorySearch.trim().toLowerCase();
    const filteredCategories = categorySearchQuery
        ? categories.filter((c) => c.title.toLowerCase().includes(categorySearchQuery))
        : categories;
    const categoryValueFor = (c: GrammarCategory) => {
        switch (categorySortKey) {
            case "title":
                return c.title.toLowerCase();
            case "level":
                return c.level;
            case "lessonCount":
                return c.lessonCount;
        }
    };
    const sortedCategories = filteredCategories.slice().sort((a, b) => {
        const dir = categorySortDirection === "asc" ? 1 : -1;
        const va = categoryValueFor(a);
        const vb = categoryValueFor(b);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });

    const categoriesTotalPages = Math.max(1, Math.ceil(sortedCategories.length / categoriesPageSize));
    const categoriesCurrentPage = Math.min(categoriesPage, categoriesTotalPages);
    const categoriesStartIndex = sortedCategories.length === 0 ? 0 : (categoriesCurrentPage - 1) * categoriesPageSize + 1;
    const categoriesEndIndex = Math.min(categoriesCurrentPage * categoriesPageSize, sortedCategories.length);
    const paginatedCategories = sortedCategories.slice(
        (categoriesCurrentPage - 1) * categoriesPageSize,
        categoriesCurrentPage * categoriesPageSize
    );
    const categoriesPageNumbers = Array.from({ length: categoriesTotalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === categoriesTotalPages || Math.abs(p - categoriesCurrentPage) <= 1
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Grammar Lessons</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        Create and manage grammar lessons and their exercises.
                    </p>
                </div>

                <GrammarSubNav />

                <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Categories (Blocks)</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Group a level&apos;s lessons into blocks (e.g. &quot;Block 1: Erste Sätze&quot;). Each block gets
                        its own aggregate test drawing from its lessons&apos; exercises.
                    </p>
                    <form onSubmit={submitCategoryForm} className="space-y-4">
                        {editingCategory && (
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Editing &quot;{editingCategory.title}&quot; —{" "}
                                <button type="button" className="underline" onClick={resetCategoryForm}>
                                    cancel
                                </button>
                            </p>
                        )}
                        <div className="flex gap-4 flex-wrap items-end">
                            <div className="flex-1 min-w-[180px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Title</label>
                                <Input
                                    value={categoryForm.title}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                                    placeholder="e.g. Block 1: Erste Sätze"
                                />
                            </div>
                            <div className="min-w-[120px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Level</label>
                                <select
                                    value={categoryForm.level}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, level: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {LEVELS.map((lvl) => (
                                        <option key={lvl} value={lvl}>
                                            {lvl}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-[100px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Order</label>
                                <input
                                    type="number"
                                    value={categoryForm.sortOrder}
                                    onChange={(e) =>
                                        setCategoryForm({ ...categoryForm, sortOrder: Number(e.target.value) })
                                    }
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="min-w-[140px]">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                    Pass threshold (%)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={categoryForm.passThreshold}
                                    onChange={(e) =>
                                        setCategoryForm({ ...categoryForm, passThreshold: Number(e.target.value) })
                                    }
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <Button variant="primary" type="submit" disabled={isSavingCategory} className="px-4 py-3">
                                {isSavingCategory ? "Saving..." : editingCategory ? "Save changes" : "Add category"}
                            </Button>
                        </div>
                        {isTranslatableLevel(categoryForm.level) && (
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                    عنوان فارسی (Persian title, optional)
                                </label>
                                <Input
                                    dir="rtl"
                                    value={categoryForm.titleFa}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, titleFa: e.target.value })}
                                    placeholder="عنوان بلوک"
                                    required={false}
                                />
                            </div>
                        )}
                    </form>

                    {categories.length > 0 && (
                        <div className="mt-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    Show
                                    <select
                                        value={categoriesPageSize}
                                        onChange={(e) => {
                                            setCategoriesPageSize(Number(e.target.value));
                                            setCategoriesPage(1);
                                        }}
                                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    entries
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    Search:
                                    <input
                                        type="text"
                                        value={categorySearch}
                                        onChange={(e) => {
                                            setCategorySearch(e.target.value);
                                            setCategoriesPage(1);
                                        }}
                                        placeholder="Category title..."
                                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </label>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                        <tr>
                                            <th className="px-4 py-2">
                                                <button type="button" onClick={() => toggleCategorySort("title")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Title {renderCategorySortIcon("title")}
                                                </button>
                                            </th>
                                            <th className="px-4 py-2">ID</th>
                                            <th className="px-4 py-2">
                                                <button type="button" onClick={() => toggleCategorySort("level")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Level {renderCategorySortIcon("level")}
                                                </button>
                                            </th>
                                            <th className="px-4 py-2">Order</th>
                                            <th className="px-4 py-2">Pass %</th>
                                            <th className="px-4 py-2">
                                                <button type="button" onClick={() => toggleCategorySort("lessonCount")} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                                                    Lessons {renderCategorySortIcon("lessonCount")}
                                                </button>
                                            </th>
                                            <th className="px-4 py-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedCategories.map((category) => (
                                            <tr key={category.id}>
                                                <td className="px-4 py-2 text-gray-900 dark:text-white">{category.title}</td>
                                                <td className="px-4 py-2">
                                                    <code className="text-xs text-gray-500 dark:text-gray-400 select-all">
                                                        {category.id}
                                                    </code>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Badge variant="secondary">{category.level}</Badge>
                                                </td>
                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                                                    {category.sortOrder}
                                                </td>
                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                                                    {category.passThreshold}%
                                                </td>
                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                                                    {category.lessonCount}
                                                </td>
                                                <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                                                    <Button
                                                        variant="secondary"
                                                        className="px-3 py-1 text-sm"
                                                        onClick={() => startEditCategory(category)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        className="px-3 py-1 text-sm"
                                                        onClick={() => removeCategory(category)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {sortedCategories.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                                                    No categories found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {sortedCategories.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Showing {categoriesStartIndex} to {categoriesEndIndex} of {sortedCategories.length} entries
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={categoriesCurrentPage === 1}
                                            onClick={() => setCategoriesPage(1)}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronsLeft className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={categoriesCurrentPage === 1}
                                            onClick={() => setCategoriesPage((p) => Math.max(1, p - 1))}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronLeft className="size-4" />
                                        </button>
                                        {categoriesPageNumbers.map((p, idx) => {
                                            const prev = categoriesPageNumbers[idx - 1];
                                            const showEllipsis = prev !== undefined && p - prev > 1;
                                            return (
                                                <div key={p} className="flex items-center gap-1">
                                                    {showEllipsis && <span className="px-1 text-gray-400 dark:text-gray-500">…</span>}
                                                    <button
                                                        type="button"
                                                        onClick={() => setCategoriesPage(p)}
                                                        className={`min-w-9 h-9 px-2 rounded-lg text-sm font-medium border ${
                                                            p === categoriesCurrentPage
                                                                ? "bg-blue-600 border-blue-600 text-white"
                                                                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            disabled={categoriesCurrentPage === categoriesTotalPages}
                                            onClick={() => setCategoriesPage((p) => Math.min(categoriesTotalPages, p + 1))}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronRight className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={categoriesCurrentPage === categoriesTotalPages}
                                            onClick={() => setCategoriesPage(categoriesTotalPages)}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <ChevronsRight className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={Boolean(categoryToDelete)}
                title="Delete this category?"
                message={`Delete category "${categoryToDelete?.title}"? Its lessons will become uncategorized.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemoveCategory}
                onCancel={() => setCategoryToDelete(null)}
            />
        </div>
    );
}
