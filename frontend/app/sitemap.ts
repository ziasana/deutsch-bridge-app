import type { MetadataRoute } from "next";
import { fetchAllBlogPosts, fetchFreeArticleIds, fetchFreeLessonIds } from "@/lib/serverApi";
import { LANDING_PAGES } from "@/lib/landingPages";
import { LANDING_PAGES_EN } from "@/lib/landingPagesEn";
import { SAMPLE_EXERCISES } from "@/lib/sampleExercises";
import { SITE_URL } from "@/lib/seo";

// Static export: generated at build time, so redeploy after publishing new content.
// lastModified is only emitted where a real content date exists (blog posts); never "now".
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
  { path: "/privacy", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, articles, lessons] = await Promise.all([fetchAllBlogPosts(), fetchFreeArticleIds(), fetchFreeLessonIds()]);

  return [
    ...STATIC_PATHS.map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, priority })),
    ...LANDING_PAGES.map((p) => ({ url: `${SITE_URL}/${p.slug}`, priority: 0.8 })),
    ...LANDING_PAGES_EN.map((p) => ({ url: `${SITE_URL}/en/${p.slug}`, priority: 0.7 })),
    { url: `${SITE_URL}/uebungen`, priority: 0.8 },
    ...SAMPLE_EXERCISES.map((e) => ({ url: `${SITE_URL}/uebungen/${e.slug}`, priority: 0.7 })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`,
      ...(p.publishedAt ? { lastModified: new Date(p.publishedAt) } : {}),
      priority: 0.6,
    })),
    ...articles.map((a) => ({ url: `${SITE_URL}/learn/reading/${encodeURIComponent(a.id)}`, priority: 0.5 })),
    ...[...new Set(lessons)].map((id) => ({ url: `${SITE_URL}/learn/grammar/${encodeURIComponent(id)}`, priority: 0.5 })),
  ];
}
