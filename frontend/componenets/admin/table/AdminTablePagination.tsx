"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface AdminTablePaginationProps {
    page: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    onPageChange: (page: number) => void;
}

/** The "Showing X to Y of Z entries" + First/Prev/pages(with ellipsis)/Next/Last footer shared by every admin table. */
export default function AdminTablePagination({
    page,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    onPageChange,
}: Readonly<AdminTablePaginationProps>) {
    if (totalItems === 0) return null;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
    );

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Showing {startIndex} to {endIndex} of {totalItems} entries
            </p>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => onPageChange(1)}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <ChevronsLeft className="size-4" />
                </button>
                <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <ChevronLeft className="size-4" />
                </button>
                {pageNumbers.map((p, idx) => {
                    const prev = pageNumbers[idx - 1];
                    const showEllipsis = prev !== undefined && p - prev > 1;
                    return (
                        <div key={p} className="flex items-center gap-1">
                            {showEllipsis && <span className="px-1 text-gray-400 dark:text-gray-500">…</span>}
                            <button
                                type="button"
                                onClick={() => onPageChange(p)}
                                className={`min-w-9 h-9 px-2 rounded-lg text-sm font-medium border ${
                                    p === page
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
                    disabled={page === totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <ChevronRight className="size-4" />
                </button>
                <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <ChevronsRight className="size-4" />
                </button>
            </div>
        </div>
    );
}
