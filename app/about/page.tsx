import type { Metadata } from "next";
import { InfoPage } from "../components/InfoPage";

export const metadata: Metadata = { title: "О нас" };

export default function AboutPage() {
  return (
    <InfoPage title="О Накта суши" action={{ label: "Выбрать блюда", href: "/" }}>
      <p>Накта суши — доставка роллов, суши, сетов и горячих блюд в Бишкеке и Оше.</p>
      <h2>Что для нас важно</h2>
      <ul>
        <li>свежие продукты и понятный состав каждого блюда;</li>
        <li>одинаковые цены и доступность в приложении и на сайте;</li>
        <li>аккуратная сборка и прозрачный статус заказа;</li>
        <li>поддержка, которая отвечает за результат.</li>
      </ul>
    </InfoPage>
  );
}
