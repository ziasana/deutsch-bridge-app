"use client";

import Link from "next/link";
import { ArrowRight, Clock, Newspaper } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import type { BlogPostSummary } from "@/types/blog";
import { authorInitial, formatBlogDate, getBlogImageSrc } from "./blogUtils";

/** Card used on the home page, the /blog index and the "keep reading" strip. `featured` makes it a wide hero card. */
export default function BlogCard({ post, featured = false }: Readonly<{ post: BlogPostSummary; featured?: boolean }>) {
    const { t, language, dir } = useI18n();
    const image = getBlogImageSrc(post.imageUrl);
    const href = `/blog/post?slug=${encodeURIComponent(post.slug)}`;

    return (
        <article
            className={`group flex overflow-hidden rounded-2xl bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                featured ? "flex-col lg:col-span-3 lg:flex-row" : "flex-col"
            }`}
        >
            <Link
                href={href}
                tabIndex={-1}
                aria-hidden="true"
                className={`relative block shrink-0 overflow-hidden ${featured ? "aspect-[16/9] lg:aspect-auto lg:w-3/5" : "aspect-[16/9]"}`}
            >
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/25 via-accent to-primary/10 text-primary/60">
                        <Newspaper className="size-12" />
                    </div>
                )}
                {post.category && (
                    <span className="absolute start-4 top-4 rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-card">
                        {post.category}
                    </span>
                )}
            </Link>

            <div className={`flex flex-1 flex-col gap-3 p-6 ${featured ? "lg:justify-center lg:p-10" : ""}`}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/60">
                    <span>{formatBlogDate(post.publishedAt, language)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {t.blogPage.minRead(post.readingMinutes)}
                    </span>
                </div>

                <h3 className={`font-semibold leading-snug text-foreground ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}>
                    <Link href={href} className="transition-colors group-hover:text-primary">
                        {post.title}
                    </Link>
                </h3>

                {post.excerpt && (
                    <p className={`text-foreground/70 ${featured ? "line-clamp-4 text-base" : "line-clamp-3 text-sm"}`}>
                        {post.excerpt}
                    </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="flex items-center gap-2 text-sm text-foreground/70">
                        <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                            {authorInitial(post.authorName)}
                        </span>
                        {post.authorName ?? "DeutschBridge"}
                    </span>
                    <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        {t.blogPage.readMore}
                        <ArrowRight
                            className={`size-4 transition-transform group-hover:translate-x-1 ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : ""}`}
                        />
                    </Link>
                </div>
            </div>
        </article>
    );
}
