import type { Metadata } from "next";
import { InfoPage } from "../components/InfoPage";

export const metadata: Metadata = { title: "Поддержка" };

export default function SupportPage() {
  return (
    <InfoPage title="Поддержка" action={{ label: "Позвонить нам", href: "tel:+996503178916" }}>
      <p>Поможем с заказом, оплатой, доставкой и работой приложения Накта суши.</p>
      <h2>Как связаться</h2>
      <p>Телефон: <a href="tel:+996503178916">0503 178 916</a><br />Электронная почта: <a href="mailto:musaev.janybek.kg@gmail.com">musaev.janybek.kg@gmail.com</a></p>
      <p>Для быстрого решения вопроса подготовьте номер заказа и телефон, с которого он был оформлен.</p>
    </InfoPage>
  );
}
