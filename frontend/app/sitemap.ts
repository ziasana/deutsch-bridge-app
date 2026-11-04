import type { MetadataRoute } from "next";
import { fetchAllBlogPosts, fetchFreeArticleIds, fetchFreeLessonIds } from "@/lib/serverApi";
import { SITE_URL } from "@/lib/seo";

// Static export: generated at build time, so redeploy after publishing new content.
export const dynamic = "force-static";

const STATIC_PATHS: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/exams", priority: 0.9 },
  { path: "/exams/telc", priority: 0.9 },
  { path: "/exams/dtz", priority: 0.9 },
  { path: "/mock-test", priority: 0.8 },
  { path: "/features", priority: 0.7 },
  { path: "/pricing", priority: 0.7 },
  { path: "/learn", priority: 0.8 },
  { path: "/learn/reading", priority: 0.7 },
  { path: "/learn/grammar", priority: 0.7 },
  { path: "/learn/expressions", priority: 0.7 },
  { path: "/learn/redemittel", priority: 0.7 },
  { path: "/blog", priority: 0.7 },
  { path: "/contact", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, articles, lessons] = await Promise.all([fetchAllBlogPosts(), fetchFreeArticleIds(), fetchFreeLessonIds()]);
  const now = new Date();

  return [
    ...STATIC_PATHS.map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, lastModified: now, priority })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`,
      lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
      priority: 0.6,
    })),
    ...articles.map((a) => ({ url: `${SITE_URL}/learn/reading/${encodeURIComponent(a.id)}`, lastModified: now, priority: 0.5 })),
    ...[...new Set(lessons)].map((id) => ({ url: `${SITE_URL}/learn/grammar/${encodeURIComponent(id)}`, lastModified: now, priority: 0.5 })),
  ];
}
