import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type NaktaCoinWithdrawalStatus = "pending" | "submitted" | "withdrawn" | "failed";

@Entity("nakta_coin_withdrawals")
export class NaktaCoinWithdrawal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Index()
  @Column({ type: "varchar", length: 100 })
  regionSlug!: string;

  @Column({ type: "int" })
  amount!: number;

  @Column({ type: "varchar", length: 200 })
  walletAddress!: string;

  @Index()
  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: NaktaCoinWithdrawalStatus;

  @Column({ type: "varchar", length: 200, nullable: true })
  txHash!: string | null;

  @Column({ type: "text", nullable: true })
  error!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
