"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableThProps {
    label: string;
    active: boolean;
    direction: "asc" | "desc";
    onClick: () => void;
    className?: string;
}

/** One sortable admin-table column header: a button that toggles sort direction, with an arrow
 *  icon showing the current state (unsorted/asc/desc) - shared by every admin table. */
export default function SortableTh({ label, active, direction, onClick, className }: Readonly<SortableThProps>) {
    const icon = !active ? (
        <ArrowUpDown className="size-3.5 opacity-40" />
    ) : direction === "asc" ? (
        <ArrowUp className="size-3.5" />
    ) : (
        <ArrowDown className="size-3.5" />
    );

    return (
        <th className={cn("px-6 py-3", className)}>
            <button type="button" onClick={onClick} className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white">
                {label} {icon}
            </button>
        </th>
    );
}
