"use client";

import { Fragment, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Loading from "@/componenets/Loading";
import { getLevelMeta, levelThemeVars } from "@/componenets/learning/levelMeta";
import PublicGrammarQuiz from "@/componenets/marketing/learn/PublicGrammarQuiz";
import UnlockBanner from "@/componenets/marketing/learn/UnlockBanner";
import { useMarketing } from "@/componenets/marketing/useMarketing";
import { getArticleImageSrc } from "@/lib/readingImages";
import { getPublicArticle } from "@/services/publicLearnService";
import type { QuizQuestion } from "@/types/grammar";
import type { PublicArticleFull } from "@/types/publicLearn";

const GENDER_TONE: Record<string, string> = {
    der: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    die: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    das: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

/** The article's comprehension questions in the dashboard quiz shape, so they look and behave like every other exercise. */
const asQuiz = (a: PublicArticleFull): QuizQuestion[] =>
    a.quiz
        .filter((q) => q.options && q.options.length > 1 && q.correctAnswer)
        .map((q) => ({ type: "mcq", title: "", question: q.prompt, options: q.options ?? [], answer: q.correctAnswer }));

export default function PublicArticlePage() {
    return (
        <Suspense fallback={<Loading />}>
            <PublicArticle />
        </Suspense>
    );
}

function PublicArticle() {
    const id = useSearchParams().get("id") ?? "";
    const { m } = useMarketing();
    const r = m.learnPage.reading;
    const { data, isPending, isError } = useQuery({
        queryKey: ["public", "learn", "article", id],
        queryFn: () => getPublicArticle(id).then((res) => res.data),
        enabled: Boolean(id),
        retry: false,
    });

    const message = (text: string) => (
        <div className="min-h-[50vh] px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-3xl rounded-3xl bg-card p-10 text-center shadow-card">
                <p className="text-foreground/65">{text}</p>
                <Link href="/learn/reading" className="mt-3 inline-block font-semibold text-primary hover:underline">
                    ← {r.back}
                </Link>
            </div>
        </div>
    );

    if (!id) return message(m.learnPage.empty);
    if (isPending) return <Loading />;
    if (isError || !data) return message(m.learnPage.error);
    return <ArticleView article={data} />;
}

function ArticleView({ article }: Readonly<{ article: PublicArticleFull }>) {
    const { m } = useMarketing();
    const r = m.learnPage.reading;
    const color = getLevelMeta(article.level).color;
    const [active, setActive] = useState<number | null>(null);
    const [seen, setSeen] = useState<Set<number>>(new Set());

    // Overlapping notes would break the slicing; keep the first of any overlap.
    const notes = useMemo(() => {
        const out: PublicArticleFull["notes"] = [];
        let end = 0;
        for (const n of article.notes) {
            if (n.start >= end) {
                out.push(n);
                end = n.end;
            }
        }
        return out;
    }, [article.notes]);

    const parts = useMemo(() => {
        const out: { text: string; note?: number }[] = [];
        let cursor = 0;
        notes.forEach((n, i) => {
            if (n.start > cursor) out.push({ text: article.content.slice(cursor, n.start) });
            out.push({ text: article.content.slice(n.start, n.end), note: i });
            cursor = n.end;
        });
        if (cursor < article.content.length) out.push({ text: article.content.slice(cursor) });
        return out;
    }, [article.content, notes]);

    const select = (i: number) => {
        setActive(i);
        setSeen((s) => new Set(s).add(i));
    };
    const note = active === null ? null : notes[active];
    const quiz = asQuiz(article);
    const chip = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

    return (
        <div className="bg-background px-4 py-8 sm:px-6 sm:py-10" style={levelThemeVars(color)}>
            <div className="mx-auto max-w-5xl space-y-6">
                <Link href="/learn/reading" className="inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    ← {r.back}
                </Link>

                <header className="relative overflow-hidden rounded-3xl bg-card shadow-card">
                    <div className="relative aspect-[3/1] w-full overflow-hidden sm:aspect-[4/1]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getArticleImageSrc(article.imageUrl, article.level)} alt="" className="size-full object-cover" />
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`${chip} text-white`} style={{ backgroundColor: color }}>
                                    {article.level}
                                </span>
                                {article.categoryTitle && <span className={`${chip} bg-white/20 text-white`}>{article.categoryTitle}</span>}
                                <span className={`${chip} bg-white text-foreground`}>{m.learnPage.previewNote}</span>
                            </div>
                            <h1 lang="de" className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
                                {article.title}
                            </h1>
                        </div>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                    <article className="rounded-3xl bg-card p-6 shadow-card sm:p-8">
                        <p className="mb-4 text-sm text-foreground/60">{r.tapHint}</p>
                        <p lang="de" dir="ltr" className="whitespace-pre-line text-lg leading-loose text-foreground/90">
                            {parts.map((part, i) =>
                                part.note === undefined ? (
                                    <Fragment key={i}>{part.text}</Fragment>
                                ) : (
                                    <button
                                        key={i}
                                        type="button"
                                        aria-pressed={active === part.note}
                                        onClick={() => select(part.note as number)}
                                        className={`rounded-md px-0.5 font-medium underline decoration-2 underline-offset-4 transition ${active === part.note ? "text-white" : "hover:bg-primary/15"}`}
                                        style={{
                                            textDecorationColor: color,
                                            backgroundColor: active === part.note ? color : seen.has(part.note) ? `${color}26` : undefined,
                                        }}
                                    >
                                        {part.text}
                                    </button>
                                ),
                            )}
                        </p>
                    </article>

                    <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start" aria-live="polite">
                        <div className="rounded-3xl border-2 bg-card p-6 shadow-card" style={{ borderColor: note ? color : undefined }}>
                            {note ? (
                                <div key={active} className="animate-[fade-up_.3s_ease-out] motion-reduce:animate-none">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {note.gender && <span className={`rounded-full px-3 py-1 text-sm font-bold ${GENDER_TONE[note.gender] ?? "bg-muted"}`}>{note.gender}</span>}
                                        <span lang="de" className="text-3xl font-extrabold text-foreground">
                                            {note.surfaceText}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-xl font-semibold" style={{ color }}>
                                        {note.translationEn}
                                    </p>
                                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        {note.pos && (
                                            <div className="rounded-xl bg-muted/70 p-3">
                                                <dt className="text-xs text-foreground/50">{r.type}</dt>
                                                <dd className="font-semibold text-foreground">{r.pos[note.pos] ?? note.pos}</dd>
                                            </div>
                                        )}
                                        {note.lemma && note.lemma !== note.surfaceText && (
                                            <div className="rounded-xl bg-muted/70 p-3">
                                                <dt className="text-xs text-foreground/50">{r.lemma}</dt>
                                                <dd lang="de" className="font-semibold text-foreground">
                                                    {note.lemma}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                    {note.exampleSentence && (
                                        <div className="mt-4 rounded-xl border-s-4 bg-muted/50 p-3" style={{ borderColor: color }}>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{r.example}</p>
                                            <p lang="de" dir="ltr" className="mt-1 italic text-foreground/90">
                                                {note.exampleSentence}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="py-8 text-center text-foreground/60">{r.pickPrompt}</p>
                            )}
                        </div>

                        {notes.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-foreground/70">{r.explored(seen.size, notes.length)}</p>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(seen.size / notes.length) * 100}%`, backgroundColor: color }} />
                                </div>
                            </div>
                        )}

                        {article.keyVocabulary.length > 0 && (
                            <div className="rounded-3xl bg-card p-5 shadow-card">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/60">{r.keyWords}</h2>
                                <ul className="mt-3 space-y-2">
                                    {article.keyVocabulary.map((k) => (
                                        <li key={k.word} className="flex items-baseline justify-between gap-3 text-sm">
                                            <span lang="de" className="font-semibold text-foreground">
                                                {k.word}
                                            </span>
                                            <span className="text-foreground/65">{k.meaning}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </aside>
                </div>

                {quiz.length > 0 && <PublicGrammarQuiz quiz={quiz} lessonLevel={article.level} language="en" />}

                <div className="rounded-3xl bg-card p-6 shadow-card sm:p-7">
                    <h2 className="text-lg font-bold text-foreground">{r.nextTitle}</h2>
                    <p className="mt-1 text-sm text-foreground/65">{r.nextText}</p>
                    <UnlockBanner title={m.learnPage.unlock.title} />
                </div>
            </div>
        </div>
    );
}

