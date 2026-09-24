import type { ReactNode } from "react";
import { Button } from "@/componenets/ui/button";
import FeatureUsageChart from "@/componenets/admin/dashboard/FeatureUsageChart";
import FeatureUsageTable from "@/componenets/admin/dashboard/FeatureUsageTable";
import type { FeatureUsageEntry } from "@/types/adminAnalytics";

interface FeatureUsageSectionProps {
    data?: FeatureUsageEntry[];
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    filters: ReactNode;
}

function Skeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-56 rounded-[10px] bg-foreground/10" />
            <div className="h-56 rounded-[10px] bg-foreground/10" />
        </div>
    );
}

export default function FeatureUsageSection({ data, isLoading, isError, onRetry, filters }: Readonly<FeatureUsageSectionProps>) {
    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Content &amp; Feature Usage</h2>
                    <p className="text-sm text-foreground/60">What are learners using to learn?</p>
                </div>
                {filters}
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
                    <FeatureUsageChart data={data} />
                    <FeatureUsageTable data={data} />
                </div>
            )}
        </section>
    );
}
