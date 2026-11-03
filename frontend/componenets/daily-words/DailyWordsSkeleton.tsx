import { Skeleton } from "@/componenets/ui/skeleton";

/** The daily words page (progress header, the word card, the list of today's words) as grey placeholders while the words load. */
export default function DailyWordsSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="space-y-6">
            <span className="sr-only">{label ?? "Loading..."}</span>
            <div className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-2 pt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="size-8 rounded-full" />
                    ))}
                </div>
            </div>
            <div className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-14 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}
