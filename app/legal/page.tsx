import type { Metadata } from "next";
import { InfoPage } from "../components/InfoPage";

export const metadata: Metadata = { title: "Правовая информация" };

export default function LegalPage() {
  return (
    <InfoPage title="Правовая информация">
      <p>Здесь собраны документы для сайта и мобильного приложения «Накта суши».</p>
      <h2>Оператор сервиса</h2>
      <p><strong>ФЛЮРА МАДАМИНЖАНОВНА БАТЫРОВА</strong>, Кыргызская Республика — разработчик и оператор Сервиса.</p>
      <h2>Документы</h2>
      <ul className="legal-document-list">
        <li><a href="/privacy"><strong>Политика конфиденциальности</strong></a><br />Какие данные используются для входа, заказа, доставки, карты и уведомлений.</li>
        <li><a href="/terms"><strong>Условия использования и заказа</strong></a><br />Правила оформления, оплаты при получении, доставки, отмены и возврата.</li>
        <li><a href="/delete-account"><strong>Удаление аккаунта и данных</strong></a><br />Как удалить аккаунт в приложении или направить запрос в поддержку.</li>
      </ul>
      <h2>Обращения</h2>
      <p>По вопросам обработки данных, возвратов и качества заказа обратитесь в <a href="/support">поддержку Накта суши</a> или напишите на <a href="mailto:naktasushi@gmail.com">naktasushi@gmail.com</a>.</p>
    </InfoPage>
  );
}
