import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";

@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) throw new UnauthorizedException("ADMIN_TOKEN is not configured");

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const headerToken = request.headers["x-admin-token"];
    const authorization = request.headers.authorization;
    const supplied = (
      Array.isArray(headerToken) ? headerToken[0] : headerToken
    ) ?? (
      typeof authorization === "string" && authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : ""
    );

    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied || "");
    if (
      expectedBuffer.length !== suppliedBuffer.length ||
      !timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      throw new UnauthorizedException("Invalid admin token");
    }
    return true;
  }
}
