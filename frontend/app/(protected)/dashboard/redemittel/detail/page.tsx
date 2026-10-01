"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { getRedemittel } from "@/services/redemittelService";
import RedemittelDetailCard from "@/componenets/redemittel/RedemittelDetailCard";
import { useRedemittelActions } from "@/componenets/redemittel/useRedemittelActions";
import Loading from "@/componenets/Loading";

function DetailContent() {
    const id = useSearchParams().get("id");
    const { toggleSave, learn } = useRedemittelActions();

    const { data: redemittel, isLoading, isError } = useQuery({
        queryKey: ["redemittel", "detail", id],
        queryFn: () => getRedemittel(id as string).then((res) => res.data),
        enabled: Boolean(id),
    });

    if (isLoading) return <Loading />;

    return (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10" dir="ltr">
            <div className="mx-auto max-w-2xl">
                <Link href="/dashboard/redemittel" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Zurück
                </Link>
                <div className="mt-4">
                    {(isError || !id || !redemittel) && <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-foreground/60 shadow-card">Dieses Redemittel ist nicht verfügbar.</p>}
                    {redemittel && (
                        <RedemittelDetailCard redemittel={redemittel} onToggleSave={(r) => toggleSave.mutate(r)} saving={toggleSave.isPending}>
                            {redemittel.status === "NEW" ? (
                                <button
                                    type="button"
                                    onClick={() => learn.mutate(redemittel)}
                                    disabled={learn.isPending}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 cursor-pointer"
                                >
                                    <Plus className="size-4" aria-hidden="true" />
                                    Lernen
                                </button>
                            ) : (
                                <>
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70">
                                        <Check className="size-4" aria-hidden="true" />
                                        Bereits in deinem Lernplan
                                    </span>
                                    <Link
                                        href={`/dashboard/redemittel/practice?ids=${redemittel.id}`}
                                        className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                                    >
                                        Üben
                                    </Link>
                                </>
                            )}
                        </RedemittelDetailCard>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RedemittelDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <DetailContent />
        </Suspense>
    );
}
