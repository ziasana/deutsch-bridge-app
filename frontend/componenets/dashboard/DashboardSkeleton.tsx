import { Skeleton } from "@/componenets/ui/skeleton";

/**
 * The dashboard's layout as grey placeholders (hero, today's plan, three tiles, milestone row), shown while its data
 * loads. It sits in the page flow, so the navigation stays visible and usable - unlike a full-screen loader.
 */
export default function DashboardSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="mx-auto max-w-5xl space-y-8">
            <span className="sr-only">{label ?? "Loading..."}</span>

            <div className="rounded-2xl bg-[#16324f]/90 px-5 py-6 shadow-card sm:px-7 sm:py-7">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
                    <div className="space-y-3">
                        <Skeleton className="h-7 w-3/4 bg-white/20" />
                        <Skeleton className="h-4 w-1/2 bg-white/15" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-7 w-24 rounded-full bg-white/15" />
                            <Skeleton className="h-7 w-20 rounded-full bg-white/15" />
                        </div>
                        <div className="flex max-w-sm justify-between gap-1 pt-4">
                            {Array.from({ length: 7 }, (_, i) => (
                                <Skeleton key={i} className="size-8 rounded-full bg-white/15" />
                            ))}
                        </div>
                    </div>
                    <Skeleton className="h-28 w-full rounded-xl bg-white/10" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-44 rounded-2xl" />
                ))}
            </div>

            <div className="grid gap-6 border-t border-border/60 pt-6 md:grid-cols-2">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
            </div>
        </div>
    );
}
