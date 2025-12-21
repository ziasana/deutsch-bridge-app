"use client";
import * as React from 'react'
import {
    BookOpen,
    MessageSquare,
    ClipboardList,
    Layers,
    SpellCheck,
} from "lucide-react";
import Link from "next/link";
const DashboardPage = () => {

    const modules = [
        {
            title: "Daily Words",
            description:
                "Learn 5 new C1-level words every day with examples and synonyms.",
            icon: SpellCheck,
            link: "/dashboard/daily-words",
        },
        {
            title: "Grammar Lessons",
            description:
                "Structured grammar explanations with examples and exercises.",
            icon: BookOpen,
            link: "/dashboard/grammar",
        },
        {
            title: "Nomen-Verb Verbindungen",
            description:
                "Learn Nomen-Verb Verbindungen with example and explanation.",
            icon: BookOpen,
            link: "/dashboard/nomenVerbSection",
        },
        {
            title: "Exercises",
            description: "Practice tasks to reinforce your grammar and vocabulary.",
            icon: ClipboardList,
            link: "/dashboard/exercises",
        },
        {
            title: "Vocabulary Trainer",
            description: "Add, save, and memorize your own vocabulary list.",
            icon: Layers,
            link: "/dashboard/vocabulary",
        },
        {
            title: "AI Chat",
            description: "Chat with an intelligent German tutor to practice freely.",
            icon: MessageSquare,
            link: "/dashboard/chat",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            {/* Header */}

            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Welcome to your Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Continue your journey to mastering German — step by step.
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
                                Start →
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default DashboardPage;