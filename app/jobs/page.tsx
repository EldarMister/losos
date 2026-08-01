import type { Metadata } from "next";
import { InfoPage } from "../components/InfoPage";

export const metadata: Metadata = { title: "Работа" };

export default function JobsPage() {
  return (
    <InfoPage title="Работа в Накта суши" action={{ label: "Отправить резюме", href: "mailto:musaev.janybek.kg@gmail.com?subject=Работа%20в%20Накта%20суши" }}>
      <p>Мы развиваем кухни и доставку в Бишкеке и Оше и рады знакомству с поварами, курьерами, операторами и менеджерами.</p>
      <p>Напишите о себе, укажите город, желаемую роль и удобный телефон для связи. Актуальные условия и график обсудим лично.</p>
    </InfoPage>
  );
}
