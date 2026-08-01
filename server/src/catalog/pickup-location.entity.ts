import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Region } from "./region.entity";

@Entity("pickup_locations")
@Index(["region", "sortOrder", "id"])
export class PickupLocation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 120, default: "" })
  title!: string;

  @Column({ type: "varchar", length: 500 })
  address!: string;

  @Column({ type: "varchar", length: 250, default: "" })
  workingHours!: string;

  @Column({ type: "double precision", nullable: true })
  latitude!: number | null;

  @Column({ type: "double precision", nullable: true })
  longitude!: number | null;

  @Column({ type: "text", default: "" })
  yandexUrl!: string;

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Region, (region) => region.pickupLocations, {
    onDelete: "CASCADE",
  })
  region!: Region;
}
