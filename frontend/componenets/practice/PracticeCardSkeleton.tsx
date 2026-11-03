import { Skeleton } from "@/componenets/ui/skeleton";
import PracticeShell from "./PracticeShell";

/** A flashcard practice screen (header bar, counters, the card, the answer buttons) as grey placeholders while the queue loads. */
export default function PracticeCardSkeleton({ label }: Readonly<{ label?: string }>) {
    return (
        <PracticeShell>
            <div role="status" aria-busy="true" aria-live="polite">
                <span className="sr-only">{label ?? "Loading..."}</span>
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="mt-3 h-2 w-full rounded-full" />
                <div className="mt-5 flex items-center justify-center gap-2">
                    <Skeleton className="h-6 w-14 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                </div>
                <Skeleton className="mt-5 h-64 rounded-3xl" />
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <Skeleton className="h-12 rounded-2xl" />
                    <Skeleton className="h-12 rounded-2xl" />
                </div>
            </div>
        </PracticeShell>
    );
}
