"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getRedemittelPracticeSession } from "@/services/redemittelService";
import RedemittelSession from "@/componenets/redemittel/RedemittelSession";
import Loading from "@/componenets/Loading";

function PracticeContent() {
    const searchParams = useSearchParams();
    const idsParam = searchParams.get("ids");
    const ids = idsParam ? idsParam.split(",").filter(Boolean) : undefined;

    const { data, isLoading } = useQuery({
        queryKey: ["redemittel", "practice-session", idsParam],
        queryFn: () => getRedemittelPracticeSession(ids).then((res) => res.data),
        staleTime: Infinity,
        gcTime: 0,
    });

    if (isLoading || !data) return <Loading />;

    return (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10" dir="ltr">
            <div className="mx-auto max-w-2xl">
                {data.exercises.length === 0 ? (
                    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
                        <p className="text-lg font-semibold text-foreground">Noch nichts zu üben</p>
                        <p className="mt-2 text-sm text-foreground/60">
                            Lerne Redemittel oder speichere welche in „Meine Redemittel“. Üben kannst du die Redemittel, für die es Übungen gibt.
                        </p>
                        <Link href="/dashboard/redemittel/learn" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                            Lernen starten
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1 className="mb-6 text-2xl font-bold text-foreground">Üben</h1>
                        <RedemittelSession mode="practice" title="Üben" exercises={data.exercises} backHref="/dashboard/redemittel" />
                    </>
                )}
            </div>
        </div>
    );
}

export default function RedemittelPracticePage() {
    return (
        <Suspense fallback={<Loading />}>
            <PracticeContent />
        </Suspense>
    );
}
