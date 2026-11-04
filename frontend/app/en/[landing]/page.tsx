import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPageView from "@/componenets/seo/LandingPageView";
import type { LandingPage } from "@/lib/landingPages";
import { LANDING_PAGES_EN, getLandingPageEn } from "@/lib/landingPagesEn";
import { publicPageMetadata } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => LANDING_PAGES_EN.map((p) => ({ landing: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ landing: string }> }): Promise<Metadata> {
  const page = getLandingPageEn((await params).landing);
  if (!page) return {};
  return publicPageMetadata({
    title: page.title,
    description: page.description,
    path: `/en/${page.slug}`,
    languages: { de: `/${page.deSlug}`, en: `/en/${page.slug}`, "x-default": `/${page.deSlug}` },
  });
}

export default async function EnglishLandingPage({ params }: { params: Promise<{ landing: string }> }) {
  const page = getLandingPageEn((await params).landing);
  if (!page) notFound();
  return <LandingPageView page={page as unknown as LandingPage} locale="en" />;
}
