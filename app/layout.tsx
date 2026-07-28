import type { Metadata } from "next";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { getSiteUrl } from "./lib/seo";
import "./globals.css";

const siteName = "Накта суши";
const title = "Доставка суши и роллов в Бишкеке и Оше | Накта суши";
const description =
  "Закажите свежие суши, роллы, сеты, поке и горячие блюда с доставкой в Бишкеке и Оше. Актуальное меню, удобный заказ онлайн и самовывоз.";
const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export async function generateMetadata(): Promise<Metadata> {
  const metadataBase = getSiteUrl();

  return {
    metadataBase,
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    applicationName: siteName,
    keywords: [
      "доставка суши",
      "суши Бишкек",
      "суши Ош",
      "роллы Бишкек",
      "роллы Ош",
      "заказать суши",
      "доставка роллов",
      "сеты",
      "поке",
    ],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    alternates: {
      canonical: "/",
      languages: { "ru-KG": "/" },
    },
    icons: {
      icon: [{ url: "/favicon.jpeg", type: "image/jpeg" }],
      shortcut: "/favicon.jpeg",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/",
      siteName,
      locale: "ru_KG",
      images: [{
        url: "/og-social-v2.png",
        width: 1200,
        height: 630,
        alt: "Накта суши — доставка суши и роллов",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-social-v2.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <GoogleAnalytics measurementId={googleAnalyticsId} />
        {children}
      </body>
    </html>
  );
}
