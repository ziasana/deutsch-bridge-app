"use client";

import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

/** "Mögliche Lösung" - styled like the Telc "Beispielantwort" (amber, dashed), collapsed by default. */
export default function PossibleSolution({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <details className="group rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/10 open:bg-amber-500/[0.07]">
            <summary className="flex cursor-pointer list-none items-center gap-4 rounded-2xl p-4 text-sm font-semibold text-foreground transition hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300" aria-hidden="true">
                    <Lightbulb className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold">Mögliche Lösung</span>
                    <span className="block text-sm font-normal text-foreground/65">Tipp: Sprechen Sie zuerst selbst – vergleichen Sie danach.</span>
                </span>
                <span className="text-xs font-medium text-primary group-open:hidden">anzeigen</span>
                <span className="hidden text-xs font-medium text-primary group-open:inline">ausblenden</span>
            </summary>
            <div className="space-y-3 px-5 pb-5">{children}</div>
        </details>
    );
}
