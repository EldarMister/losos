import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function seed() {
  process.env.SEED_CATALOG_ON_STARTUP = "true";
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });
  await application.close();
}

void seed();
