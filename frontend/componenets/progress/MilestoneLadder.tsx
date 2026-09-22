"use client"

"use client"

import { Award, Check } from "lucide-react"
import { Card } from "@/componenets/ui/card"
import { cn } from "@/lib/utils"
import { useI18n } from "@/componenets/I18nProvider"
import { MilestoneLadder as MilestoneLadderType } from "@/types/userProgress"

interface MilestoneLadderProps {
    data: MilestoneLadderType
}

export function MilestoneLadder({ data }: MilestoneLadderProps) {
    const { t } = useI18n()
    return (
        <Card className="p-6">
            <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{t.progress.milestones.title}</h2>
            </div>
            <p className="mt-1 text-sm text-foreground/60">
                {t.progress.milestones.wordsMastered(data.wordsMastered)}
                {data.nextThreshold
                    ? ` — ${t.progress.milestones.toGoUntil(data.nextThreshold - data.wordsMastered, data.nextThreshold)}`
                    : ` — ${t.progress.milestones.allReached}`}
            </p>

            <div className="mt-5 flex items-center">
                {data.thresholds.map((threshold, index) => {
                    const isReached = data.reached[index]
                    const isNext = !isReached && threshold === data.nextThreshold
                    return (
                        <div key={threshold} className="flex flex-1 items-center last:flex-none">
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold sm:h-10 sm:w-10",
                                        isReached
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : isNext
                                                ? "border-primary text-primary"
                                                : "border-foreground/15 text-foreground/40"
                                    )}
                                >
                                    {isReached ? <Check className="h-4 w-4" /> : threshold}
                                </div>
                                <span className="text-[10px] text-foreground/50">{threshold}</span>
                            </div>
                            {index < data.thresholds.length - 1 && (
                                <div className={cn("mx-1 h-0.5 flex-1 sm:mx-2", isReached ? "bg-primary" : "bg-foreground/15")} />
                            )}
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}
