import { Column, Entity, Index, ManyToOne, PrimaryColumn } from "typeorm";
import { Category } from "./category.entity";

@Entity("products")
export class Product {
  @PrimaryColumn({ type: "int" })
  id!: number;

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

  @ManyToOne(() => Category, (category) => category.products, { onDelete: "CASCADE" })
  category!: Category;
}
