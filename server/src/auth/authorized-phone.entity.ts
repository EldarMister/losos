import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("authorized_phones")
export class AuthorizedPhone {
  @PrimaryColumn({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
