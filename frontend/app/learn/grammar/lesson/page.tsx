"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Lightbulb, MessageSquareQuote } from "lucide-react";
import Loading from "@/componenets/Loading";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { getLevelMeta, levelThemeVars } from "@/componenets/learning/levelMeta";
import { useI18n } from "@/componenets/I18nProvider";
import PublicGrammarQuiz from "@/componenets/marketing/learn/PublicGrammarQuiz";
import UnlockBanner from "@/componenets/marketing/learn/UnlockBanner";
import { useMarketing } from "@/componenets/marketing/useMarketing";
import { isTranslatableLevel, localizedLessonText } from "@/lib/grammarLocalization";
import type { AppLanguage } from "@/lib/i18n/translations";
import { getPublicGrammarLesson } from "@/services/publicLearnService";
import type { GrammarLesson } from "@/types/grammar";
import type { PublicGrammarFull } from "@/types/publicLearn";
import { cn } from "@/lib/utils";

/** The public lesson carries no progress or bookmark; the dashboard helpers expect a full lesson, so those fields are filled neutrally. */
const asLesson = (l: PublicGrammarFull): GrammarLesson => ({
    ...l,
    summary: l.summary ?? "",
    example: l.example ?? "",
    usageTips: l.usageTips ?? "",
    status: "PUBLISHED",
    learningProgresses: [],
    createdAt: "",
    updatedAt: "",
    categoryId: null,
    categoryTitle: l.categoryTitle,
    sortOrder: 0,
    bookmarked: false,
});

export default function PublicLessonPage() {
    return (
        <Suspense fallback={<Loading />}>
            <PublicLesson />
        </Suspense>
    );
}

function PublicLesson() {
    const id = useSearchParams().get("id") ?? "";
    const { m } = useMarketing();
    const { t } = useI18n();
    const g = m.learnPage.grammar;
    const [lang, setLang] = useState<AppLanguage>("en");

    const { data, isPending, isError } = useQuery({
        queryKey: ["public", "learn", "grammar-lesson", id],
        queryFn: () => getPublicGrammarLesson(id).then((res) => res.data),
        enabled: Boolean(id),
        retry: false,
    });

    const message = (text: string) => (
        <div className="min-h-[50vh] px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-3xl rounded-3xl bg-card p-10 text-center shadow-card">
                <p className="text-foreground/65">{text}</p>
                <Link href="/learn/grammar" className="mt-3 inline-block font-semibold text-primary hover:underline">
                    ← {g.backToList}
                </Link>
            </div>
        </div>
    );

    if (!id) return message(t.grammar.noLesson);
    if (isPending) return <Loading />;
    // A locked or unknown lesson answers 403: the list never links to one, so this only happens on a hand-typed address.
    if (isError || !data) return message(m.learnPage.error);

    const lesson = asLesson(data);
    const hasFa = isTranslatableLevel(lesson.level) && Boolean(lesson.contentFa);
    const localized = localizedLessonText(lesson, hasFa ? lang : "en");
    const levelColor = getLevelMeta(lesson.level).color;
    const chip = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";
    const wordTotal = [localized.content, localized.example, localized.usageTips].join(" ").split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(wordTotal / 130));

    return (
        <div className="bg-background px-4 py-8 sm:px-6 sm:py-10" style={levelThemeVars(levelColor)}>
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/learn/grammar" className="inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    ← {g.backToList}
                </Link>

                <header dir={localized.dir} className="relative overflow-hidden rounded-3xl p-6 text-white shadow-md sm:p-8" style={{ backgroundImage: `linear-gradient(135deg, ${levelColor}, ${levelColor}b3)` }}>
                    <span aria-hidden="true" className="absolute -end-10 -top-12 size-48 rounded-full bg-white/10" />
                    <span aria-hidden="true" className="absolute -bottom-16 start-1/3 size-40 rounded-full bg-white/5" />
                    <div className="relative flex items-start gap-4">
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:size-16">
                            <BookOpen className="size-7 sm:size-8" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`${chip} bg-white/25 text-white`}>{lesson.level}</span>
                                {lesson.categoryTitle && <span className={`${chip} bg-white/15 text-white`}>{lesson.categoryTitle}</span>}
                                <span className={`${chip} bg-white text-foreground`}>{m.learnPage.previewNote}</span>
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{localized.title}</h1>
                            {localized.summary && <p className="mt-2 text-sm leading-relaxed text-white/90 sm:text-base">{localized.summary}</p>}
                            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/80">
                                <Clock className="size-3.5" aria-hidden="true" />
                                {t.grammar.minRead(minutes)}
                            </p>
                        </div>
                    </div>
                </header>

                {hasFa && (
                    <div className="flex justify-end" dir="ltr">
                        <div className="flex rounded-full border border-border bg-card p-1 text-sm font-semibold" role="group">
                            {(["en", "fa"] as const).map((code) => (
                                <button
                                    key={code}
                                    type="button"
                                    aria-pressed={lang === code}
                                    onClick={() => setLang(code)}
                                    className={cn("rounded-full px-4 py-1.5 transition", lang === code ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground")}
                                >
                                    {code === "en" ? g.langEn : g.langFa}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <article className="space-y-6" dir={localized.dir}>
                    <div className="space-y-5 rounded-3xl bg-card p-6 shadow-card sm:p-8">
                        <LessonMarkdown content={localized.content} className="text-foreground/85" />
                    </div>

                    {localized.example && (
                        <aside className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-primary/15">
                            <div className="flex items-center gap-3 bg-primary/10 px-6 py-3 sm:px-8">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <MessageSquareQuote className="size-5" aria-hidden="true" />
                                </span>
                                <p className="font-bold text-foreground">{t.grammar.example}</p>
                            </div>
                            <div className="p-6 sm:p-8">
                                <LessonMarkdown content={localized.example} className="text-foreground/85" />
                            </div>
                        </aside>
                    )}

                    {localized.usageTips && (
                        <aside className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-learning-vocabulary/30">
                            <div className="flex items-center gap-3 bg-learning-vocabulary/15 px-6 py-3 sm:px-8">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-learning-vocabulary text-white">
                                    <Lightbulb className="size-5" aria-hidden="true" />
                                </span>
                                <p className="font-bold text-foreground">{t.grammar.usageTip}</p>
                            </div>
                            <div className="p-6 sm:p-8">
                                <LessonMarkdown content={localized.usageTips} className="text-foreground/85" />
                            </div>
                        </aside>
                    )}
                </article>

                <PublicGrammarQuiz key={`${lesson.id}-${lang}`} quiz={lesson.quiz} lessonLevel={lesson.level} language={hasFa ? lang : "en"} />

                <div className="rounded-3xl bg-card p-6 shadow-card sm:p-7">
                    <h2 className="text-lg font-bold text-foreground">{g.nextTitle}</h2>
                    <p className="mt-1 text-sm text-foreground/65">{g.nextText}</p>
                    <UnlockBanner title={m.learnPage.unlock.title} />
                </div>
            </div>
        </div>
    );
}
