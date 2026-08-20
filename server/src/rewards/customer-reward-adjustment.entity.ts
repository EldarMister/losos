import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type CustomerRewardAsset = "coin" | "nft";

@Entity("customer_reward_adjustments")
export class CustomerRewardAdjustment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Index()
  @Column({ type: "varchar", length: 100 })
  regionSlug!: string;

  @Column({ type: "varchar", length: 10 })
  asset!: CustomerRewardAsset;

  @Column({ type: "int" })
  delta!: number;

  @Column({ type: "int" })
  balanceAfter!: number;

  @Column({ type: "varchar", length: 240 })
  reason!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
