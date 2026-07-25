import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Keep the local development behaviour identical to the existing
    // TypeORM configuration while Railway continues to use DATABASE_URL.
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL ?? "postgresql://losos:losos@localhost:5432/losos",
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
