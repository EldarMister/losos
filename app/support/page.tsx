import type { Metadata } from "next";
import { InfoPage } from "../components/InfoPage";

export const metadata: Metadata = { title: "Поддержка" };
export const dynamic = "force-dynamic";

type RegionContact = {
  slug: string;
  name: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://losos-production.up.railway.app/api")
).replace(/\/$/, "");

function phoneHref(value: string) {
  return `tel:${value.replace(/[^+\d]/g, "")}`;
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region: requestedRegion } = await searchParams;
  let contacts: RegionContact[] = [];
  try {
    const response = await fetch(`${API_URL}/regions`, { cache: "no-store" });
    if (response.ok) contacts = await response.json() as RegionContact[];
  } catch {
    // Static fallback keeps the page usable while the API is unavailable.
  }
  const selected = contacts.find((region) => region.slug === requestedRegion) || contacts[0];
  const phone = selected?.contactPhone?.trim() || "0503 178 916";
  const email = selected?.contactEmail?.trim() || "musaev.janybek.kg@gmail.com";
  return (
    <InfoPage title="Поддержка" action={{ label: "Позвонить нам", href: phoneHref(phone) }}>
      <p>Поможем с заказом, оплатой, доставкой и работой приложения Накта суши.</p>
      <h2>Как связаться</h2>
      {selected ? <p>Город: {selected.name}</p> : null}
      <p>Телефон: <a href={phoneHref(phone)}>{phone}</a><br />Электронная почта: <a href={`mailto:${email}`}>{email}</a></p>
      {selected?.contactAddress ? <p>Адрес: {selected.contactAddress}</p> : null}
      <p>Для быстрого решения вопроса подготовьте номер заказа и телефон, с которого он был оформлен.</p>
    </InfoPage>
  );
}
