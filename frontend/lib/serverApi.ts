import { BACKEND_ORIGIN } from "@/lib/backendOrigin";
import type { BlogPostDetail, BlogPostPage } from "@/types/blog";
import type { PublicArticleFull, PublicArticlePage, PublicGrammarFull, PublicGrammarLevelView } from "@/types/publicLearn";

/** Build/server-side reads of the public API, used for metadata, JSON-LD and the sitemap. Any failure (404, 403 for a locked item, backend down) yields null. */
const REVALIDATE_SECONDS = 600;

async function fetchPublic<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${BACKEND_ORIGIN}/api${path}`, { next: { revalidate: REVALIDATE_SECONDS } });
        return res.ok ? ((await res.json()) as T) : null;
    } catch {
        return null;
    }
}

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const fetchBlogPost = (slug: string) => fetchPublic<BlogPostDetail>(`/public/blog/${encodeURIComponent(slug)}`);
export const fetchArticle = (id: string) => fetchPublic<PublicArticleFull>(`/public/learn/reading/${encodeURIComponent(id)}`);
export const fetchLesson = (id: string) => fetchPublic<PublicGrammarFull>(`/public/learn/grammar/${encodeURIComponent(id)}`);

export async function fetchAllBlogPosts() {
    const first = await fetchPublic<BlogPostPage>("/public/blog?page=0&size=100");
    if (!first) return [];
    const posts = [...first.posts];
    for (let page = 1; page < first.totalPages; page++) {
        const next = await fetchPublic<BlogPostPage>(`/public/blog?page=${page}&size=100`);
        if (next) posts.push(...next.posts);
    }
    return posts;
}

/** Ids of the articles open to everyone; locked ones are not indexable. */
export async function fetchFreeArticleIds(): Promise<{ id: string; level: string }[]> {
    const pages = await Promise.all(LEVELS.map((level) => fetchPublic<PublicArticlePage>(`/public/learn/reading?level=${level}&page=0&size=100`)));
    return pages.flatMap((p) => p?.items.filter((a) => a.free).map((a) => ({ id: a.id, level: a.level })) ?? []);
}

export async function fetchFreeLessonIds(): Promise<string[]> {
    const views = await Promise.all(LEVELS.map((level) => fetchPublic<PublicGrammarLevelView>(`/public/learn/grammar?level=${level}`)));
    return views.flatMap((v) => (v ? [...v.categories.flatMap((c) => c.lessons), ...v.uncategorized] : []).filter((l) => l.free).map((l) => l.id));
}
