import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small pill used for level / step / type labels above a practice card. */
export default function PracticeChip({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
    return (
        <span className={cn("inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground/70 shadow-sm ring-1 ring-primary/15", className)}>
            {children}
        </span>
    );
}
