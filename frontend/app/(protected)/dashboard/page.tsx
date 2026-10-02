"use client";
import * as React from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { useI18n } from "@/componenets/I18nProvider";
import { getDashboard } from "@/services/dashboardService";
import DashboardHero from "@/componenets/dashboard/DashboardHero";
import NewContentBanner from "@/componenets/dashboard/NewContentBanner";
import TodaysLearningPlan from "@/componenets/dashboard/TodaysLearningPlan";
import ReviewNeededCard from "@/componenets/dashboard/ReviewNeededCard";
import CurrentFocusCard from "@/componenets/dashboard/CurrentFocusCard";
import LearningMilestone from "@/componenets/dashboard/LearningMilestone";
import ExamTimeInsightCard from "@/componenets/dashboard/ExamTimeInsightCard";
import RedemittelDashboardCard from "@/componenets/dashboard/RedemittelDashboardCard";
import Loading from "@/componenets/Loading";
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

    if (isAdmin) return <Loading />;

    const loading = !hasHydrated || isLoading;

    return (
        <div className="dashboard-atmosphere min-h-full px-4 py-8 sm:px-6 sm:py-10">
            {loading && <Loading />}

            {!loading && isError && (
                <div className="text-center py-16">
                    <p className="text-foreground/60">{t.dashboard.error.message}</p>
                    <Button onClick={() => refetch()} className="mt-4">
                        {t.dashboard.error.retry}
                    </Button>
                </div>
            )}

            {!loading && !isError && dashboard && (
                <div className="mx-auto max-w-5xl space-y-8">
                    <DashboardHero
                        displayName={dashboard.user.displayName || userProfile?.displayName || ""}
                        level={dashboard.user.learningLevel}
                        streak={dashboard.currentStreak}
                        week={dashboard.week}
                        next={dashboard.continueLearning}
                    />

                    {dashboard.newContent && <NewContentBanner data={dashboard.newContent} />}

                    <TodaysLearningPlan data={dashboard.today} />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                        <ReviewNeededCard data={dashboard.review} />
                        <RedemittelDashboardCard />
                        <CurrentFocusCard data={dashboard.focus} />
                    </div>

                    <div className="grid gap-6 border-t border-border/60 pt-6 md:grid-cols-2">
                        {dashboard.milestone && <LearningMilestone data={dashboard.milestone} />}
                        <ExamTimeInsightCard />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
