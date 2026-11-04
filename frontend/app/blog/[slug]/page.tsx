import type { Metadata } from "next";
import BlogPostClient from "@/componenets/blog/BlogPostClient";
import { getBlogImageSrc } from "@/componenets/blog/blogUtils";
import JsonLd from "@/componenets/seo/JsonLd";
import { fetchBlogPost } from "@/lib/serverApi";
import { absoluteUrl, breadcrumbJsonLd, noIndexMetadata, OG_IMAGE, publicPageMetadata, SITE_NAME, toDescription } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) return noIndexMetadata;

  const path = `/blog/${encodeURIComponent(post.slug)}`;
  const base = publicPageMetadata({
    title: post.title,
    description: toDescription(post.excerpt || post.content, "Read this article on the DeutschCertify blog."),
    path,
  });
  const image = getBlogImageSrc(post.imageUrl);
  const images = image ? [{ url: absoluteUrl(image), alt: post.title }] : [OG_IMAGE];
  return {
    ...base,
    title: { absolute: `${post.title} | ${SITE_NAME}` },
    openGraph: { ...base.openGraph, type: "article", publishedTime: post.publishedAt ?? undefined, authors: post.authorName ? [post.authorName] : undefined, images },
    twitter: { ...base.twitter, images: images.map((i) => i.url) },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  const path = `/blog/${encodeURIComponent(slug)}`;
  const image = post ? getBlogImageSrc(post.imageUrl) : null;

  return (
    <>
      {post && (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              description: toDescription(post.excerpt || post.content, post.title),
              image: image ? [absoluteUrl(image)] : [absoluteUrl(OG_IMAGE.url)],
              datePublished: post.publishedAt ?? undefined,
              author: { "@type": post.authorName ? "Person" : "Organization", name: post.authorName ?? SITE_NAME },
              publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl("/favicon-512.png") } },
              mainEntityOfPage: absoluteUrl(path),
              articleSection: post.category ?? undefined,
              inLanguage: "en",
            }}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: post.title, path },
            ])}
          />
        </>
      )}
      <BlogPostClient slug={slug} />
    </>
  );
}
