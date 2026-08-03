import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { OrderItem } from "./order-item.entity";
import { DeliveryType, OrderStatus, PaymentMethod } from "./order.enums";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ length: 100, default: "bishkek" })
  regionSlug!: string;

  @Column({ type: "varchar", length: 20, default: DeliveryType.DELIVERY })
  deliveryType!: DeliveryType;

  @Column()
  customerName!: string;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column({ type: "double precision", nullable: true })
  latitude!: number | null;

  @Column({ type: "double precision", nullable: true })
  longitude!: number | null;

  @Column({ default: "" })
  apartment!: string;

  @Column({ default: "" })
  entrance!: string;

  @Column({ default: "" })
  floor!: string;

  @Column({ default: "" })
  intercom!: string;

  @Column({ type: "text", default: "" })
  comment!: string;

  @Column({ type: "int", default: 1 })
  utensilsCount!: number;

  @Column({ default: false })
  noUtensils!: boolean;

  @Column({ type: "varchar", length: 30, default: PaymentMethod.CASH })
  paymentMethod!: PaymentMethod;

  @Index({ unique: true })
  @Column({ length: 120 })
  idempotencyKey!: string;

  @Column({ length: 64 })
  requestFingerprint!: string;

  @Column({ type: "int" })
  subtotal!: number;

  @Column({ type: "int" })
  total!: number;

  @Index()
  @Column({ type: "varchar", length: 30, default: OrderStatus.NEW })
  status!: OrderStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index()
  @Column({ type: "timestamp with time zone", nullable: true })
  completedAt!: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];
}
