type CategoryImageSource = {
  image?: string | null;
  imageHidden?: boolean;
  products: Array<{ image: string; available?: boolean }>;
};

export function categoryProductImage(category?: CategoryImageSource) {
  if (category?.imageHidden) return "";
  const product = category?.products.find((item) => item.available !== false) || category?.products[0];
  return product?.image.trim() || "";
}

export function categoryImage(category?: CategoryImageSource) {
  if (category?.imageHidden) return "";
  return category?.image?.trim() || categoryProductImage(category);
}
