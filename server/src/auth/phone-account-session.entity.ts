import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity("phone_account_sessions")
@Index("IDX_phone_account_sessions_phone_expires", ["phone", "expiresAt"])
export class PhoneAccountSession {
  @PrimaryColumn({ type: "varchar", length: 64 })
  tokenHash!: string;

  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
