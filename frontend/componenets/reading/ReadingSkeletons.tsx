import { Skeleton } from "@/componenets/ui/skeleton";

/** Article cards of the reading list as grey placeholders, shown while the level's page loads (search and filters stay usable above it). */
export function ReadingListSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="mt-6 grid gap-4 sm:grid-cols-2">
            <span className="sr-only">{label ?? "Loading..."}</span>
            {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-card">
                    <Skeleton className="h-36 rounded-none" />
                    <div className="space-y-2 p-4">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** An article page (title, image, text) or the review screen as grey placeholders while it loads. */
export function ReadingArticleSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="dashboard-atmosphere min-h-full px-4 py-8 sm:px-6 sm:py-10">
            <span className="sr-only">{label ?? "Loading..."}</span>
            <div className="mx-auto max-w-3xl space-y-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-2/3" />
                <Skeleton className="h-52 rounded-2xl" />
                <div className="space-y-3 rounded-2xl bg-card p-6 shadow-card">
                    {Array.from({ length: 8 }, (_, i) => (
                        <Skeleton key={i} className={i % 4 === 3 ? "h-4 w-2/3" : "h-4 w-full"} />
                    ))}
                </div>
            </div>
        </div>
    );
}
