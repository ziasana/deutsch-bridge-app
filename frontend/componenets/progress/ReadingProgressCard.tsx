"use client"

"use client"

import Link from "next/link"
import { Newspaper } from "lucide-react"
import { Card } from "@/componenets/ui/card"
import { Progress } from "@/componenets/ui/progress"
import { useI18n } from "@/componenets/I18nProvider"
import { CategoryProgress } from "@/types/userProgress"

interface ReadingProgressCardProps {
    data: CategoryProgress
}

export function ReadingProgressCard({ data }: ReadingProgressCardProps) {
    const { t } = useI18n()
    const percent = data.total > 0 ? Math.round((data.learned / data.total) * 100) : 0

    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{t.progress.reading.title}</h2>
            </div>

            <div className="mt-4 flex-1">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">{t.progress.reading.articlesCompleted}</span>
                    <span className="font-medium text-foreground">
                        {data.learned}/{data.total}
                    </span>
                </div>
                <Progress value={percent} className="mt-2" />
            </div>

            <Link href="/dashboard/reading" className="mt-4 text-sm font-medium text-primary hover:underline">
                {t.progress.reading.readArticle}
            </Link>
        </Card>
    )
}
