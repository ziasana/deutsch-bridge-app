"use client"

"use client"

import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { Card } from "@/componenets/ui/card"
import { Progress } from "@/componenets/ui/progress"
import { useI18n } from "@/componenets/I18nProvider"
import { GrammarMastery } from "@/types/userProgress"

interface GrammarMasteryCardProps {
    data: GrammarMastery
}

export function GrammarMasteryCard({ data }: GrammarMasteryCardProps) {
    const { t } = useI18n()
    const lessonsPercent = data.lessonsTotal > 0 ? Math.round((data.lessonsLearned / data.lessonsTotal) * 100) : 0

    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{t.progress.grammar.title}</h2>
            </div>

            <div className="mt-4 flex-1 space-y-4">
                <div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/70">{t.progress.grammar.lessonsLearned}</span>
                        <span className="font-medium text-foreground">
                            {data.lessonsLearned}/{data.lessonsTotal}
                        </span>
                    </div>
                    <Progress value={lessonsPercent} className="mt-2" />
                </div>

                <div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/70">{t.progress.grammar.categoryTestsPassed}</span>
                        <span className="font-medium text-foreground">
                            {data.categoriesPassed}/{data.categoriesTotal}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-foreground/50">
                        {data.categoriesAttempted > 0
                            ? t.progress.grammar.attempted(data.categoriesAttempted)
                            : t.progress.grammar.notAttempted}
                    </p>
                </div>
            </div>

            <Link href="/dashboard/grammar" className="mt-4 text-sm font-medium text-primary hover:underline">
                {t.progress.grammar.practice}
            </Link>
        </Card>
    )
}
