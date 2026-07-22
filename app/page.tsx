import type { Metadata } from "next";
import { Storefront } from "./components/Storefront";

export const metadata: Metadata = {
  title: "Много лосося | Суши, пиццы, роллы",
  description: "Доставка роллов, суши, поке и горячих блюд.",
};

export default function Home() {
  return <Storefront />;
}
