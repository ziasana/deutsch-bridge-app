import { Skeleton } from "@/componenets/ui/skeleton";

/** A lesson page as grey placeholders (title, summary, text blocks), shown while the lesson loads. */
export default function GrammarLessonSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className="dashboard-atmosphere min-h-full px-4 py-8 sm:px-6 sm:py-10">
            <span className="sr-only">{label ?? "Loading..."}</span>
            <div className="mx-auto max-w-3xl space-y-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="space-y-3 rounded-2xl bg-card p-6 shadow-card">
                    {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton key={i} className={i % 3 === 2 ? "h-4 w-2/3" : "h-4 w-full"} />
                    ))}
                </div>
                <Skeleton className="h-32 rounded-2xl" />
            </div>
        </div>
    );
}
