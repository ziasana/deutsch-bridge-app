import type { ReactNode } from "react";
import JsonLd from "@/componenets/seo/JsonLd";
import { marketingDictionaries } from "@/lib/i18n/marketing";
import { faqJsonLd, publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Pricing",
  description: "Compare DeutschCertify plans. Start free and upgrade for full mock exams, AI feedback and the complete German learning library.",
  path: "/pricing",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={faqJsonLd(marketingDictionaries.en.pricing.faqs)} />
      {children}
    </>
  );
}
