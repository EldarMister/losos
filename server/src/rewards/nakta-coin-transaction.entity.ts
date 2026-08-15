import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("nakta_coin_transactions")
export class NaktaCoinTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Index()
  @Column({ type: "varchar", length: 100 })
  regionSlug!: string;

  @Index({ unique: true })
  @Column({ type: "uuid" })
  orderId!: string;

  @Column({ type: "int" })
  amount!: number;

  @Column({ type: "varchar", length: 240 })
  description!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
