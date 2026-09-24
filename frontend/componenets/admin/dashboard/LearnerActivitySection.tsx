import { Button } from "@/componenets/ui/button";
import ActivitySummaryCards from "@/componenets/admin/dashboard/ActivitySummaryCards";
import LearnerActivityChart from "@/componenets/admin/dashboard/LearnerActivityChart";
import type { LearnerActivity } from "@/types/adminAnalytics";

interface LearnerActivitySectionProps {
    data?: LearnerActivity;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
}

function Skeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-[10px] bg-foreground/10" />
                ))}
            </div>
            <div className="h-56 rounded-[10px] bg-foreground/10" />
        </div>
    );
}

export default function LearnerActivitySection({ data, isLoading, isError, onRetry }: Readonly<LearnerActivitySectionProps>) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Learner Activity</h2>
                <p className="text-sm text-foreground/60">Are learners actually learning?</p>
            </div>

            {isLoading && <Skeleton />}

            {!isLoading && isError && (
                <div className="rounded-[10px] border border-border bg-card py-12 text-center">
                    <p className="text-foreground/60">Unable to load analytics.</p>
                    <Button onClick={onRetry} className="mt-4">
                        Retry
                    </Button>
                </div>
            )}

            {!isLoading && !isError && data && (
                <div className="space-y-4">
                    <ActivitySummaryCards data={data} />
                    <LearnerActivityChart daily={data.daily} />
                </div>
            )}
        </section>
    );
}
