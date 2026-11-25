import type { Metadata } from "next";
import { InfoPage } from "../components/InfoPage";
import { contactPhoneHref, instagramHref } from "../lib/site-settings";
import { getSiteContacts } from "../lib/site-settings-server";

export const metadata: Metadata = {
  title: "Поддержка",
  description: "Контакты поддержки Накта суши по заказам, оплате и доставке.",
  alternates: { canonical: "/support" },
};
export const dynamic = "force-dynamic";

type RegionContact = {
  slug: string;
  name: string;
  contactPhone?: string;
  supportPhone?: string;
  supportUrl?: string;
  contactEmail?: string;
  contactAddress?: string;
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://losos-production.up.railway.app/api")
).replace(/\/$/, "");

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
  const contactsForSite = await getSiteContacts(selected?.slug);
  const phone = contactsForSite.phone;
  const supportHref = selected?.supportUrl?.trim() || contactPhoneHref(phone);
  const email = contactsForSite.email;
  return (
    <InfoPage title="Поддержка" action={{ label: selected?.supportUrl?.trim() ? "Написать в поддержку" : "Позвонить нам", href: supportHref }}>
      <p>Поможем с заказом, оплатой, доставкой и работой приложения Накта суши.</p>
      <h2>Как связаться</h2>
      {selected ? <p>Город: {selected.name}</p> : null}
      <p>{selected?.supportUrl?.trim() ? <>Поддержка: <a href={supportHref}>Открыть чат</a><br /></> : null}Телефон: <a href={contactPhoneHref(phone)}>{phone}</a><br />Электронная почта: <a href={`mailto:${email}`}>{email}</a></p>
      {contactsForSite.address ? <p>Адрес: {contactsForSite.address}</p> : null}
      {contactsForSite.instagram ? <p>Instagram: <a href={instagramHref(contactsForSite.instagram)} target="_blank" rel="noopener noreferrer">@{contactsForSite.instagram}</a></p> : null}
      <p>Для быстрого решения вопроса подготовьте номер заказа и телефон, с которого он был оформлен.</p>
    </InfoPage>
  );
}
