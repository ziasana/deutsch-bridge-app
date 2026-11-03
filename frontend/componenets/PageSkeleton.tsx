import { Skeleton } from "@/componenets/ui/skeleton";

/** Generic page placeholder (heading and content blocks) for routes that have no skeleton of their own. Not full-screen: the navigation stays usable. */
export default function PageSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="dashboard-atmosphere min-h-full px-4 py-8 sm:px-6 sm:py-10">
            <span className="sr-only">{label ?? "Loading..."}</span>
            <div className="mx-auto max-w-5xl space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-40 rounded-2xl" />
                    <Skeleton className="h-40 rounded-2xl" />
                </div>
                <Skeleton className="h-56 rounded-2xl" />
            </div>
        </div>
    );
}
