"use client";

import { ReactNode, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { ExamTypeCode } from "@/types/exam";

const EXAMS: { code: ExamTypeCode; label: string }[] = [
    { code: "TELC", label: "Telc B1" },
    { code: "DTZ", label: "DTZ A2–B1" },
];

/** Reads and writes the exam of an admin page ("?exam=DTZ"); Telc is the default. Other parameters (edit, part ...) survive a read, not a change. */
function Inner({ children }: Readonly<{ children: (exam: ExamTypeCode) => ReactNode }>) {
    const params = useSearchParams();
    const { userProfile, hasHydrated } = useAuthStore();
    const [exam, setExam] = useState<ExamTypeCode>(params.get("exam") === "DTZ" ? "DTZ" : "TELC");

    if (!hasHydrated || userProfile?.role !== "ADMIN") return null;

    const choose = (next: ExamTypeCode) => {
        if (next === exam) return;
        const url = new URL(window.location.href);
        url.search = "";
        if (next === "DTZ") url.searchParams.set("exam", "DTZ");
        window.history.replaceState(null, "", url.pathname + url.search);
        setExam(next);
    };

    return (
        <>
            <div className="bg-gray-100 dark:bg-gray-900 px-6 pt-8" dir="ltr">
                <div className="max-w-7xl mx-auto" role="tablist" aria-label="Exam">
                    <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">Exam</p>
                    <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
                        {EXAMS.map((option) => (
                            <button
                                key={option.code}
                                type="button"
                                role="tab"
                                aria-selected={exam === option.code}
                                onClick={() => choose(option.code)}
                                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                    exam === option.code ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div key={exam}>{children(exam)}</div>
        </>
    );
}

/**
 * Frame of an exam-prep admin page that serves more than one exam: the exam filter ("Telc B1" / "DTZ A2–B1") sits at the very top and the
 * page below renders that exam's manager. Switching the exam re-mounts the manager, so each exam starts from a clean form and list.
 */
export default function AdminExamTypePage({ children }: Readonly<{ children: (exam: ExamTypeCode) => ReactNode }>) {
    return (
        <Suspense fallback={null}>
            <Inner>{children}</Inner>
        </Suspense>
    );
}
