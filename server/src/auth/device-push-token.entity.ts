import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("device_push_tokens")
export class DevicePushToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "uuid" })
  deviceId!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  expoPushToken!: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ type: "varchar", length: 10 })
  platform!: "android" | "ios";

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
