"use client";

import { Trophy } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { MilestoneDto } from "@/types/dashboard";

interface LearningMilestoneProps {
    data: MilestoneDto;
}

/** A slim progress row toward the next vocabulary milestone; deliberately not a card. */
export default function LearningMilestone({ data }: Readonly<LearningMilestoneProps>) {
    const { t } = useI18n();
    const m = t.dashboard.milestone;
    const percent = data.nextThreshold > 0 ? (data.wordsMastered / data.nextThreshold) * 100 : 0;

    return (
        <div className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-motivation/12">
                <Trophy className="size-5 text-motivation" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{m.reached(data.wordsMastered)}</p>
                <LearningProgressBar value={percent} className="mt-2 h-2" barClassName="bg-motivation" ariaLabel={m.title} />
                <p className="mt-1.5 text-xs text-foreground/55">{m.next(data.nextThreshold)}</p>
            </div>
        </div>
    );
}
