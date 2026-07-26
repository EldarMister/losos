import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "Накта суши | Суши, пиццы, роллы";
const description = "Доставка свежих роллов, суши, поке и горячих блюд.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const previewImage = new URL("/og-social-v2.png", metadataBase).toString();

  return {
    title,
    description,
    metadataBase,
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: previewImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [previewImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
