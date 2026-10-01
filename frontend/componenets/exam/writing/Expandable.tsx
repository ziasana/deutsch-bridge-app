"use client";

import { ReactNode, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableProps {
    title: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

/** Small accessible disclosure used for progressive disclosure inside learning sections. */
export default function Expandable({ title, children, defaultOpen = false, className }: ExpandableProps) {
    const [open, setOpen] = useState(defaultOpen);
    const panelId = useId();

    return (
        <div className={cn("rounded-xl border border-border/60 bg-background/40", className)}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground cursor-pointer"
            >
                <span className="min-w-0">{title}</span>
                <ChevronDown className={cn("size-4 shrink-0 text-foreground/40 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <div id={panelId} className="px-4 pb-4 text-sm text-foreground/75">
                    {children}
                </div>
            )}
        </div>
    );
}
