import type { Metadata } from "next";
import JsonLd from "@/componenets/seo/JsonLd";
import PublicArticleClient from "@/componenets/marketing/learn/PublicArticleClient";
import { fetchArticle, fetchFreeArticleIds } from "@/lib/serverApi";
import { absoluteUrl, breadcrumbJsonLd, noIndexMetadata, OG_IMAGE, publicPageMetadata, SITE_NAME, toDescription } from "@/lib/seo";
import { resolveUploadUrl } from "@/lib/backendOrigin";

type Props = { params: Promise<{ id: string }> };

// Only free articles are prerendered; locked ones are not indexable pages.
export async function generateStaticParams() {
  return (await fetchFreeArticleIds()).map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await fetchArticle(id);
  // A locked or missing article answers null here: keep it out of search results.
  if (!article) return noIndexMetadata;

  const title = `${article.title} (${article.level} German reading)`;
  const base = publicPageMetadata({
    title,
    description: toDescription(article.content, `Read this ${article.level} German article with vocabulary notes and a short quiz.`),
    path: `/learn/reading/${encodeURIComponent(id)}`,
  });
  const cover = resolveUploadUrl(article.imageUrl);
  const images = cover && /\.(png|jpe?g|webp)(\?|$)/i.test(cover) ? [{ url: absoluteUrl(cover), alt: article.title }] : [OG_IMAGE];
  return { ...base, title: { absolute: `${title} | ${SITE_NAME}` }, openGraph: { ...base.openGraph, images }, twitter: { ...base.twitter, images: images.map((i) => i.url) } };
}

export default async function ReadingArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await fetchArticle(id);
  const path = `/learn/reading/${encodeURIComponent(id)}`;

  return (
    <>
      {article && (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: toDescription(article.content, article.title),
              inLanguage: "de",
              educationalLevel: article.level,
              about: article.categoryTitle ?? undefined,
              publisher: { "@type": "Organization", name: SITE_NAME },
              mainEntityOfPage: absoluteUrl(path),
            }}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Learn", path: "/learn" },
              { name: "Reading", path: "/learn/reading" },
              { name: article.title, path },
            ])}
          />
        </>
      )}
      <PublicArticleClient id={id} />
    </>
  );
}
