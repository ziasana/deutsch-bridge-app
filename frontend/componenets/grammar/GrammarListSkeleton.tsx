import { Skeleton } from "@/componenets/ui/skeleton";

/** Category cards of the grammar list as grey placeholders, shown while the level's lessons load (header, search and level picker stay usable above it). */
export default function GrammarListSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="mt-6 space-y-4">
            <span className="sr-only">{label ?? "Loading..."}</span>
            {Array.from({ length: 3 }, (_, card) => (
                <div key={card} className="rounded-2xl bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="size-8 rounded-full" />
                    </div>
                    <div className="mt-4 space-y-3">
                        {Array.from({ length: 3 }, (_, row) => (
                            <Skeleton key={row} className="h-14 rounded-xl" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
