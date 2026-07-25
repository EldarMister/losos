import generatedSeedData from "./seed-data.generated.json";
import type { ProductModifierGroup } from "./product.entity";

export type SeedProduct = {
  sourceId: number;
  slug: string;
  name: string;
  price: number;
  image: string;
  description: string;
  composition: string;
  weight: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  isNew: boolean;
  modifierGroups: ProductModifierGroup[];
  available: boolean;
  sortOrder: number;
};

export type SeedCategory = {
  slug: string;
  title: string;
  sortOrder: number;
  products: SeedProduct[];
};

export const seedCategories = generatedSeedData as SeedCategory[];
