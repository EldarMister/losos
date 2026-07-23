import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Region } from "./region.entity";

@Entity("promotions")
export class Promotion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: "text" })
  image!: string;

  @Column({ type: "varchar", default: "" })
  cta!: string;

  @Column({ type: "text", default: "" })
  ctaUrl!: string;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Region, (region) => region.promotions, { onDelete: "CASCADE" })
  region!: Region;
}
