import HomeClient from "@/componenets/marketing/HomeClient";
import JsonLd from "@/componenets/seo/JsonLd";
import { marketingDictionaries } from "@/lib/i18n/marketing";
import { faqJsonLd, softwareApplicationJsonLd } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(marketingDictionaries.en.home.faq.items)} />
      <HomeClient />
    </>
  );
}
