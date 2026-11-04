import type { Metadata } from "next";

export const SITE_URL = "https://deutschcertify.com";
export const SITE_NAME = "DeutschCertify";

export const OG_IMAGE = { url: "/og-image.png", width: 1200, height: 630, alt: "DeutschCertify - Your Path to German Proficiency. Learn. Practice. Certify." };

interface PageSeo {
  title: string;
  description: string;
  /** Path starting with "/", used for the canonical URL and og:url. */
  path: string;
}

/** Metadata for an indexable public page: title, description, canonical and social cards. */
export function publicPageMetadata({ title, description, path }: PageSeo): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, title, description, url: path, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

/** Metadata for pages that must not appear in search results (auth, onboarding...). */
export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Plain-text snippet for a meta description: markdown/HTML stripped, whitespace collapsed, cut at a word boundary. */
export function toDescription(text: string | null | undefined, fallback: string, max = 155): string {
    const plain = (text ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/[#*_`>\[\]()!|-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!plain) return fallback;
    if (plain.length <= max) return plain;
    return `${plain.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function absoluteUrl(pathOrUrl: string): string {
    return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
    };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.question, acceptedAnswer: { "@type": "Answer", text: i.answer } })),
  };
}
