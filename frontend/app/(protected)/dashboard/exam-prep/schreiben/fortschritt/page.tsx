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

function FortschrittContent() {
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const level = searchParams.get("level") ?? profileLevel ?? "B1";
    const { data, isLoading } = useQuery({ queryKey: ["writing", "progress"], queryFn: () => getWritingProgress().then((r) => r.data) });

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                <Link href={`/dashboard/exam-prep/schreiben?level=${encodeURIComponent(level)}`} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition">
                    <ArrowLeft className="size-4" />
                    Schreiben
                </Link>
                <h1 className="mt-4 text-2xl font-bold text-foreground">📈 Mein Schreibfortschritt</h1>
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
