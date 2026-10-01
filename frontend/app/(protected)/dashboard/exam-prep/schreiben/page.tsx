"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PenLine } from "lucide-react";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import { WritingLevelChips, WritingOverview } from "@/componenets/exam/writing";
import { WRITING_COLOR } from "@/componenets/exam/writing/writingMeta";

function SchreibenContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const level = searchParams.get("level") ?? profileLevel ?? "B1";

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard/exam-prep" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition">
                    <ArrowLeft className="size-4" />
                    Prüfungsvorbereitung
                </Link>

                <div className="mt-4 flex items-start gap-4 rounded-[10px] bg-card p-5 shadow-card sm:p-6">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${WRITING_COLOR}1a` }}>
                        <PenLine className="size-6" style={{ color: WRITING_COLOR }} />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Schreiben</h1>
                        <p className="text-sm font-semibold text-primary">{level}</p>
                        <p className="mt-1 text-sm text-foreground/60">Lerne, wie du gute Texte für die Prüfung schreibst.</p>
                    </div>
                </div>

                <WritingLevelChips
                    className="mt-6"
                    level={level}
                    onChange={(l) => router.replace(`/dashboard/exam-prep/schreiben?level=${encodeURIComponent(l)}`)}
                />

                <div className="mt-6">
                    <WritingOverview level={level} />
                </div>
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
