import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./category.entity";

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

  @Column({ type: "varchar", nullable: true })
  badge!: string | null;

  @Column({ default: true })
  available!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: "CASCADE" })
  category!: Category;
}
