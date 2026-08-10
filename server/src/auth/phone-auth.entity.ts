import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("phone_auth_challenges")
@Index(["phone", "createdAt"])
export class PhoneAuthChallenge {
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ type: "varchar", length: 16, default: "sms" })
  channel!: "sms" | "trusted";

  @Column({ type: "varchar", length: 255 })
  providerToken!: string;

  @Index()
  @Column({ type: "varchar", length: 64, nullable: true })
  requestIpHash!: string | null;

  @Column({ type: "int", default: 0 })
  attemptCount!: number;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "timestamptz" })
  nextSendAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  verifiedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
