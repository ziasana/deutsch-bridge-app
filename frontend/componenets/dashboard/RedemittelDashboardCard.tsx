"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { getRedemittelHub } from "@/services/redemittelService";
import { Card } from "@/componenets/ui/card";
import { Button } from "@/componenets/ui/button";

/**
 * Small Redemittel nudge: what is due and what is new, with one action. It renders nothing when
 * there is nothing to do, so it never competes with a more urgent learning activity.
 */
export default function RedemittelDashboardCard() {
    const { data } = useQuery({
        queryKey: ["redemittel", "hub"],
        queryFn: () => getRedemittelHub().then((res) => res.data),
        staleTime: 60 * 1000,
    });

    if (!data || (data.dueCount === 0 && data.newToday === 0)) return null;

    const href = data.dueCount > 0 ? "/dashboard/redemittel/review" : "/dashboard/redemittel/learn";

    return (
        <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <MessagesSquare className="size-5 text-primary" aria-hidden="true" /> Redemittel
            </h2>
            <div className="mt-3 space-y-1 text-sm text-foreground/80">
                {data.dueCount > 0 && <p>{data.dueCount} zur Wiederholung</p>}
                {data.newToday > 0 && <p>{data.newToday} neue</p>}
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
                <Link href={href}>{data.dueCount > 0 ? "Jetzt üben →" : "Jetzt lernen →"}</Link>
            </Button>
        </Card>
    );
}
