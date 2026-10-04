"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Clock, Link2, Newspaper } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import useAuthStore from "@/store/useAuthStore";
import BlogCard from "@/componenets/blog/BlogCard";
import BlogMarkdown from "@/componenets/blog/BlogMarkdown";
import { authorInitial, formatBlogDate, getBlogImageSrc } from "@/componenets/blog/blogUtils";
import { getBlogPostBySlug } from "@/services/blogService";
import { toast } from "@/lib/toast";

/** Thin reading-progress bar pinned to the top of the viewport. */
function ReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
        };
        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, []);

    return (
        <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent" aria-hidden="true">
            <div className="h-full bg-primary transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
    );
}

function BlogPostContent() {
    const { t, language, dir } = useI18n();
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const slug = useSearchParams().get("slug");
    const [copied, setCopied] = useState(false);

    const { data: post, isPending, isError } = useQuery({
        queryKey: ["blog", "post", slug],
        queryFn: () => getBlogPostBySlug(slug as string).then((res) => res.data),
        enabled: Boolean(slug),
        retry: false,
    });

    useEffect(() => {
        if (post) document.title = `${post.title} | DeutschBridge`;
    }, [post]);

    const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            toast.success(t.blogPage.linkCopied);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard can be unavailable (insecure context / denied) - nothing useful to do.
        }
    };

    if (!slug || isError) {
        return (
            <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-20 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-accent text-primary">
                    <Newspaper className="size-8" />
                </span>
                <h1 className="text-3xl font-bold text-foreground">{t.blogPage.notFoundTitle}</h1>
                <p className="max-w-md text-foreground/70">{t.blogPage.notFoundText}</p>
                <Link href="/blog" className="btn-primary rounded-xl px-6 py-3">
                    {t.blogPage.backToAll}
                </Link>
            </div>
        );
    }

    if (isPending || !post) {
        return (
            <div className="container mx-auto max-w-3xl animate-pulse px-6 py-20">
                <div className="mb-6 h-4 w-24 rounded bg-muted" />
                <div className="mb-4 h-10 w-full rounded bg-muted" />
                <div className="mb-10 h-10 w-2/3 rounded bg-muted" />
                <div className="mb-10 aspect-[16/9] rounded-3xl bg-muted" />
                <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-4 w-full rounded bg-muted" />
                    ))}
                </div>
            </div>
        );
    }

    const image = getBlogImageSrc(post.imageUrl);

    return (
        <article>
            <ReadingProgress />

            <header className="bg-gradient-to-b from-accent/60 to-background">
                <div className="container mx-auto max-w-3xl px-6 pb-10 pt-10 md:pt-14">
                    <Link
                        href="/blog"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-foreground/70 transition hover:text-primary"
                    >
                        <BackIcon className="size-4" />
                        {t.blogPage.backToAll}
                    </Link>

                    {post.category && (
                        <span className="mb-4 block w-fit rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-card">
                            {post.category}
                        </span>
                    )}

                    <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl md:leading-[1.15]">
                        {post.title}
                    </h1>

                    {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-foreground/70 md:text-xl">{post.excerpt}</p>}

                    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-foreground/70">
                        <span className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                                {authorInitial(post.authorName)}
                            </span>
                            <span className="flex flex-col leading-tight">
                                <span className="font-semibold text-foreground">{post.authorName ?? "DeutschBridge"}</span>
                                <span>{formatBlogDate(post.publishedAt, language)}</span>
                            </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 shadow-card">
                            <Clock className="size-3.5" />
                            {t.blogPage.minRead(post.readingMinutes)}
                        </span>
                    </div>
                </div>
            </header>

            {image && (
                <div className="container mx-auto max-w-5xl px-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt={post.title}
                        className="aspect-[16/9] w-full rounded-3xl object-cover shadow-lg"
                    />
                </div>
            )}

            <div className="container mx-auto max-w-3xl px-6 py-12 md:py-16">
                <BlogMarkdown content={post.content} />

                <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                    <span className="text-sm font-medium text-foreground/70">{t.blogPage.shareLabel}</span>
                    <button
                        type="button"
                        onClick={copyLink}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                    >
                        {copied ? <Check className="size-4 text-primary" /> : <Link2 className="size-4" />}
                        {copied ? t.blogPage.linkCopied : t.blogPage.copyLink}
                    </button>
                </div>

                {!isLoggedIn && (
                    <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-primary-foreground shadow-lg md:p-10">
                        <h2 className="text-2xl font-bold md:text-3xl">{t.blogPage.ctaTitle}</h2>
                        <p className="max-w-xl text-primary-foreground/85">{t.blogPage.ctaText}</p>
                        <Link
                            href="/signup"
                            className="rounded-xl bg-card px-6 py-3 font-semibold text-primary transition hover:scale-105"
                        >
                            {t.blogPage.ctaButton}
                        </Link>
                    </div>
                )}
            </div>

            {post.related.length > 0 && (
                <section className="border-t border-border bg-accent/30">
                    <div className="container mx-auto px-6 py-16">
                        <h2 className="mb-8 text-2xl font-bold text-foreground md:text-3xl">{t.blogPage.related}</h2>
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                            {post.related.map((related) => (
                                <BlogCard key={related.slug} post={related} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </article>
    );
}

export default function BlogPostPage() {
    return (
        <Suspense fallback={null}>
            <BlogPostContent />
        </Suspense>
    );
}
