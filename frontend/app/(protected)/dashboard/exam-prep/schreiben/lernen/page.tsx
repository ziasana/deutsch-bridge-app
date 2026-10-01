"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { getWritingLearning } from "@/services/writingService";
import Loading from "@/componenets/Loading";
import useAuthStore from "@/store/useAuthStore";
import { WritingLearn, WritingLevelChips } from "@/componenets/exam/writing";

function LernenContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuthStore();
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const level = searchParams.get("level") ?? profileLevel ?? "B1";

    const { data, isLoading, error } = useQuery({
        queryKey: ["writing", "learn", level],
        queryFn: () => getWritingLearning(level).then((res) => res.data),
    });

    useEffect(() => {
        if (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Lerninhalte konnten nicht geladen werden.");
        }
    }, [error]);

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                <Link
                    href={`/dashboard/exam-prep/schreiben?level=${encodeURIComponent(level)}`}
                    className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition"
                >
                    <ArrowLeft className="size-4" />
                    Schreiben
                </Link>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-foreground">📚 Schreiben lernen</h1>
                    <p className="mt-1 text-sm text-foreground/60">
                        {level} · Verstehe zuerst die Methode – dann wende sie in den Aufgaben an.
                    </p>
                </div>

                <WritingLevelChips
                    className="mt-5"
                    level={level}
                    onChange={(l) => router.replace(`/dashboard/exam-prep/schreiben/lernen?level=${encodeURIComponent(l)}`)}
                />

                <div className="mt-6">
                    {isLoading ? <Loading /> : data ? <WritingLearn key={level} level={level} data={data} /> : null}
                </div>

                <div className="mt-8 flex justify-end">
                    <Link
                        href={`/dashboard/exam-prep?section=SCHRIFTLICHER_AUSDRUCK&level=${encodeURIComponent(level)}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                        Weiter zu den Schreibaufgaben <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LernenPage() {
    return (
        <Suspense fallback={<Loading />}>
            <LernenContent />
        </Suspense>
    );
}
