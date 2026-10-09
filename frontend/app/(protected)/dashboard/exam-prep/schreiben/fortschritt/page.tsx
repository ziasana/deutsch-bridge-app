"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import { getWritingProgress } from "@/services/writingAttemptService";
import WritingProgress from "@/componenets/exam/writing/WritingProgress";
import { lessonThemeVars } from "@/componenets/exam/lessonTheme";

function FortschrittContent() {
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const level = searchParams.get("level") ?? profileLevel ?? "B1";
    const { data, isLoading } = useQuery({ queryKey: ["writing", "progress"], queryFn: () => getWritingProgress().then((r) => r.data) });

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir="ltr" style={lessonThemeVars("writing")}>
            <div className="mx-auto max-w-4xl">
                <Link href={`/dashboard/exam-prep/schreiben?level=${encodeURIComponent(level)}`} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Schreiben
                </Link>
                <header className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) p-5 text-white shadow-md sm:p-6">
                    <span aria-hidden="true" className="absolute -end-10 -top-12 size-44 rounded-full bg-white/10" />
                    <span aria-hidden="true" className="absolute end-6 top-3 text-7xl opacity-20">📈</span>
                    <h1 className="relative text-2xl font-extrabold sm:text-3xl">Mein Schreibfortschritt</h1>
                    <p className="relative mt-1 text-sm text-white/90">Was du schon geschafft hast – und woran du als Nächstes arbeiten solltest.</p>
                </header>
                <div className="mt-6">{isLoading ? <Loading /> : data ? <WritingProgress progress={data} level={level} /> : null}</div>
            </div>
        </div>
    );
}

export default function FortschrittPage() {
    return (
        <Suspense fallback={<Loading />}>
            <FortschrittContent />
        </Suspense>
    );
}
