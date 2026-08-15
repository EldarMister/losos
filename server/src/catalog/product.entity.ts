import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./category.entity";

export type ModifierPriceScope = "per-product" | "per-line";

export type ProductModifierItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  enabled?: boolean;
  maxQuantity?: number;
};

export type ProductModifierGroup = {
  id: string;
  title: string;
  selectionType: "single" | "multiple";
  presentation?: "rows" | "cards";
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  priceScope?: ModifierPriceScope;
  items: ProductModifierItem[];
};

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", nullable: true })
  sourceId!: number | null;

  @Index()
  @Column()
  slug!: string;

  @Column()
  name!: string;

  @Column({ type: "int" })
  price!: number;

  @Column({ type: "int", nullable: true })
  oldPrice!: number | null;

  @Column({ type: "text" })
  image!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "text", default: "" })
  composition!: string;

  @Column({ type: "real", default: 0 })
  weight!: number;

  @Column({ type: "int", default: 0 })
  calories!: number;

  @Column({ type: "int", default: 0 })
  protein!: number;

  @Column({ type: "int", default: 0 })
  fat!: number;

  @Column({ type: "int", default: 0 })
  carbs!: number;

  @Column({ default: false })
  isNew!: boolean;

  @Column({ type: "int", default: 0 })
  naktaCoins!: number;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  modifierGroups!: ProductModifierGroup[];

  @Column({ default: true })
  available!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: "CASCADE" })
  category!: Category;
}
