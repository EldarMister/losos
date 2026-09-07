import type { Metadata } from "next";
import { JsonLd } from "./components/JsonLd";
import { Storefront } from "./components/Storefront";
import { absoluteUrl } from "./lib/seo";

export const metadata: Metadata = {
  title: "Доставка суши и роллов в Бишкеке и Оше",
  description:
    "Закажите свежие суши, роллы, сеты, поке и горячие блюда с доставкой в Бишкеке и Оше. Выберите блюда в меню и оформите заказ онлайн.",
  alternates: {
    canonical: "/",
    languages: { "ru-KG": "/" },
  },
};

export default function Home() {
  const websiteId = `${absoluteUrl("/")}#website`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": websiteId,
              url: absoluteUrl("/"),
              name: "Накта суши",
              description: metadata.description,
              inLanguage: "ru-KG",
              publisher: {
                "@type": "Person",
                name: "ФЛЮРА МАДАМИНЖАНОВНА БАТЫРОВА",
              },
            },
            {
              "@type": "WebPage",
              "@id": `${absoluteUrl("/")}#webpage`,
              url: absoluteUrl("/"),
              name: metadata.title,
              description: metadata.description,
              inLanguage: "ru-KG",
              isPartOf: { "@id": websiteId },
            },
          ],
        }}
      />
      <Storefront />
    </>
  );
}
