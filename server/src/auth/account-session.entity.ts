import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("account_sessions")
@Index(["phone", "expiresAt"])
export class AccountSession {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 64 })
  tokenHash!: string;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
