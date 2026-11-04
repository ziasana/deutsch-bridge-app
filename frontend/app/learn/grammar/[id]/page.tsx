import type { Metadata } from "next";
import JsonLd from "@/componenets/seo/JsonLd";
import PublicLessonClient from "@/componenets/marketing/learn/PublicLessonClient";
import { fetchFreeLessonIds, fetchLesson } from "@/lib/serverApi";
import { absoluteUrl, breadcrumbJsonLd, noIndexMetadata, publicPageMetadata, SITE_NAME, toDescription } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

// Only free lessons are prerendered; locked ones are not indexable pages.
export async function generateStaticParams() {
  return [...new Set(await fetchFreeLessonIds())].map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lesson = await fetchLesson(id);
  if (!lesson) return noIndexMetadata;

  const title = `${lesson.title} (${lesson.level} German grammar)`;
  return {
    ...publicPageMetadata({
    title,
    description: toDescription(lesson.summary || lesson.content, `Learn ${lesson.title} in German with clear explanations, examples and a quiz.`),
    path: `/learn/grammar/${encodeURIComponent(id)}`,
    }),
    title: { absolute: `${title} | ${SITE_NAME}` },
  };
}

export default async function GrammarLessonPage({ params }: Props) {
  const { id } = await params;
  const lesson = await fetchLesson(id);
  const path = `/learn/grammar/${encodeURIComponent(id)}`;

  return (
    <>
      {lesson && (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "LearningResource",
              name: lesson.title,
              description: toDescription(lesson.summary || lesson.content, lesson.title),
              educationalLevel: lesson.level,
              learningResourceType: "Grammar lesson",
              teaches: lesson.title,
              inLanguage: "en",
              isAccessibleForFree: true,
              provider: { "@type": "Organization", name: SITE_NAME },
              url: absoluteUrl(path),
            }}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Learn", path: "/learn" },
              { name: "Grammar", path: "/learn/grammar" },
              { name: lesson.title, path },
            ])}
          />
        </>
      )}
      <PublicLessonClient id={id} />
    </>
  );
}
