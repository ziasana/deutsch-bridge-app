import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPageView from "@/componenets/seo/LandingPageView";
import { LANDING_PAGES, getLandingPage } from "@/lib/landingPages";
import { publicPageMetadata } from "@/lib/seo";

// Static export: only the slugs below exist; anything else is a 404.
export const dynamicParams = false;

export const generateStaticParams = () => LANDING_PAGES.map((p) => ({ landing: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ landing: string }> }): Promise<Metadata> {
  const page = getLandingPage((await params).landing);
  if (!page) return {};
  return publicPageMetadata({
    title: page.title,
    description: page.description,
    path: `/${page.slug}`,
    languages: page.enSlug ? { de: `/${page.slug}`, en: `/en/${page.enSlug}`, "x-default": `/${page.slug}` } : undefined,
  });
}

export default async function LandingPage({ params }: { params: Promise<{ landing: string }> }) {
  const page = getLandingPage((await params).landing);
  if (!page) notFound();
  return <LandingPageView page={page} />;
}
