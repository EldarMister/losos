type CategoryImageSource = {
  image?: string | null;
  products: Array<{ image: string; available?: boolean }>;
};

export function categoryProductImage(category?: CategoryImageSource) {
  const product = category?.products.find((item) => item.available !== false) || category?.products[0];
  return product?.image.trim() || "";
}

export function categoryImage(category?: CategoryImageSource) {
  return category?.image?.trim() || categoryProductImage(category);
}
