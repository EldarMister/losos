import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";
import { Region } from "./region.entity";

@Entity("categories")
@Index(["region", "slug"], { unique: true })
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  slug!: string;

  @Column()
  title!: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Region, (region) => region.categories, { onDelete: "CASCADE" })
  region!: Region;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
