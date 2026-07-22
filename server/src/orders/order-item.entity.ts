import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  productId!: number;

  @Column()
  productName!: string;

  @Column({ type: "int" })
  unitPrice!: number;

  @Column({ type: "int" })
  quantity!: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  order!: Order;
}
