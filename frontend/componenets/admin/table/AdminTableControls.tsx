"use client";

import AdminSearchInput from "./AdminSearchInput";

interface AdminTableControlsProps {
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
    search: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
}

/** The "Show N entries" + "Search:" row shared by every admin table (list page-size and free-text filter). */
export default function AdminTableControls({
    pageSize,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100],
    search,
    onSearchChange,
    searchPlaceholder,
}: Readonly<AdminTableControlsProps>) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                Show
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    {pageSizeOptions.map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                </select>
                entries
            </label>

            <AdminSearchInput label="Search:" value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
        </div>
    );
}
