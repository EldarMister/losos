import type { Metadata } from "next";
import { JsonLd } from "../../components/JsonLd";
import { Storefront } from "../../components/Storefront";
import { absoluteUrl, getSeoCategory } from "../../lib/seo";

type CategoryPageProps = { params: Promise<{ slug: string }> };

const categoryDescription = (title: string) =>
  `Закажите ${title.toLocaleLowerCase("ru-RU")} с доставкой в Бишкеке и Оше. Актуальные цены, состав блюд и удобное оформление заказа онлайн в Накта суши.`;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getSeoCategory(slug);

  if (!category) {
    return {
      title: "Категория меню",
      robots: { index: false, follow: true },
    };
  }

  const title = `${category.title} с доставкой в Бишкеке и Оше`;
  const description = categoryDescription(category.title);
  const canonicalPath = `/category/${encodeURIComponent(category.slug)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: { "ru-KG": canonicalPath },
    },
    openGraph: {
      title: `${title} | Накта суши`,
      description,
      type: "website",
      url: canonicalPath,
      siteName: "Накта суши",
      locale: "ru_KG",
      images: [{
        url: "/og-social-v2.png",
        width: 1200,
        height: 630,
        alt: `${category.title} — Накта суши`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Накта суши`,
      description,
      images: ["/og-social-v2.png"],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getSeoCategory(slug);

  return (
    <>
      {category ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                "@id": `${absoluteUrl(`/category/${encodeURIComponent(category.slug)}`)}#webpage`,
                url: absoluteUrl(`/category/${encodeURIComponent(category.slug)}`),
                name: `${category.title} с доставкой`,
                description: categoryDescription(category.title),
                inLanguage: "ru-KG",
                isPartOf: { "@id": `${absoluteUrl("/")}#website` },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Меню",
                    item: absoluteUrl("/"),
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: category.title,
                    item: absoluteUrl(`/category/${encodeURIComponent(category.slug)}`),
                  },
                ],
              },
            ],
          }}
        />
      ) : null}
      <Storefront categorySlug={slug} />
    </>
  );
}
