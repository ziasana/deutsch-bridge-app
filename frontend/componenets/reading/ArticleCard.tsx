"use client";

import { ArrowRight, Bookmark, Check, Eye, RotateCw, Sparkles } from "lucide-react";
import { getArticleImageSrc } from "@/lib/readingImages";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";
import { ReadingArticleSummary } from "@/types/reading";
import { CSSProperties } from "react";

interface ArticleCardProps {
    article: ReadingArticleSummary;
    /** The wide "up next" card: image beside the text and a label on top. */
    featured?: boolean;
    featuredLabel?: string;
    quizLabel: string;
    reviewLabel: string;
    newWordsLabel: (count: number) => string;
    viewsLabel: (count: number) => string;
    dateLabel: string;
    onOpen: (id: string) => void;
}

/**
 * One reading text as a card: picture with the level badge, a check once learned, the new-word count, then title,
 * topic and a clear call to action. The card lifts on hover and its accent follows the level colour.
 */
export default function ArticleCard({ article, featured = false, featuredLabel, quizLabel, reviewLabel, newWordsLabel, viewsLabel, dateLabel, onOpen }: Readonly<ArticleCardProps>) {
    const color = getLevelMeta(article.level).color;
    const learned = article.learned;
    return (
        <article
            role="button"
            tabIndex={0}
            aria-label={article.title}
            onClick={() => onOpen(article.id)}
            onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onOpen(article.id);
                }
            }}
            style={{ "--lc": color } as CSSProperties}
            className={cn(
                "group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-card shadow-card ring-2 transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-primary",
                learned ? "ring-[var(--lc)]/40" : "ring-transparent hover:ring-[var(--lc)]/30",
                featured && "sm:col-span-2 sm:flex-row",
            )}
        >
            <div className={cn("relative shrink-0 overflow-hidden", featured ? "aspect-[16/9] sm:aspect-auto sm:w-1/2" : "aspect-[16/9]")}>
                <img
                    src={getArticleImageSrc(article.thumbnailUrl ?? article.imageUrl, article.level)}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
                <span className="absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold text-white shadow-sm" style={{ backgroundColor: color }}>
                    {article.level}
                </span>
                {learned ? (
                    <span className="absolute end-3 top-3 flex size-8 items-center justify-center rounded-full text-white shadow-md" style={{ backgroundColor: color }}>
                        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                    </span>
                ) : (
                    article.bookmarked && (
                        <span className="absolute end-3 top-3 flex size-8 items-center justify-center rounded-full bg-card/90 text-primary shadow-md">
                            <Bookmark className="size-4 fill-current" aria-hidden="true" />
                        </span>
                    )
                )}
                {article.newWordCount > 0 && (
                    <span className="absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <Sparkles className="size-3.5 text-amber-300" aria-hidden="true" />
                        {newWordsLabel(article.newWordCount)}
                    </span>
                )}
            </div>

            <div className={cn("flex flex-1 flex-col gap-2 p-4 sm:p-5", featured && "sm:justify-center sm:p-7")}>
                {featured && featuredLabel && <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color }}>{featuredLabel}</p>}
                {article.categoryTitle && (
                    <span className="w-fit rounded-full bg-[var(--lc)]/10 px-2.5 py-0.5 text-xs font-semibold" style={{ color }}>
                        {article.categoryTitle}
                    </span>
                )}
                <h3 className={cn("font-bold leading-snug text-foreground", featured ? "text-2xl" : "line-clamp-2 text-lg")}>{article.title}</h3>
                <p className="flex flex-wrap items-center gap-x-3 text-xs text-foreground/50">
                    <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" aria-hidden="true" />
                        {viewsLabel(article.viewCount).replace("👁 ", "")}
                    </span>
                    <span>{dateLabel}</span>
                </p>
                <div className="mt-auto pt-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpen(article.id);
                        }}
                        className={cn(
                            "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            featured && "sm:w-fit sm:px-6",
                            learned ? "bg-[var(--lc)]/10 hover:bg-[var(--lc)]/20" : "text-white shadow-sm hover:opacity-90",
                        )}
                        style={learned ? { color } : { backgroundColor: color }}
                    >
                        {learned ? (
                            <>
                                <RotateCw className="size-4" aria-hidden="true" />
                                {reviewLabel}
                            </>
                        ) : (
                            <>
                                {quizLabel}
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}
