import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderItem } from "./order-item.entity";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  customerName!: string;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column({ type: "int" })
  total!: number;

  @Column({ default: "new" })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];
}
