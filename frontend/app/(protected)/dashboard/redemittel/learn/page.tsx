"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";
import { getTodaysRedemittel } from "@/services/redemittelService";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import RedemittelDetailCard from "@/componenets/redemittel/RedemittelDetailCard";
import { useRedemittelActions } from "@/componenets/redemittel/useRedemittelActions";
import Loading from "@/componenets/Loading";

const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 cursor-pointer";

export default function RedemittelLearnPage() {
    const router = useRouter();
    const [index, setIndex] = useState(0);
    const [learnedIds, setLearnedIds] = useState<string[]>([]);

    // Fetched once: the list is the day's quota, so it must not shrink while the learner works through it.
    const { data: today, isLoading } = useQuery({
        queryKey: ["redemittel", "today"],
        queryFn: () => getTodaysRedemittel().then((res) => res.data),
        staleTime: Infinity,
        gcTime: 0,
    });

    const { toggleSave, learn } = useRedemittelActions();
    const [saved, setSaved] = useState<Record<string, boolean>>({});

    if (isLoading || !today) return <Loading />;

    const shell = (children: React.ReactNode) => (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10" dir="ltr">
            <div className="mx-auto max-w-2xl">{children}</div>
        </div>
    );

    if (today.length === 0) {
        return shell(
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
                <p className="text-lg font-semibold text-foreground">🎉 Du hast alle neuen Redemittel für heute gelernt.</p>
                <p className="mt-2 text-sm text-foreground/60">Schau später wieder vorbei oder übe deine bisherigen Redemittel.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href="/dashboard/redemittel/practice" className={primaryButton}>
                        Üben
                    </Link>
                    <Link href="/dashboard/redemittel" className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
                        Zur Übersicht
                    </Link>
                </div>
            </div>,
        );
    }

    if (index >= today.length) {
        return shell(
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent">
                    <PartyPopper className="size-6 text-primary" aria-hidden="true" />
                </div>
                <h1 className="mt-4 text-2xl font-bold text-foreground">Gut gemacht!</h1>
                <p className="mt-2 text-foreground/70">
                    Du hast heute {learnedIds.length} Redemittel gelernt.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        className={primaryButton}
                        onClick={() => router.push(`/dashboard/redemittel/practice?ids=${learnedIds.join(",")}`)}
                    >
                        Jetzt üben
                    </button>
                    <Link href="/dashboard/redemittel" className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
                        Später wiederholen
                    </Link>
                </div>
                <p className="mt-4 text-xs text-foreground/50">Die erste Wiederholung ist automatisch für morgen geplant.</p>
            </div>,
        );
    }

    const current = today[index];
    const isLast = index === today.length - 1;
    const view = { ...current, saved: saved[current.id] ?? current.saved };

    const next = () => {
        learn.mutate(current, {
            onSuccess: () => {
                setLearnedIds((prev) => [...prev, current.id]);
                setIndex((i) => i + 1);
            },
        });
    };

    return shell(
        <>
            <div className="flex items-center justify-between gap-3">
                <Link href="/dashboard/redemittel" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Zurück
                </Link>
                <span className="text-sm font-medium text-foreground/60">Heute lernen</span>
            </div>

            <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-foreground/60">
                    <span>Redemittel {index + 1} von {today.length}</span>
                </div>
                <LearningProgressBar value={(index / today.length) * 100} ariaLabel={`${index} von ${today.length} gelernt`} />
            </div>

            <div className="mt-6">
                <RedemittelDetailCard
                    key={current.id}
                    redemittel={view}
                    saving={toggleSave.isPending}
                    onToggleSave={(r) =>
                        toggleSave.mutate(r, { onSuccess: (updated) => setSaved((prev) => ({ ...prev, [updated.id]: updated.saved })) })
                    }
                >
                    <button type="button" onClick={next} disabled={learn.isPending} className={primaryButton}>
                        {isLast ? "Verstanden – abschließen" : "Verstanden – weiter"}
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                </RedemittelDetailCard>
            </div>
        </>,
    );
}
