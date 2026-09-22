"use client";
import * as React from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { useI18n } from "@/componenets/I18nProvider";
import { getDashboard } from "@/services/dashboardService";
import DashboardHeader from "@/componenets/dashboard/DashboardHeader";
import NewContentBanner from "@/componenets/dashboard/NewContentBanner";
import ContinueLearningCard from "@/componenets/dashboard/ContinueLearningCard";
import TodaysLearningPlan from "@/componenets/dashboard/TodaysLearningPlan";
import ReviewNeededCard from "@/componenets/dashboard/ReviewNeededCard";
import CurrentFocusCard from "@/componenets/dashboard/CurrentFocusCard";
import WeeklyLearningSummary from "@/componenets/dashboard/WeeklyLearningSummary";
import LearningMilestone from "@/componenets/dashboard/LearningMilestone";
import DashboardSkeleton from "@/componenets/dashboard/DashboardSkeleton";
import { Button } from "@/componenets/ui/button";

// Cached for a minute so hopping between Dashboard and Your Progress (both read
// the same "dashboard" query) reuses the last fetch instead of re-hitting the
// API - a short staleTime keeps the streak/review numbers close to real-time
// without refetching on every visit.
const DASHBOARD_STALE_TIME_MS = 60 * 1000;

const DashboardPage = () => {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const { t } = useI18n();

    const isAdmin = hasHydrated && userProfile?.role === "ADMIN";

    const {
        data: dashboard,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["dashboard"],
        queryFn: () => getDashboard().then((res) => res.data),
        enabled: hasHydrated && !isAdmin,
        staleTime: DASHBOARD_STALE_TIME_MS,
    });

    useEffect(() => {
        if (isAdmin) {
            router.push("/admin");
        }
    }, [isAdmin, router]);

    if (isAdmin) return null;

    const loading = !hasHydrated || isLoading;

    return (
        <div className="px-4 py-8 sm:px-6 sm:py-10">
            {loading && <DashboardSkeleton />}

            {!loading && isError && (
                <div className="max-w-6xl mx-auto text-center py-16">
                    <p className="text-foreground/60">{t.dashboard.error.message}</p>
                    <Button onClick={() => refetch()} className="mt-4">
                        {t.dashboard.error.retry}
                    </Button>
                </div>
            )}

            {!loading && !isError && dashboard && (
                <div className="max-w-6xl mx-auto space-y-6">
                    <DashboardHeader
                        displayName={dashboard.user.displayName || userProfile?.displayName || ""}
                        level={dashboard.user.learningLevel}
                        streak={dashboard.currentStreak}
                    />

                    {dashboard.newContent && <NewContentBanner data={dashboard.newContent} />}

                    <ContinueLearningCard data={dashboard.continueLearning} />

                    <div className="grid gap-6 md:grid-cols-2">
                        <TodaysLearningPlan data={dashboard.today} />
                        <ReviewNeededCard data={dashboard.review} />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <CurrentFocusCard data={dashboard.focus} />
                        <WeeklyLearningSummary data={dashboard.week} />
                    </div>

                    {dashboard.milestone && <LearningMilestone data={dashboard.milestone} />}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
