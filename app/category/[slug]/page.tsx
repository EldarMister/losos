import { Storefront } from "../../components/Storefront";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Storefront categorySlug={slug} />;
}
