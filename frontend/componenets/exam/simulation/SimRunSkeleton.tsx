import { Skeleton } from "@/componenets/ui/skeleton";

/** The running exam (timer bar, the task area, the question navigation and the bottom bar) as grey placeholders while its state loads. */
export default function SimRunSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="min-h-screen bg-background px-4 py-6 sm:px-6" dir="ltr">
            <span className="sr-only">{label ?? "Loading..."}</span>
            <div className="mx-auto max-w-6xl space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-sm">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-10 w-28 rounded-full" />
                </div>
                <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
                    <div className="space-y-4 rounded-3xl bg-card p-6 shadow-sm">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-40 rounded-2xl" />
                        {Array.from({ length: 3 }, (_, i) => (
                            <Skeleton key={i} className="h-12 rounded-xl" />
                        ))}
                    </div>
                    <div className="hidden space-y-3 lg:block">
                        {Array.from({ length: 5 }, (_, i) => (
                            <Skeleton key={i} className="h-14 rounded-2xl" />
                        ))}
                    </div>
                </div>
                <div className="flex justify-between gap-3">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-40 rounded-full" />
                </div>
            </div>
        </div>
    );
}
