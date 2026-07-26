import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./category.entity";
import { Promotion } from "./promotion.entity";

@Entity("regions")
@Index(["slug"], { unique: true })
export class Region {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  slug!: string;

  @Column()
  name!: string;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ default: "" })
  contactPhone!: string;

  @Column({ default: "" })
  contactEmail!: string;

  @Column({ default: "" })
  contactAddress!: string;

  @Column({ default: "" })
  pickupAddress!: string;

  @Column({ default: "" })
  pickupYandexUrl!: string;

  @Column({ default: "" })
  pickupWorkingHours!: string;

  @Column({ default: "" })
  footerCompanyName!: string;

  @Column({ default: "" })
  footerLegalInfo!: string;

  @OneToMany(() => Category, (category) => category.region)
  categories!: Category[];

  @OneToMany(() => Promotion, (promotion) => promotion.region)
  promotions!: Promotion[];
}
