import { Skeleton } from "@/componenets/ui/skeleton"

/** The row of five stat tiles as grey placeholders while the overview and the stats load. */
export function ProgressTilesSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <span className="sr-only">{label ?? "Loading..."}</span>
            {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
        </div>
    )
}

/** The mastery charts, the three small cards and the milestone ladder as grey placeholders while the stats load. */
export function ProgressStatsSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="space-y-6">
            <span className="sr-only">{label ?? "Loading..."}</span>
            <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
            </div>
            <Skeleton className="h-32 rounded-2xl" />
        </div>
    )
}
