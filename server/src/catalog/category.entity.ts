import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  slug!: string;

  @Column()
  title!: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
