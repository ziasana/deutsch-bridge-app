"use client";

import { Search } from "lucide-react";
import Button from "@/componenets/Button";

/** Shared class for the selects/inputs inside an {@link AdminFilterCard}. */
export const adminFilterFieldClass =
    "mt-1.5 w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none";

interface AdminFilterCardProps {
    title: string;
    /** What gets loaded, e.g. "Lessons" - used in the helper line under the title. */
    noun: string;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
    /** The filter fields (each a `<label className="text-sm ...">`); laid out in a responsive grid. */
    children: React.ReactNode;
}

/** The "Find ..." card above an admin list: the list stays empty until the admin searches. */
export default function AdminFilterCard({ title, noun, onSubmit, onReset, children }: Readonly<AdminFilterCardProps>) {
    return (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {noun} are only loaded once you search - pick any filters, or leave them empty to list everything.
            </p>
            <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-end gap-4 [&>label]:min-w-[150px] [&>label]:flex-1">
                {children}
                <div className="flex gap-2">
                    <Button variant="primary" type="submit" className="flex items-center gap-2">
                        <Search className="size-4" />
                        Search
                    </Button>
                    <Button type="button" variant="secondary" onClick={onReset}>
                        Reset
                    </Button>
                </div>
            </form>
        </div>
    );
}
