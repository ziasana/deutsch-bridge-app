"use client"

import { GraduationCap } from "lucide-react"
import { useI18n } from "@/componenets/I18nProvider"
import { GrammarMastery } from "@/types/userProgress"
import { LabeledBar, ProgressPanel } from "./ProgressPanel"

interface GrammarMasteryCardProps {
    data: GrammarMastery
}

export function GrammarMasteryCard({ data }: Readonly<GrammarMasteryCardProps>) {
    const { t } = useI18n()

    return (
        <ProgressPanel
            title={t.progress.grammar.title}
            icon={GraduationCap}
            iconClass="text-learning-grammar"
            iconBgClass="bg-learning-grammar/12"
            ctaLabel={t.progress.grammar.practice}
            ctaHref="/dashboard/grammar"
        >
            <div className="space-y-5">
                <LabeledBar label={t.progress.grammar.lessonsLearned} learned={data.lessonsLearned} total={data.lessonsTotal} barClass="bg-learning-grammar" />
                <div>
                    <LabeledBar label={t.progress.grammar.categoryTestsPassed} learned={data.categoriesPassed} total={data.categoriesTotal} barClass="bg-chart-3" />
                    <p className="mt-1.5 text-xs text-foreground/50">
                        {data.categoriesAttempted > 0 ? t.progress.grammar.attempted(data.categoriesAttempted) : t.progress.grammar.notAttempted}
                    </p>
                </div>
            </div>
        </ProgressPanel>
    )
}
