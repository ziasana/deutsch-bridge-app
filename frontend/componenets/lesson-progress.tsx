"use client"

import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/componenets/ui/card"
import { Badge } from "@/componenets/ui/badge"
import { getGrammarLessons } from "@/services/grammarService"
import { GrammarLesson } from "@/types/grammar"

export function LessonProgress() {
    const [lessons, setLessons] = useState<GrammarLesson[]>([])

    useEffect(() => {
        getGrammarLessons()
            .then((res) => setLessons(res.data))
            .catch((err) => console.error(err))
    }, [])

    const isLearned = (lesson: GrammarLesson) =>
        lesson.learningProgresses.some((p) => p.learned)

    const completedLessons = lessons.filter(isLearned).length
    const notCompletedLessons = lessons.length - completedLessons

    return (
        <Card className="border-border/50">
            <CardHeader>
                <CardTitle>Lesson Progress</CardTitle>
                <CardDescription>
                    {completedLessons} completed, {notCompletedLessons} not learned
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {lessons.map((lesson) => (
                    <div
                        key={lesson.id}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                    >
                        <span className="text-sm font-medium">{lesson.title}</span>
                        <Badge
                            variant="outline"
                            className={
                                isLearned(lesson)
                                    ? "bg-chart-3/20 text-chart-3 border-chart-3/30"
                                    : "text-muted-foreground"
                            }
                        >
                            {isLearned(lesson) ? "✓ Learned" : "Not learned"}
                        </Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
