"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import BlogCard from "@/componenets/blog/BlogCard";
import BlogCardSkeleton from "@/componenets/blog/BlogCardSkeleton";
import { getBlogCategories, getPublishedBlogPosts } from "@/services/blogService";

const PAGE_SIZE = 9;

export default function BlogIndexPage() {
    const { t, dir } = useI18n();
    const [category, setCategory] = useState<string | null>(null);
    const [page, setPage] = useState(0);

    useEffect(() => {
        document.title = `${t.blogPage.indexBadge} | DeutschBridge`;
    }, [t.blogPage.indexBadge]);

    const { data: categories = [] } = useQuery({
        queryKey: ["blog", "categories"],
        queryFn: () => getBlogCategories().then((res) => res.data),
        staleTime: 5 * 60 * 1000,
    });

    const { data, isPending, isError, refetch } = useQuery({
        queryKey: ["blog", "list", category, page],
        queryFn: () => getPublishedBlogPosts(page, PAGE_SIZE, category ?? undefined).then((res) => res.data),
        placeholderData: (previous) => previous,
    });

    const selectCategory = (next: string | null) => {
        setCategory(next);
        setPage(0);
    };

    const goToPage = (next: number) => {
        setPage(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const posts = data?.posts ?? [];
    const totalPages = data?.totalPages ?? 0;
    const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
    const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;
    // The newest post gets a wide hero card, but only on the unfiltered first page.
    const featureFirst = page === 0 && category === null && posts.length > 1;

    return (
        <div className="bg-background">
            <section className="bg-gradient-to-b from-accent/60 to-background">
                <div className="container mx-auto flex flex-col items-center gap-4 px-6 py-16 text-center md:py-20">
                    <h1 className="max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-5xl">
                        {t.blogPage.indexTitle}
                    </h1>
                    <p className="max-w-2xl text-lg text-foreground/70">{t.blogPage.indexSubtitle}</p>
                </div>
            </section>

            <section className="container mx-auto px-6 pb-20">
                {categories.length > 0 && (
                    <div className="-mt-2 mb-10 flex flex-wrap items-center justify-center gap-2">
                        {[null, ...categories].map((name) => {
                            const active = name === category;
                            return (
                                <button
                                    key={name ?? "__all"}
                                    type="button"
                                    onClick={() => selectCategory(name)}
                                    aria-pressed={active}
                                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                                        active
                                            ? "border-primary bg-primary text-primary-foreground shadow-card"
                                            : "border-border bg-card text-foreground/70 hover:border-primary/50 hover:text-primary"
                                    }`}
                                >
                                    {name ?? t.blogPage.allCategories}
                                </button>
                            );
                        })}
                    </div>
                )}

                {isError && !data && (
                    <div className="mx-auto max-w-md rounded-2xl bg-card p-8 text-center shadow-card">
                        <p className="text-foreground/70">{t.blogPage.loadError}</p>
                        <button type="button" onClick={() => refetch()} className="btn-primary mt-4 rounded-xl px-5 py-2">
                            {t.blogPage.retry}
                        </button>
                    </div>
                )}

                {isPending && (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, i) => (
                            <BlogCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {!isPending && !isError && posts.length === 0 && (
                    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-card p-12 text-center shadow-card">
                        <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
                            <Newspaper className="size-7" />
                        </span>
                        <h2 className="text-xl font-semibold text-foreground">{t.blogPage.emptyTitle}</h2>
                        <p className="text-foreground/70">{t.blogPage.emptyText}</p>
                    </div>
                )}

                {posts.length > 0 && (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post, index) => (
                            <BlogCard key={post.slug} post={post} featured={featureFirst && index === 0} />
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
                        <button
                            type="button"
                            disabled={page === 0}
                            onClick={() => goToPage(page - 1)}
                            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-40"
                        >
                            <PrevIcon className="size-4" />
                            {t.blogPage.previous}
                        </button>
                        <span className="text-sm text-foreground/60">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages - 1}
                            onClick={() => goToPage(page + 1)}
                            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-40"
                        >
                            {t.blogPage.next}
                            <NextIcon className="size-4" />
                        </button>
                    </nav>
                )}
            </section>
        </div>
    );
}
