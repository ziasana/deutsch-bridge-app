"use client";

import { Trophy } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { Card } from "@/componenets/ui/card";
import { MilestoneDto } from "@/types/dashboard";

interface LearningMilestoneProps {
    data: MilestoneDto;
}

export default function LearningMilestone({ data }: LearningMilestoneProps) {
    const { t } = useI18n();
    const m = t.dashboard.milestone;

    return (
        <Card className="p-6 flex items-center gap-4">
            <div className="rounded-full bg-motivation/12 p-3 shrink-0">
                <Trophy className="h-6 w-6 text-motivation" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-foreground">{m.title}</h2>
                <p className="text-foreground/80 text-sm mt-0.5">{m.reached(data.wordsMastered)}</p>
                <p className="text-foreground/50 text-sm">{m.next(data.nextThreshold)}</p>
            </div>
        </Card>
    );
}
