"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Volume2, ArrowLeft } from "lucide-react";
import { getVocabularyById } from "@/services/vocabularyService";
import { VocabularyItem } from "@/types/vocabulary";
import Loading from "@/componenets/Loading";
import Button from "@/componenets/Button";
import { Badge } from "@/componenets/ui/badge";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { playVocabularyAudio } from "@/lib/vocabularyAudio";
import { useI18n } from "@/componenets/I18nProvider";

function VocabularyDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const { t } = useI18n();

    const [item, setItem] = useState<VocabularyItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        getVocabularyById(id)
            .then((res) => setItem(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <Loading />;

    if (!item) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-card max-w-md">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{t.vocabulary.detail.notFound}</h2>
                    <Button variant="primary" onClick={() => router.push("/dashboard/vocabulary")}>
                        {t.vocabulary.detail.back}
                    </Button>
                </div>
            </div>
        );
    }

    const overall = Math.round(item.progress?.overallScore ?? 0);
    const wordLabel = item.article ? `${item.article} ${item.word}` : item.word;
    const mastery = item.progress?.masteryLevel ?? "NEW";

    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/dashboard/vocabulary"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                    <ArrowLeft className="size-3.5" />
                    {t.vocabulary.detail.back}
                </Link>

                <div className="mt-4 rounded-2xl border border-border/60 bg-card p-8 shadow-card">
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                        {item.level && <Badge variant="secondary">{item.level}</Badge>}
                        <Badge variant="outline">
                            {item.source === "DICTIONARY"
                                ? t.vocabulary.sourceTabs.fromReading
                                : item.source === "AI_TUTOR"
                                  ? t.vocabulary.sourceTabs.fromAiTutor
                                  : t.vocabulary.sourceTabs.myWords}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl font-bold text-foreground" dir="ltr">
                            {wordLabel}
                        </h1>
                        <button
                            type="button"
                            onClick={() => playVocabularyAudio(item.audioUrl, item.word)}
                            aria-label={t.vocabulary.card.playAudioAria}
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition hover:bg-accent/70"
                        >
                            <Volume2 className="size-5" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <LearningProgressBar value={overall} />
                        <p className="text-xs text-foreground/55 mt-1">
                            {t.vocabulary.detail.overallLabel}: {overall}% · {t.vocabulary.mastery[mastery]}
                        </p>
                    </div>

                    <section className="mb-6">
                        <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wide mb-2">
                            {t.vocabulary.detail.meaning}
                        </h2>
                        <p className="text-lg text-foreground font-medium">{item.meaning}</p>
                    </section>

                    {item.example && (
                        <section className="mb-6">
                            <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wide mb-2">
                                {t.vocabulary.detail.example}
                            </h2>
                            <div className="rounded-lg bg-accent/50 px-4 py-3 text-foreground/80 italic" dir="ltr">
                                „{item.example}“
                            </div>
                        </section>
                    )}

                    {item.source === "CUSTOM" && item.synonyms && (
                        <section className="mb-8">
                            <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wide mb-2">
                                {t.vocabulary.detail.synonyms}
                            </h2>
                            <p className="text-foreground/75 text-sm italic" dir="ltr">
                                {item.synonyms}
                            </p>
                        </section>
                    )}

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => router.push(`/dashboard/vocabulary/practice?vocabularyItemId=${item.id}`)}
                    >
                        {t.vocabulary.detail.practiceThis}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function VocabularyDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <VocabularyDetailContent />
        </Suspense>
    );
}
