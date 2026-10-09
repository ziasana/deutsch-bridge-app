"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PenLine } from "lucide-react";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import { WritingOverview } from "@/componenets/exam/writing";
import { WRITING_LEVELS } from "@/componenets/exam/writing/writingMeta";
import { lessonThemeVars } from "@/componenets/exam/lessonTheme";
import { cn } from "@/lib/utils";

function SchreibenContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const level = searchParams.get("level") ?? profileLevel ?? "B1";

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir="ltr" style={lessonThemeVars("writing")}>
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/dashboard/exam-prep" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Prüfungsvorbereitung
                </Link>

                <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) p-5 text-white shadow-md sm:p-7">
                    <span aria-hidden="true" className="absolute -end-10 -top-12 size-48 rounded-full bg-white/10" />
                    <span aria-hidden="true" className="absolute -bottom-16 start-1/3 size-40 rounded-full bg-white/10" />
                    <span aria-hidden="true" className="absolute end-6 top-4 text-7xl opacity-20 sm:text-8xl">✍️</span>
                    <div className="relative flex items-start gap-4">
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur sm:size-16">
                            <PenLine className="size-7 sm:size-8" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-extrabold sm:text-3xl">Schreiben</h1>
                            <span className="mt-1 inline-flex rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold">{level}</span>
                            <p className="mt-2 text-sm text-white/90">Lerne, wie du gute Texte für die Prüfung schreibst: erst die Methode, dann die Praxis.</p>
                        </div>
                    </div>
                </header>

                <div role="group" aria-label="Niveau" className="flex flex-wrap items-center gap-2">
                    {WRITING_LEVELS.map((l) => (
                        <button
                            key={l}
                            type="button"
                            aria-pressed={l === level}
                            onClick={() => router.replace(`/dashboard/exam-prep/schreiben?level=${encodeURIComponent(l)}`)}
                            className={cn(
                                "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                l === level ? "border-transparent bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) text-white shadow-sm" : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:bg-primary/5",
                            )}
                        >
                            {l}
                        </button>
                    ))}
                </div>

                <WritingOverview level={level} />
            </div>
        </div>
    );
}

export default function SchreibenPage() {
    return (
        <Suspense fallback={<Loading />}>
            <SchreibenContent />
        </Suspense>
    );
}
