import "reflect-metadata";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { RequestListener } from "node:http";
import { AppModule } from "./app.module";

async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser("json", { limit: "8mb" });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN?.split(",") ?? true, credentials: true });
  return app;
}

async function bootstrap() {
  const app = await createApplication();
  await app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0");
}

let requestListener: Promise<RequestListener> | undefined;

async function getRequestListener() {
  requestListener ??= createApplication().then(async (app) => {
    await app.init();
    return app.getHttpAdapter().getInstance() as RequestListener;
  });
  return requestListener;
}

export default async function handler(...args: Parameters<RequestListener>) {
  const listener = await getRequestListener();
  return listener(...args);
}

if (!process.env.VERCEL) {
  void bootstrap();
}
