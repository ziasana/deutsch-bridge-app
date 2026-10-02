"use client";

import { useQuery } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { getRedemittelHub, getTodaysRedemittel } from "@/services/redemittelService";
import DashboardTile from "./DashboardTile";

/**
 * Redemittel tile: what is due and what is new, with the new phrases visible. It renders nothing when
 * there is nothing to do, so it never competes with a more urgent learning activity.
 */
export default function RedemittelDashboardCard() {
    const { data } = useQuery({
        queryKey: ["redemittel", "hub"],
        queryFn: () => getRedemittelHub().then((res) => res.data),
        staleTime: 60 * 1000,
    });

    // Same key as the learn-page preview strip, so the list is shared rather than fetched twice.
    const { data: today } = useQuery({
        queryKey: ["redemittel", "today-preview"],
        queryFn: () => getTodaysRedemittel().then((res) => res.data),
        staleTime: 60 * 1000,
        enabled: !!data && data.newToday > 0,
    });

    if (!data || (data.dueCount === 0 && data.newToday === 0)) return null;

    const href = data.dueCount > 0 ? "/dashboard/redemittel/review" : "/dashboard/redemittel/learn";

    return (
        <DashboardTile
            href={href}
            icon={MessagesSquare}
            title="Redemittel"
            cta={data.dueCount > 0 ? "Jetzt üben" : "Jetzt lernen"}
            tone={{
                surface: "bg-gradient-to-br from-learning-expression/15 to-learning-expression/5",
                icon: "text-learning-expression",
                iconBg: "bg-learning-expression/15",
            }}
        >
            <div className="space-y-0.5 text-sm text-foreground/75">
                {data.dueCount > 0 && <p>{data.dueCount} zur Wiederholung</p>}
                {data.newToday > 0 && <p>{data.newToday} neue</p>}
            </div>
            {today && today.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Neue Redemittel">
                    {today.slice(0, 3).map((r) => (
                        <li
                            key={r.id}
                            title={r.meaning ?? r.phrase}
                            className="max-w-full truncate rounded-full bg-card/80 px-2.5 py-1 text-xs font-medium text-foreground/80 shadow-sm"
                        >
                            {r.phrase}
                        </li>
                    ))}
                </ul>
            )}
        </DashboardTile>
    );
}
