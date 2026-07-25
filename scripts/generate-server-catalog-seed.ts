import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { categories } from "../app/data/catalog";

const outputPath = fileURLToPath(
  new URL("../server/src/catalog/seed-data.generated.json", import.meta.url),
);

const seedCategories = categories.map((category, categoryIndex) => ({
  slug: category.slug,
  title: category.title,
  sortOrder: categoryIndex,
  products: category.products.map((product, productIndex) => ({
    sourceId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    description: product.description ?? "",
    composition: product.composition ?? "",
    weight: product.weight ?? 0,
    calories: product.calories ?? 0,
    protein: product.protein ?? 0,
    fat: product.fat ?? 0,
    carbs: product.carbs ?? 0,
    isNew: product.isNew ?? false,
    modifierGroups: product.modifierGroups ?? [],
    available: product.available ?? true,
    sortOrder: productIndex,
  })),
}));

await writeFile(outputPath, `${JSON.stringify(seedCategories, null, 2)}\n`, "utf8");
console.log(`Generated ${seedCategories.length} categories and ${
  seedCategories.reduce((count, category) => count + category.products.length, 0)
} product entries at ${outputPath}`);
