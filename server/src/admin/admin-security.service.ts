import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { DataSource, EntityManager } from "typeorm";
import { assertPermission, effectivePermissions, validateOverrides, type StaffIdentity } from "./admin-permissions";
import { CreateStaffDto, StaffBootstrapDto, StaffLoginDto, UpdateCustomerProfileDto, UpdateOwnPasswordDto, UpdateStaffAccessDto, UpdateStaffDto } from "./admin-security.dto";

type StaffRow = StaffIdentity & { passwordHash: string };
type Queryable = Pick<EntityManager, "query">;
const SECURITY_LOCK = 71428019;
export const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");
const derivePassword = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, value) => error ? reject(error) : resolve(value)));
export async function hashStaffPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${(await derivePassword(password, salt)).toString("hex")}`;
}
export async function verifyStaffPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, salt, value] = encoded.split("$");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt || "") || !/^[a-f0-9]{128}$/.test(value || "")) return false;
  const result = await derivePassword(password, salt);
  return timingSafeEqual(result, Buffer.from(value, "hex"));
}
export function publicStaff(row: StaffRow | StaffIdentity): StaffIdentity {
  return { id: row.id, name: row.name, login: row.login, role: row.role, active: row.active, permissions: row.permissions || {}, effectivePermissions: effectivePermissions(row), createdAt: row.createdAt, updatedAt: row.updatedAt };
}
export function assertOwnerSurvives(target: StaffIdentity, nextRole: string, nextActive: boolean, activeOwners: number) {
  if (target.role === "OWNER" && target.active && (nextRole !== "OWNER" || !nextActive) && activeOwners <= 1) {
    throw new ConflictException("Нельзя отключить или понизить последнего активного владельца");
  }
}

@Injectable()
export class AdminSecurityService {
  constructor(private readonly db: DataSource) {}

  async authenticate(token: string): Promise<StaffIdentity> {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new UnauthorizedException("Войдите в учётную запись сотрудника");
    const [row] = await this.db.query(`SELECT staff.*, sessions."id" AS "sessionId" FROM "admin_sessions" sessions JOIN "admin_staff" staff ON staff."id"=sessions."staffId" WHERE sessions."tokenHash"=$1 AND sessions."expiresAt">now() AND staff."active"=true`, [hashSessionToken(token)]) as (StaffRow & { sessionId: string })[];
    if (!row) throw new UnauthorizedException("Сессия завершена. Войдите снова");
    return { ...publicStaff(row), sessionId: row.sessionId };
  }

  private async issueSession(staff: StaffIdentity, query: Queryable = this.db.manager) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    await query.query(`DELETE FROM "admin_sessions" WHERE "expiresAt"<=now()`);
    await query.query(`INSERT INTO "admin_sessions" ("id","staffId","tokenHash","expiresAt") VALUES ($1,$2,$3,$4)`, [randomUUID(), staff.id, hashSessionToken(token), expiresAt]);
    return { token, expiresAt: expiresAt.toISOString(), staff: publicStaff(staff) };
  }

  private async throttle(login: string, ip: string) {
    // Shared, bounded database counters also cover multiple server instances.
    await this.db.query(`DELETE FROM "admin_login_attempts" WHERE "windowStart"<now()-interval '1 day'`);
    for (const value of [`login:${login}`, `ip:${ip}`]) {
      const [row] = await this.db.query(`INSERT INTO "admin_login_attempts" ("key","count","windowStart") VALUES ($1,1,now()) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "admin_login_attempts"."windowStart"<now()-interval '15 minutes' THEN 1 ELSE "admin_login_attempts"."count"+1 END, "windowStart"=CASE WHEN "admin_login_attempts"."windowStart"<now()-interval '15 minutes' THEN now() ELSE "admin_login_attempts"."windowStart" END RETURNING "count"`, [hashSessionToken(value)]);
      if (Number(row.count) > (value.startsWith("ip:") ? 80 : 10)) throw new UnauthorizedException("Слишком много попыток входа. Повторите через 15 минут");
    }
  }

  async login(dto: StaffLoginDto, ip: string) {
    const login = dto.login.trim().toLowerCase();
    await this.throttle(login, ip);
    const [row] = await this.db.query(`SELECT * FROM "admin_staff" WHERE "login"=$1`, [login]) as StaffRow[];
    const dummyHash = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;
    const valid = await verifyStaffPassword(dto.password, row?.passwordHash || dummyHash);
    if (!row || !row.active || !valid) throw new UnauthorizedException("Неверный логин или пароль");
    return this.db.transaction(async manager => {
      const [fresh] = await manager.query(`SELECT * FROM "admin_staff" WHERE "id"=$1 AND "active"=true FOR UPDATE`, [row.id]) as StaffRow[];
      if (!fresh || fresh.passwordHash !== row.passwordHash) throw new UnauthorizedException("Учётная запись изменена. Повторите вход");
      await this.audit(fresh, "auth.login", fresh.id, {}, manager);
      return this.issueSession(fresh, manager);
    });
  }

  async bootstrap(dto: StaffBootstrapDto, ip: string) {
    await this.throttle("bootstrap", ip);
    const expected = process.env.ADMIN_TOKEN || "";
    const supplied = dto.bootstrapToken || "";
    const validToken = expected.length >= 32 && Buffer.byteLength(expected) === Buffer.byteLength(supplied) && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
    if (process.env.ADMIN_BOOTSTRAP_ENABLED !== "true" || !validToken) throw new ForbiddenException("Создание первого владельца недоступно");
    const passwordHash = await hashStaffPassword(dto.password);
    return this.db.transaction(async manager => {
      await manager.query(`SELECT pg_advisory_xact_lock($1)`, [SECURITY_LOCK]);
      const [{ count }] = await manager.query(`SELECT count(*) AS count FROM "admin_staff"`);
      if (Number(count) !== 0) throw new ConflictException("Владелец уже настроен. Используйте вход по логину");
      const [staff] = await manager.query(`INSERT INTO "admin_staff" ("id","login","name","passwordHash","role") VALUES ($1,$2,$3,$4,'OWNER') RETURNING *`, [randomUUID(), dto.login.toLowerCase(), dto.name.trim(), passwordHash]) as StaffRow[];
      await this.audit(staff, "staff.bootstrap", staff.id, { role: "OWNER" }, manager);
      return this.issueSession(staff, manager);
    });
  }

  async logout(token: string) {
    await this.db.query(`DELETE FROM "admin_sessions" WHERE "tokenHash"=$1`, [hashSessionToken(token)]);
    return { loggedOut: true };
  }

  async listStaff(limit = 50, offset = 0) {
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const safeOffset = Math.max(0, Number(offset) || 0);
    const rows = await this.db.query(`SELECT * FROM "admin_staff" ORDER BY "createdAt","id" LIMIT $1 OFFSET $2`, [safeLimit, safeOffset]) as StaffRow[];
    const [{ count }] = await this.db.query(`SELECT count(*) AS count FROM "admin_staff"`);
    return { items: rows.map(publicStaff), total: Number(count), limit: safeLimit, offset: safeOffset };
  }

  private async freshActor(manager: EntityManager, actor: StaffIdentity, permission: string, ownerOnly = false) {
    const [fresh] = await manager.query(`SELECT * FROM "admin_staff" WHERE "id"=$1 FOR UPDATE`, [actor.id]) as StaffRow[];
    if (!fresh?.active) throw new UnauthorizedException("Сотрудник отключён");
    assertPermission(fresh, permission);
    if (ownerOnly && fresh.role !== "OWNER") throw new ForbiddenException("Только владелец может менять роли и права доступа");
    return fresh;
  }

  async createStaff(actor: StaffIdentity, dto: CreateStaffDto) {
    const overrides = validateOverrides(dto.permissions || {});
    const passwordHash = await hashStaffPassword(dto.password);
    try {
      return await this.db.transaction(async manager => {
        await manager.query(`SELECT pg_advisory_xact_lock($1)`, [SECURITY_LOCK]);
        // Creating an identity assigns its initial role. Allowing a restricted
        // admin to create a default manager would let them regain revoked access.
        const fresh = await this.freshActor(manager, actor, "staff.create", true);
        const [row] = await manager.query(`INSERT INTO "admin_staff" ("id","login","name","passwordHash","role","permissions") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [randomUUID(), dto.login.toLowerCase(), dto.name.trim(), passwordHash, dto.role || "MANAGER", JSON.stringify(overrides)]) as StaffRow[];
        await this.audit(fresh, "staff.create", row.id, { role: row.role, permissions: overrides }, manager);
        return publicStaff(row);
      });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ConflictException("Этот логин уже занят");
      throw error;
    }
  }

  async updateStaff(actor: StaffIdentity, id: string, dto: UpdateStaffDto) {
    const passwordHash = dto.password ? await hashStaffPassword(dto.password) : undefined;
    return this.db.transaction(async manager => {
      await manager.query(`SELECT pg_advisory_xact_lock($1)`, [SECURITY_LOCK]);
      const fresh = await this.freshActor(manager, actor, "staff.edit");
      const [target] = await manager.query(`SELECT * FROM "admin_staff" WHERE "id"=$1 FOR UPDATE`, [id]) as StaffRow[];
      if (!target) throw new NotFoundException("Сотрудник не найден");
      if ((target.role === "OWNER" || passwordHash) && fresh.role !== "OWNER") throw new ForbiddenException("Изменение владельца и сброс пароля доступны только владельцу");
      const [{ count }] = await manager.query(`SELECT count(*) AS count FROM "admin_staff" WHERE "role"='OWNER' AND "active"=true`);
      assertOwnerSurvives(target, target.role, dto.active ?? target.active, Number(count));
      const [updated] = await manager.query(`UPDATE "admin_staff" SET "name"=$2,"active"=$3,"passwordHash"=$4,"updatedAt"=now() WHERE "id"=$1 RETURNING *`, [id, dto.name?.trim() ?? target.name, dto.active ?? target.active, passwordHash ?? target.passwordHash]) as StaffRow[];
      if (passwordHash || dto.active === false) await manager.query(`DELETE FROM "admin_sessions" WHERE "staffId"=$1`, [id]);
      await this.audit(fresh, "staff.update", id, { fields: Object.keys(dto).filter(key => key !== "password"), passwordReset: Boolean(passwordHash), active: updated.active }, manager);
      return publicStaff(updated);
    });
  }

  async updateAccess(actor: StaffIdentity, id: string, dto: UpdateStaffAccessDto) {
    const permissions = dto.permissions === undefined ? undefined : validateOverrides(dto.permissions);
    return this.db.transaction(async manager => {
      await manager.query(`SELECT pg_advisory_xact_lock($1)`, [SECURITY_LOCK]);
      const fresh = await this.freshActor(manager, actor, "staff.edit", true);
      const [target] = await manager.query(`SELECT * FROM "admin_staff" WHERE "id"=$1 FOR UPDATE`, [id]) as StaffRow[];
      if (!target) throw new NotFoundException("Сотрудник не найден");
      const [{ count }] = await manager.query(`SELECT count(*) AS count FROM "admin_staff" WHERE "role"='OWNER' AND "active"=true`);
      assertOwnerSurvives(target, dto.role ?? target.role, target.active, Number(count));
      const [updated] = await manager.query(`UPDATE "admin_staff" SET "role"=$2,"permissions"=$3,"updatedAt"=now() WHERE "id"=$1 RETURNING *`, [id, dto.role ?? target.role, JSON.stringify(permissions ?? target.permissions)]) as StaffRow[];
      await this.audit(fresh, "staff.access", id, { before: { role: target.role, permissions: target.permissions }, after: { role: updated.role, permissions: updated.permissions } }, manager);
      return publicStaff(updated);
    });
  }

  async changePassword(actor: StaffIdentity, dto: UpdateOwnPasswordDto) {
    const passwordHash = await hashStaffPassword(dto.password);
    return this.db.transaction(async manager => {
      const [staff] = await manager.query(`SELECT * FROM "admin_staff" WHERE "id"=$1 FOR UPDATE`, [actor.id]) as StaffRow[];
      if (!staff?.active || !await verifyStaffPassword(dto.currentPassword, staff.passwordHash)) throw new ForbiddenException("Текущий пароль неверен");
      await manager.query(`UPDATE "admin_staff" SET "passwordHash"=$2,"updatedAt"=now() WHERE "id"=$1`, [staff.id, passwordHash]);
      await manager.query(`DELETE FROM "admin_sessions" WHERE "staffId"=$1 AND "id"<>$2`, [staff.id, actor.sessionId]);
      await this.audit(staff, "auth.password_changed", staff.id, {}, manager);
      return { changed: true };
    });
  }

  async customerProfile(phone: string) {
    const [profile] = await this.db.query(`SELECT "name","notes","updatedAt" FROM "admin_customer_profiles" WHERE "phone"=$1`, [phone]);
    return profile || { name: "", notes: "", updatedAt: null };
  }

  async updateCustomer(actor: StaffIdentity, phone: string, dto: UpdateCustomerProfileDto) {
    if (!/^\+?[0-9 ()-]{5,30}$/.test(phone)) throw new BadRequestException("Некорректный телефон");
    return this.db.transaction(async manager => {
      const [exists] = await manager.query(`SELECT 1 FROM "orders" WHERE "phone"=$1 UNION ALL SELECT 1 FROM "phone_accounts" WHERE "phone"=$1 LIMIT 1`, [phone]);
      if (!exists) throw new NotFoundException("Клиент не найден");
      const [profile] = await manager.query(`INSERT INTO "admin_customer_profiles" ("phone","name","notes") VALUES ($1,$2,$3) ON CONFLICT ("phone") DO UPDATE SET "name"=$2,"notes"=$3,"updatedAt"=now() RETURNING "name","notes","updatedAt"`, [phone, dto.name.trim(), dto.notes.trim()]);
      await this.audit(actor, "customer.update", phone, { fields: ["name", "notes"] }, manager);
      return profile;
    });
  }

  async audit(actor: Pick<StaffIdentity, "id" | "name">, action: string, target: string, details: Record<string, unknown> = {}, query: Queryable = this.db.manager) {
    await query.query(`INSERT INTO "admin_audit" ("actorId","actorName","action","target","details") VALUES ($1,$2,$3,$4,$5)`, [actor.id, actor.name, action.slice(0, 120), target.slice(0, 300), JSON.stringify(details)]);
  }

  async auditLog(limit = 50, offset = 0, target?: string) {
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const safeOffset = Math.max(0, Number(offset) || 0);
    const items = await this.db.query(`SELECT * FROM "admin_audit" WHERE ($3::varchar IS NULL OR "target"=$3) ORDER BY "id" DESC LIMIT $1 OFFSET $2`, [safeLimit, safeOffset, target || null]);
    const [{ count }] = await this.db.query(`SELECT count(*) AS count FROM "admin_audit" WHERE ($1::varchar IS NULL OR "target"=$1)`, [target || null]);
    return { items, total: Number(count), limit: safeLimit, offset: safeOffset };
  }
}
