"use client"

import { ClipboardCheck } from "lucide-react"
import CircularProgress from "@/componenets/CircularProgress"
import { useI18n } from "@/componenets/I18nProvider"
import { ExamPerformance } from "@/types/userProgress"
import { ProgressPanel } from "./ProgressPanel"

interface ExamPerformanceCardProps {
    data: ExamPerformance
}

export function ExamPerformanceCard({ data }: Readonly<ExamPerformanceCardProps>) {
    const { t } = useI18n()
    const hasAttempts = data.averageScore !== null

    return (
        <ProgressPanel
            title={t.progress.exam.title}
            icon={ClipboardCheck}
            iconClass="text-learning-exam"
            iconBgClass="bg-learning-exam/12"
            ctaLabel={hasAttempts ? t.progress.exam.practiceMore : t.progress.exam.startExamPrep}
            ctaHref="/dashboard/exam-prep"
        >
            {hasAttempts ? (
                <div className="flex items-center gap-5">
                    <CircularProgress value={data.averageScore ?? 0} size={92} color="hsl(243 75% 59%)" trackColor="hsl(0 0% 50% / 0.15)" showLabel />
                    <div>
                        <p className="text-sm font-semibold text-foreground">{t.progress.exam.averageScore}</p>
                        <p className="mt-1 text-sm text-foreground/60">{t.progress.exam.acrossCompleted(data.attemptsCompleted)}</p>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-foreground/60">{t.progress.exam.empty}</p>
            )}
        </ProgressPanel>
    )
}
