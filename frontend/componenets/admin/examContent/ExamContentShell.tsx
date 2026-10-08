"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

const TABS = [
    { href: "/admin/exam-prep/content-generator", label: "Content Generator" },
    { href: "/admin/exam-prep/import", label: "Import JSON" },
    { href: "/admin/exam-prep/content-library", label: "Content Library" },
];

interface ExamContentShellProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

/** Admin-only page frame shared by the exam content pipeline screens (generate → import → review). */
export default function ExamContentShell({ title, description, children }: Readonly<ExamContentShellProps>) {
    const router = useRouter();
    const pathname = usePathname();
    const { userProfile, hasHydrated } = useAuthStore();

    useEffect(() => {
        if (hasHydrated && userProfile?.role !== "ADMIN") router.push("/dashboard");
    }, [hasHydrated, userProfile, router]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10" dir="ltr">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">{description}</p>

                <nav className="mt-6 flex flex-wrap gap-2" aria-label="Exam content steps">
                    {TABS.map((tab, i) => {
                        const active = pathname?.startsWith(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    active
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                            >
                                {i + 1}. {tab.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-6">{children}</div>
            </div>
        </div>
    );
}
