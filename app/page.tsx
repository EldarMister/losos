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
  const organizationId = `${absoluteUrl("/")}#organization`;
  const websiteId = `${absoluteUrl("/")}#website`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": organizationId,
              name: "Накта суши",
              alternateName: ["Nakta Sushi", "NAKTA SUSHI", "НАКТА СУШИ"],
              legalName: "ФЛЮРА МАДАМИНЖАНОВНА БАТЫРОВА",
              url: absoluteUrl("/"),
              logo: absoluteUrl("/logo.webp"),
              image: absoluteUrl("/og-social-v2.png"),
              email: "naktasushi@gmail.com",
              telephone: "+996503178916",
              areaServed: [
                { "@type": "City", name: "Бишкек" },
                { "@type": "City", name: "Ош" },
              ],
            },
            {
              "@type": "WebSite",
              "@id": websiteId,
              url: absoluteUrl("/"),
              name: "Накта суши",
              alternateName: ["Nakta Sushi", "NAKTA SUSHI", "НАКТА СУШИ"],
              description: metadata.description,
              inLanguage: "ru-KG",
              publisher: { "@id": organizationId },
            },
            {
              "@type": "WebPage",
              "@id": `${absoluteUrl("/")}#webpage`,
              url: absoluteUrl("/"),
              name: metadata.title,
              description: metadata.description,
              inLanguage: "ru-KG",
              isPartOf: { "@id": websiteId },
              about: { "@id": organizationId },
            },
          ],
        }}
      />
      <Storefront />
    </>
  );
}
