"use client"

"use client"

import Link from "next/link"
import { ClipboardCheck } from "lucide-react"
import { Card } from "@/componenets/ui/card"
import { useI18n } from "@/componenets/I18nProvider"
import { ExamPerformance } from "@/types/userProgress"

interface ExamPerformanceCardProps {
    data: ExamPerformance
}

export function ExamPerformanceCard({ data }: ExamPerformanceCardProps) {
    const { t } = useI18n()
    const hasAttempts = data.averageScore !== null

    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{t.progress.exam.title}</h2>
            </div>

            <div className="mt-3 flex-1">
                {hasAttempts ? (
                    <>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">{Math.round(data.averageScore!)}%</span>
                            <span className="text-sm text-foreground/60">{t.progress.exam.averageScore}</span>
                        </div>
                        <p className="mt-1 text-sm text-foreground/60">
                            {t.progress.exam.acrossCompleted(data.attemptsCompleted)}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-foreground/60">
                        {t.progress.exam.empty}
                    </p>
                )}
            </div>

            <Link href="/dashboard/exam-prep" className="mt-4 text-sm font-medium text-primary hover:underline">
                {hasAttempts ? t.progress.exam.practiceMore : t.progress.exam.startExamPrep}
            </Link>
        </Card>
    )
}
