import type { Metadata } from "next";

export const SITE_URL = "https://deutschcertify.com";
export const SITE_NAME = "DeutschCertify";
export const SITE_TAGLINE = "Your Path to German Proficiency";
export const DEFAULT_TITLE = "DeutschCertify – Learn German Online from A1 to C1";
export const DEFAULT_DESCRIPTION =
  "Learn German online with interactive vocabulary, grammar, reading, listening and exam preparation exercises. Prepare for TELC and DTZ with DeutschCertify.";
export const SUPPORTED_LANGUAGES = ["de", "en", "fa"] as const;

/** Target keywords per public route (one distinct search intent each). Documentation/planning only: the meta keywords tag is not used. */
export const ROUTE_KEYWORDS: Record<string, { primary: string; secondary: string[] }> = {
  "/": { primary: "Deutsch lernen online", secondary: ["German learning app", "German language learning", "Deutsch lernen kostenlos"] },
  "/exams/telc": { primary: "TELC B1 Vorbereitung", secondary: ["TELC B1 Übungen", "B1 Sprachbausteine Übungen", "B1 Modelltest"] },
  "/exams/dtz": { primary: "DTZ B1 Prüfung Vorbereitung", secondary: ["Deutsch Prüfung online üben"] },
  "/exams": { primary: "Deutsch Prüfung online üben", secondary: ["telc oder DTZ"] },
  "/learn/reading": { primary: "B1 Leseverstehen Übungen", secondary: ["Deutsch B1 Übungen"] },
  "/learn/grammar": { primary: "Deutsche Grammatik Übungen", secondary: ["Deutsche Verben mit Präpositionen", "Nomen-Verb-Verbindungen"] },
  "/learn/redemittel": { primary: "Deutsche Redemittel", secondary: ["Redemittel B1 Schreiben"] },
  "/learn/expressions": { primary: "Deutsch Wortschatz lernen", secondary: ["Deutsch C1 Übungen"] },
};

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

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: "German learning and examination preparation platform.",
    inLanguage: ["en", "de", "fa"],
    // The free plan is the only publicly priced offer; Premium has no published price.
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Free plan" },
  };
}
