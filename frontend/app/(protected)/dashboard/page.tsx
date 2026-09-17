"use client";
import * as React from 'react'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    MessageSquare,
    Layers,
    SpellCheck,
    Sparkles,
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
            icon: Sparkles,
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
        <div className="px-6 py-10">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-foreground">
                    {t.dashboard.welcome}
                </h1>
                <p className="text-foreground/60 mt-2">
                    {t.dashboard.subtitle}
                </p>
            </div>

            {/* Modules Grid */}
            <div className="max-w-6xl mt-7 mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                        <Link
                            key={module.title}
                            href={module.link}
                            className="group bg-card rounded-[10px] shadow-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-accent">
                                    <Icon className="w-6 h-6 text-accent-foreground" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition">
                                    {module.title}
                                </h2>
                            </div>

                            <p className="text-foreground/60 mt-4">
                                {module.description}
                            </p>

                            <div className="mt-4 text-primary font-medium group-hover:underline">
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