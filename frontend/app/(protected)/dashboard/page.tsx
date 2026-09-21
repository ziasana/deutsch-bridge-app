"use client";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { useI18n } from "@/componenets/I18nProvider";
import { getDashboard } from "@/services/dashboardService";
import { DashboardResponse } from "@/types/dashboard";
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

const DashboardPage = () => {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const { t } = useI18n();

    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        setError(false);
        getDashboard()
            .then((res) => setDashboard(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (hasHydrated && userProfile?.role === "ADMIN") {
            router.push("/admin");
            return;
        }
        if (hasHydrated && userProfile?.role !== "ADMIN") {
            load();
        }
    }, [hasHydrated, userProfile, router, load]);

    if (hasHydrated && userProfile?.role === "ADMIN") return null;

    return (
        <div className="px-4 py-8 sm:px-6 sm:py-10">
            {loading && <DashboardSkeleton />}

            {!loading && error && (
                <div className="max-w-6xl mx-auto text-center py-16">
                    <p className="text-foreground/60">{t.dashboard.error.message}</p>
                    <Button onClick={load} className="mt-4">
                        {t.dashboard.error.retry}
                    </Button>
                </div>
            )}

            {!loading && !error && dashboard && (
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
