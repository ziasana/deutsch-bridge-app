import { Skeleton } from "@/componenets/ui/skeleton";

/** Teil cards of an exam section as grey placeholders, shown while the exercises load (the header and the section picker stay usable above). */
export function ExamPartListSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="space-y-3">
            <span className="sr-only">{label ?? "Loading..."}</span>
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-border/60 p-4">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    );
}

/** A mock-exam profile (title banner, start button, exam sets) as grey placeholders while the overview loads. */
export function ExamProfileSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="space-y-6">
            <span className="sr-only">{label ?? "Loading..."}</span>
            <div className="space-y-4 rounded-2xl bg-[#16324f]/90 p-6 shadow-card">
                <Skeleton className="h-7 w-2/3 bg-white/20" />
                <Skeleton className="h-4 w-1/2 bg-white/15" />
                <Skeleton className="h-10 w-40 rounded-full bg-white/20" />
            </div>
            <div className="space-y-3 rounded-2xl bg-card p-5 shadow-card">
                {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

/** A simple content area (heading line and a few rows) for sub-pages that load inside their own page frame. */
export function ContentBlockSkeleton({ rows = 4, label }: Readonly<{ rows?: number; label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="space-y-3">
            <span className="sr-only">{label ?? "Loading..."}</span>
            <Skeleton className="h-6 w-1/3" />
            {Array.from({ length: rows }, (_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
        </div>
    );
}
