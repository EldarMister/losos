import "reflect-metadata";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { RequestListener } from "node:http";
import { AppModule } from "./app.module";

const trustedFrontendOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3100",
  "http://127.0.0.1:3100",
  "https://naktasushi.com",
  "https://www.naktasushi.com",
  "https://losos-omega.vercel.app",
  "https://mnogolososya-react-copy.azizbek1996.chatgpt.site",
];

async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useBodyParser("json", { limit: "8mb" });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const configuredOrigins = process.env.FRONTEND_ORIGIN
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
  app.enableCors({
    origin: [...new Set([...configuredOrigins, ...trustedFrontendOrigins])],
    credentials: true,
  });
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
