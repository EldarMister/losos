import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./category.entity";

export type ProductModifierGroup = {
  id: string;
  title: string;
  selectionType: "single" | "multiple";
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  items: Array<{ id: string; name: string; price: number; image: string; enabled?: boolean }>;
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

  @Column({ type: "text" })
  image!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "text", default: "" })
  composition!: string;

  @Column({ type: "int", default: 0 })
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

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  modifierGroups!: ProductModifierGroup[];

  @Column({ default: true })
  available!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: "CASCADE" })
  category!: Category;
}
