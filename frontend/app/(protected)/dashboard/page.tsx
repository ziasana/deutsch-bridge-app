"use client";
import * as React from 'react'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    MessageSquare,
    Layers,
    SpellCheck,
    Newspaper,
    Brain,
    GraduationCap,
} from "lucide-react";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import { useI18n } from "@/componenets/I18nProvider";
const DashboardPage = () => {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const { t } = useI18n();

    useEffect(() => {
        if (hasHydrated && userProfile?.role === "ADMIN") {
            router.push("/admin");
        }
    }, [hasHydrated, userProfile, router]);

    if (hasHydrated && userProfile?.role === "ADMIN") return null;

    const modules = [
        {
            ...t.dashboard.modules.dailyWords,
            icon: SpellCheck,
            link: "/dashboard/daily-words",
        },
        {
            ...t.dashboard.modules.grammarLessons,
            icon: BookOpen,
            link: "/dashboard/grammar",
        },
        {
            ...t.dashboard.modules.expressions,
            icon: BookOpen,
            link: "/dashboard/expressions",
        },
        {
            ...t.dashboard.modules.reading,
            icon: Newspaper,
            link: "/dashboard/reading",
        },
        {
            ...t.dashboard.modules.examPrep,
            icon: GraduationCap,
            link: "/dashboard/exam-prep",
        },
        {
            ...t.dashboard.modules.wordReview,
            icon: Brain,
            link: "/dashboard/reading/review",
        },
        {
            ...t.dashboard.modules.vocabularyTrainer,
            icon: Layers,
            link: "/dashboard/vocabulary",
        },
        {
            ...t.dashboard.modules.aiChat,
            icon: MessageSquare,
            link: "/dashboard/chat",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            {/* Header */}

            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    {t.dashboard.welcome}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {t.dashboard.subtitle}
                </p>
            </div>

            {/* Modules Grid */}
            <div className="max-w-6xl mt-7 mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                        <Link
                            key={module.title}
                            href={module.link}
                            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-shadow cursor-pointer"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900">
                                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                    {module.title}
                                </h2>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 mt-4">
                                {module.description}
                            </p>

                            <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                                {t.dashboard.start}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default DashboardPage;