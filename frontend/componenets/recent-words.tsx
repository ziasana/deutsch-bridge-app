"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { getRecentVocabularies } from "../services/userProgressService"
import { RecentVocabularyType } from "@/types/userProgress"

const masteryColors: Record<string, string> = {
    MASTER: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    LEARNING: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    NEW: "bg-chart-1/20 text-chart-1 border-chart-1/30",
}

export function RecentWords() {
    const [recentWords, setRecentWords] = useState<RecentVocabularyType[]>([]);
    useEffect(() => {
        getRecentVocabularies()
            .then((data) => {
                setRecentWords(data.data)
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message ?? "Failed to load recent vocabulary")
                console.error(err)
            })
    }, []);

    const masterCount = recentWords.filter((w) => w.status === "MASTER").length
    const learningCount = recentWords.filter((w) => w.status === "LEARNING").length

    return (
        <Card className="border-border/50">
            <CardHeader>
                <CardTitle>Recent Vocabulary</CardTitle>
                <CardDescription>
                    {masterCount} mastered, {learningCount} in progress
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recentWords.map((word, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{word.word}</span>
                                <span className="text-sm text-muted-foreground">
                              {word.meaning}
                            </span>
                            </div>
                            <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${masteryColors[word.status] ?? masteryColors.NEW}`}
                            >
                            {word.status}
                             </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
