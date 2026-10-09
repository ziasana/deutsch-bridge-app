"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Volume2, ArrowLeft } from "lucide-react";
import { getVocabularyById } from "@/services/vocabularyService";
import { VocabularyItem } from "@/types/vocabulary";
import Loading from "@/componenets/Loading";
import Button from "@/componenets/Button";
import { Badge } from "@/componenets/ui/badge";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { playVocabularyAudio } from "@/lib/vocabularyAudio";
import { useI18n } from "@/componenets/I18nProvider";
import { ARTICLE_TONE, MASTERY_CHIP, SOURCE_ACCENT } from "@/componenets/vocabulary/sourceColors";
import { ACCENT_TITLE_COLOR, levelThemeVars } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";

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
                <div className="rounded-3xl border border-border/60 bg-card p-10 text-center shadow-card max-w-md">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{t.vocabulary.detail.notFound}</h2>
                    <Button variant="primary" onClick={() => router.push("/dashboard/vocabulary")}>
                        {t.vocabulary.detail.back}
                    </Button>
                </div>
            </div>
        );
    }

    const overall = Math.round(item.progress?.overallScore ?? 0);
    const mastery = item.progress?.masteryLevel ?? "NEW";
    const accent = SOURCE_ACCENT[item.source];
    // Back to the list the learner came from (same source, filters and page); a fresh tab falls back to the plain list.
    const goBack = () => {
        if (window.history.length > 1) router.back();
        else router.push("/dashboard/vocabulary");
    };

    return (
        <div className="min-h-screen bg-background px-6 py-10" style={levelThemeVars(accent)}>
            <div className="max-w-3xl mx-auto">
                <button type="button" onClick={goBack} className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    {t.vocabulary.detail.back}
                </button>

                <div className="mt-4 overflow-hidden rounded-3xl bg-card shadow-card">
                    <div className="px-6 pb-6 pt-6 sm:px-8 sm:pt-8" style={{ backgroundImage: `linear-gradient(135deg, ${accent}2e, ${accent}0d 70%, transparent)` }}>
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                        {item.level && <Badge variant="secondary">{item.level}</Badge>}
                        {item.wordType && <Badge variant="secondary">{t.vocabulary.wordTypes[item.wordType]}</Badge>}
                        <Badge variant="outline">
                            {item.source === "DICTIONARY"
                                ? t.vocabulary.sourceTabs.fromReading
                                : item.source === "AI_TUTOR"
                                  ? t.vocabulary.sourceTabs.fromAiTutor
                                  : t.vocabulary.sourceTabs.myWords}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl font-extrabold sm:text-4xl" dir="ltr" style={{ color: ACCENT_TITLE_COLOR }}>
                            {item.article && (
                                <span className={cn("me-3 rounded-full px-3 py-0.5 align-middle text-lg font-bold", ARTICLE_TONE[item.article.toLowerCase()] ?? "bg-primary/10 text-primary")}>{item.article}</span>
                            )}
                            {item.word}
                        </h1>
                        <button
                            type="button"
                            onClick={() => playVocabularyAudio(item.audioUrl, item.word)}
                            aria-label={t.vocabulary.card.playAudioAria}
                            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90"
                        >
                            <Volume2 className="size-5" />
                        </button>
                    </div>

                    <div>
                        <LearningProgressBar value={overall} />
                        <p className="mt-1.5 flex items-center gap-2 text-xs text-foreground/55">
                            {t.vocabulary.detail.overallLabel}: {overall}%
                            <span className={cn("rounded-full px-2 py-0.5 font-bold", MASTERY_CHIP[mastery])}>{t.vocabulary.mastery[mastery]}</span>
                        </p>
                    </div>
                    </div>

                    <div className="p-6 sm:p-8">

                    <section className="mb-6 rounded-3xl border-s-4 border-primary bg-primary/[0.07] p-5">
                        <h2 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">
                            {t.vocabulary.detail.meaning}
                        </h2>
                        <p className="text-lg text-foreground font-semibold">{item.meaning}</p>
                    </section>

                    {item.example && (
                        <section className="mb-6">
                            <h2 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">
                                {t.vocabulary.detail.example}
                            </h2>
                            <div className="rounded-2xl border-s-4 border-primary/40 bg-primary/[0.06] px-4 py-3 text-foreground/80 italic" dir="ltr">
                                „{item.example}“
                            </div>
                        </section>
                    )}

                    {item.synonyms && (
                        <section className="mb-8">
                            <h2 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">
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
