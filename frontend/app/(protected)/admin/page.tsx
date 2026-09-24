"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bot, GraduationCap, Star, Users } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { getAdminDashboard } from "@/services/adminDashboardService";
import { getAdminAnalytics } from "@/services/adminAnalyticsService";
import type { AnalyticsLevel, AnalyticsRange } from "@/types/adminAnalytics";
import { Button } from "@/componenets/ui/button";
import AdminStatCard from "@/componenets/admin/dashboard/AdminStatCard";
import NeedsAttention from "@/componenets/admin/dashboard/NeedsAttention";
import UserActivityChart from "@/componenets/admin/dashboard/UserActivityChart";
import ContentOverview from "@/componenets/admin/dashboard/ContentOverview";
import LearningActivity from "@/componenets/admin/dashboard/LearningActivity";
import RecentActivityFeed from "@/componenets/admin/dashboard/RecentActivityFeed";
import QuickActions from "@/componenets/admin/dashboard/QuickActions";
import DashboardSkeleton from "@/componenets/admin/dashboard/DashboardSkeleton";
import LearnerActivitySection from "@/componenets/admin/dashboard/LearnerActivitySection";
import FeatureUsageSection from "@/componenets/admin/dashboard/FeatureUsageSection";
import AnalyticsFilters from "@/componenets/admin/dashboard/AnalyticsFilters";

export default function AdminDashboardPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const isAdmin = hasHydrated && userProfile?.role === "ADMIN";

    const [range, setRange] = useState<AnalyticsRange>("30d");
    const [level, setLevel] = useState<AnalyticsLevel>("ALL");

    const {
        data: dashboard,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["admin-dashboard"],
        queryFn: () => getAdminDashboard().then((res) => res.data),
        enabled: isAdmin,
        staleTime: 30 * 1000,
    });

    const {
        data: analytics,
        isLoading: analyticsLoading,
        isError: analyticsError,
        refetch: refetchAnalytics,
    } = useQuery({
        queryKey: ["admin-analytics", range, level],
        queryFn: () => getAdminAnalytics(range, level).then((res) => res.data),
        enabled: isAdmin,
        staleTime: 30 * 1000,
    });

    useEffect(() => {
        if (hasHydrated && userProfile?.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [hasHydrated, userProfile, router]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const loading = isLoading;

    return (
        <div className="px-6 py-10">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Dashboard</h1>
                    <p className="text-foreground/60 mt-1">Platform overview and things that need attention.</p>
                </div>

                {loading && <DashboardSkeleton />}

                {!loading && isError && (
                    <div className="rounded-[10px] border border-border bg-card py-16 text-center">
                        <p className="text-foreground/60">Unable to load the dashboard.</p>
                        <Button onClick={() => refetch()} className="mt-4">
                            Retry
                        </Button>
                    </div>
                )}

                {!loading && !isError && dashboard && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <AdminStatCard
                                title="Total Users"
                                value={dashboard.overview.users.total.toLocaleString()}
                                description={dashboard.overview.users.newToday > 0 ? `+${dashboard.overview.users.newToday} today` : undefined}
                                icon={Users}
                                href="/admin/users"
                                ctaLabel="Manage users"
                            />
                            <AdminStatCard
                                title="Content Items"
                                value={dashboard.overview.content.total.toLocaleString()}
                                description={dashboard.overview.content.newThisWeek > 0 ? `+${dashboard.overview.content.newThisWeek} this week` : undefined}
                                icon={GraduationCap}
                                href="/admin/reading"
                                ctaLabel="View content"
                            />
                            <AdminStatCard
                                title="Premium Users"
                                value={dashboard.overview.premium.premiumUsers.toLocaleString()}
                                description={`${dashboard.overview.premium.percentage.toFixed(1)}% of users`}
                                icon={Star}
                                href="/admin/users"
                                ctaLabel="Manage Premium"
                            />
                            <AdminStatCard
                                title="AI Usage"
                                value={`${dashboard.overview.ai.usagePercentToday.toFixed(0)}%`}
                                description="Today"
                                icon={Bot}
                                href="/admin/settings"
                                ctaLabel="View AI usage"
                            />
                        </div>

                        <NeedsAttention items={dashboard.attention} />

                        <div className="grid gap-6 lg:grid-cols-2">
                            <UserActivityChart data={dashboard.userActivity} />
                            <ContentOverview data={dashboard.contentOverview} />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <LearningActivity items={dashboard.learningActivity} />
                            <RecentActivityFeed items={dashboard.recentActivity} />
                        </div>

                        <QuickActions />

                        <div className="border-t border-border pt-6" />

                        <LearnerActivitySection
                            data={analytics?.learnerActivity}
                            isLoading={analyticsLoading}
                            isError={analyticsError}
                            onRetry={() => refetchAnalytics()}
                        />

                        <FeatureUsageSection
                            data={analytics?.featureUsage}
                            isLoading={analyticsLoading}
                            isError={analyticsError}
                            onRetry={() => refetchAnalytics()}
                            filters={<AnalyticsFilters range={range} onRangeChange={setRange} level={level} onLevelChange={setLevel} />}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
