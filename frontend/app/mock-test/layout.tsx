import type { ReactNode } from "react";
import JsonLd from "@/componenets/seo/JsonLd";
import { marketingDictionaries } from "@/lib/i18n/marketing";
import { faqJsonLd, publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Free German Mock Test",
  description: "Try a free German exam mock test online and see how ready you are for telc or DTZ. Instant results and feedback.",
  path: "/mock-test",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={faqJsonLd(marketingDictionaries.en.mockTest.faqs)} />
      {children}
    </>
  );
}
