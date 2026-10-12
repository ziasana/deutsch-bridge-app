"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import Loading from "@/componenets/Loading";
import AssessmentQueuePanel from "@/componenets/admin/examSimulation/AssessmentQueuePanel";
import AttemptsPanel from "@/componenets/admin/examSimulation/AttemptsPanel";
import ProfilesPanel from "@/componenets/admin/examSimulation/ProfilesPanel";
import { cn } from "@/lib/utils";

const TABS = [
    { id: "profiles", label: "Prüfungsprofile" },
    { id: "assessments", label: "Bewertungswarteschlange" },
    { id: "attempts", label: "Versuche" },
] as const;

export default function AdminExamSimulationPage() {
    const router = useRouter();
    const { userProfile, hasHydrated } = useAuthStore();
    const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("profiles");

    useEffect(() => {
        if (hasHydrated && userProfile?.role !== "ADMIN") router.push("/dashboard");
    }, [hasHydrated, userProfile, router]);

    if (!hasHydrated || userProfile?.role !== "ADMIN") return <Loading />;

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            <header className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <ClipboardCheck className="size-5" aria-hidden />
                </span>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Prüfungssimulation verwalten</h1>
                    <p className="text-sm text-foreground/60">Profile, Bewertungsraster, verfügbare Aufgaben und offene Bewertungen.</p>
                </div>
            </header>
            <div role="tablist" className="flex gap-2 border-b border-border/60">
                {TABS.map((t) => (
                    <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition", tab === t.id ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground")}>
                        {t.label}
                    </button>
                ))}
            </div>
            {tab === "profiles" && <ProfilesPanel />}
            {tab === "assessments" && <AssessmentQueuePanel />}
            {tab === "attempts" && <AttemptsPanel />}
        </div>
    );
}
