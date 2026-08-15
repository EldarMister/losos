import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type AccountNftStatus = "owned" | "pending" | "submitted" | "withdrawn" | "failed";

@Entity("account_nfts")
export class AccountNft {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 180 })
  rewardKey!: string;

  @Index()
  @Column({ type: "uuid" })
  orderId!: string;

  @Column({ type: "int" })
  milestoneOrderCount!: number;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "text", default: "" })
  image!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "varchar", length: 20 })
  network!: string;

  @Column({ type: "varchar", length: 200, default: "" })
  contractAddress!: string;

  @Column({ type: "text", default: "" })
  metadataUri!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  tokenId!: string | null;

  @Index()
  @Column({ type: "varchar", length: 20, default: "owned" })
  status!: AccountNftStatus;

  @Column({ type: "varchar", length: 200, nullable: true })
  walletAddress!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  txHash!: string | null;

  @Column({ type: "text", nullable: true })
  withdrawalError!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  withdrawalRequestedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  withdrawnAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
