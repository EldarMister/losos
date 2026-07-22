import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Product } from "../catalog/product.entity";
import { CreateOrderDto } from "./create-order.dto";
import { OrderItem } from "./order-item.entity";
import { Order } from "./order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem) private readonly items: Repository<OrderItem>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async create(dto: CreateOrderDto) {
    const ids = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.products.findBy({ id: In(ids) });
    if (products.length !== ids.length) throw new BadRequestException("One or more products do not exist");
    const byId = new Map(products.map((product) => [product.id, product]));
    const lines = dto.items.map((entry) => {
      const product = byId.get(entry.productId)!;
      return this.items.create({ productId: product.id, productName: product.name, unitPrice: product.price, quantity: entry.quantity });
    });
    const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    return this.orders.save(this.orders.create({ customerName: dto.customerName, phone: dto.phone, address: dto.address, total, items: lines }));
  }

  async find(id: string) {
    const order = await this.orders.findOne({ where: { id }, relations: { items: true } });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }
}
