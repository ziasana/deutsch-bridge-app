"use client"

import { Newspaper } from "lucide-react"
import { useI18n } from "@/componenets/I18nProvider"
import { CategoryProgress } from "@/types/userProgress"
import { LabeledBar, ProgressPanel } from "./ProgressPanel"

interface ReadingProgressCardProps {
    data: CategoryProgress
}

export function ReadingProgressCard({ data }: Readonly<ReadingProgressCardProps>) {
    const { t } = useI18n()

    return (
        <ProgressPanel
            title={t.progress.reading.title}
            icon={Newspaper}
            iconClass="text-learning-reading"
            iconBgClass="bg-learning-reading/12"
            ctaLabel={t.progress.reading.readArticle}
            ctaHref="/dashboard/reading"
        >
            <LabeledBar label={t.progress.reading.articlesCompleted} learned={data.learned} total={data.total} barClass="bg-learning-reading" />
        </ProgressPanel>
    )
}
