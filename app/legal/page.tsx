import type { Metadata } from "next";
import { InfoPage } from "../components/InfoPage";
import { SITE_OPERATOR_NAME, SITE_OPERATOR_ADDRESS } from "../lib/site-settings";
import { getSiteContacts } from "../lib/site-settings-server";

export const metadata: Metadata = {
  title: "Правовая информация",
  description: "Правовая информация и документы сервиса Накта суши.",
  alternates: { canonical: "/legal" },
};

export default async function LegalPage() {
  const contacts = await getSiteContacts();
  return (
    <InfoPage title="Правовая информация">
      <p>Здесь собраны документы для сайта и мобильного приложения «Накта суши».</p>
      <h2>Оператор сервиса</h2>
      <p><strong>{SITE_OPERATOR_NAME}</strong> — оператор сервиса «Накта суши».</p>
      <p>Место нахождения оператора: {SITE_OPERATOR_ADDRESS}.</p>
      <h2>Документы</h2>
      <ul className="legal-document-list">
        <li><a href="/privacy"><strong>Политика конфиденциальности</strong></a><br />Какие данные используются для входа, заказа, доставки, карты и уведомлений.</li>
        <li><a href="/terms"><strong>Условия использования и заказа</strong></a><br />Правила оформления, оплаты при получении, доставки, отмены и возврата.</li>
        <li><a href="/delete-account"><strong>Удаление аккаунта и данных</strong></a><br />Как удалить аккаунт в приложении или направить запрос в поддержку.</li>
      </ul>
      <h2>Обращения</h2>
      <p>По вопросам обработки данных, возвратов и качества заказа обратитесь в <a href="/support">поддержку Накта суши</a> или напишите на <a href={`mailto:${contacts.email}`}>{contacts.email}</a>.</p>
    </InfoPage>
  );
}
