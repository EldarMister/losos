import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./category.entity";
import { PickupLocation } from "./pickup-location.entity";
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

  @Column({ type: "varchar", length: 5, default: "11:30" })
  deliveryOpenTime!: string;

  @Column({ type: "varchar", length: 5, default: "22:30" })
  deliveryCloseTime!: string;

  @Column({ default: false })
  deliveryIs24Hours!: boolean;

  @Column({ type: "jsonb", default: () => "'[0,1,2,3,4,5,6]'::jsonb" })
  deliveryWorkingDays!: number[];

  @Column({ type: "int", default: 4900 })
  freeDeliveryThreshold!: number;

  @Column({ default: "" })
  footerCompanyName!: string;

  @Column({ default: "" })
  footerLegalInfo!: string;

  @OneToMany(() => Category, (category) => category.region)
  categories!: Category[];

  @OneToMany(() => Promotion, (promotion) => promotion.region)
  promotions!: Promotion[];

  @OneToMany(() => PickupLocation, (location) => location.region)
  pickupLocations!: PickupLocation[];
}
