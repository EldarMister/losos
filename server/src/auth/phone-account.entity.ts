import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("phone_accounts")
export class PhoneAccount {
  @PrimaryColumn({ type: "varchar", length: 20 })
  phone!: string;

  @Index()
  @Column({ type: "varchar", length: 64, nullable: true })
  sessionTokenHash!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  sessionExpiresAt!: Date | null;

  @Column({ type: "int", default: 0 })
  naktaCoins!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
