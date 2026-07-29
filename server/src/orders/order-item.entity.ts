import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { ModifierPriceScope } from "../catalog/product.entity";
import { Order } from "./order.entity";

export type OrderModifierSnapshot = {
  groupId: string;
  groupTitle: string;
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  priceScope: ModifierPriceScope;
};

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  productId!: number;

  @Column()
  productName!: string;

  @Column({ type: "int" })
  basePrice!: number;

  @Column({ type: "int" })
  baseTotal!: number;

  @Column({ type: "int", default: 0 })
  modifiersPrice!: number;

  @Column({ type: "int", default: 0 })
  modifiersTotal!: number;

  @Column({ type: "int" })
  unitPrice!: number;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "int" })
  lineTotal!: number;

  @Column({ type: "int", default: 0 })
  naktaCoins!: number;

  @Column({ length: 30, default: "scoped-v2" })
  pricingVersion!: string;

  @Column({ length: 64 })
  configurationKey!: string;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  modifierSnapshots!: OrderModifierSnapshot[];

  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  order!: Order;
}
