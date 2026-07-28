import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity("phone_auth_challenges")
@Index(["phone", "createdAt"])
export class PhoneAuthChallenge {
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column({ length: 20 })
  phone!: string;

  @Column({ length: 255 })
  providerToken!: string;

  @Column({ type: "int", default: 0 })
  attemptCount!: number;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "timestamptz" })
  nextSendAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  verifiedAt!: Date | null;

  @Index()
  @Column({ type: "varchar", length: 64, nullable: true })
  verificationTokenHash!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  verificationTokenExpiresAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
