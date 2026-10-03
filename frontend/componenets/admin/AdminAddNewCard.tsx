"use client";

import { Plus } from "lucide-react";

/** Collapsed state of an admin entry form: one link that expands the form. */
export default function AdminAddNewCard({ label, onClick }: Readonly<{ label: string; onClick: () => void }>) {
    return (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6">
            <button
                type="button"
                onClick={onClick}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
                <Plus className="size-4" />
                {label}
            </button>
        </div>
    );
}
