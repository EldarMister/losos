import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { UpdateSiteContactsDto } from "./site-settings.dto";

export type SiteContacts = { phone: string; email: string; address: string; instagram: string };
export const DEFAULT_SITE_CONTACTS: SiteContacts = {
  phone: "0505614614", email: "naktasushi@gmail.com", address: "Ош, ул. Алиева, 104", instagram: "naktasushi_osh",
};
export type SiteContactSettings = { global: SiteContacts; overrides: Record<string, SiteContacts> };
type SettingsRow = { global: Partial<SiteContacts>; overrides: Record<string, SiteContacts> };
export function contactSettings(row?: SettingsRow): SiteContactSettings {
  return { global: { ...DEFAULT_SITE_CONTACTS, ...row?.global }, overrides: row?.overrides ?? {} };
}
export function resolvedContacts(settings: SiteContactSettings, region?: string): SiteContacts {
  return region && Object.hasOwn(settings.overrides, region) ? settings.overrides[region] : settings.global;
}
@Injectable()
export class SiteSettingsService {
  constructor(private readonly db: DataSource) {}
  async settings(): Promise<SiteContactSettings> {
    const [row] = await this.db.query('SELECT "global", overrides FROM site_contact_settings WHERE id=1');
    return contactSettings(row);
  }
  async publicContacts(region?: string): Promise<SiteContacts> {
    const settings = await this.settings();
    if (!region) return settings.global;
    const [available] = await this.db.query('SELECT slug FROM regions WHERE slug=$1 AND enabled=true', [region]);
    return resolvedContacts(settings, available?.slug);
  }
  async update(dto: UpdateSiteContactsDto): Promise<SiteContactSettings> {
    if (dto.target === "all" && dto.useGlobal) throw new BadRequestException("Общие данные нельзя сбросить на самих себя");
    if (!dto.useGlobal && !dto.contacts) throw new BadRequestException("Укажите контактные данные");
    return this.db.transaction(async manager => {
      await manager.query('INSERT INTO site_contact_settings (id) VALUES (1) ON CONFLICT DO NOTHING');
      const [row] = await manager.query('SELECT "global", overrides FROM site_contact_settings WHERE id=1 FOR UPDATE');
      const settings = contactSettings(row);
      if (dto.target !== "all") {
        const [region] = await manager.query('SELECT slug FROM regions WHERE slug=$1', [dto.target]);
        if (!region) throw new NotFoundException("Город не найден");
      }
      if (dto.useGlobal) delete settings.overrides[dto.target];
      else {
        const { phone, email, address, instagram } = dto.contacts!;
        const contacts = { phone, email, address, instagram };
        if (dto.target === "all") settings.global = contacts;
        else settings.overrides[dto.target] = contacts;
      }
      await manager.query('UPDATE site_contact_settings SET "global"=$1, overrides=$2, "updatedAt"=now() WHERE id=1', [JSON.stringify(settings.global), JSON.stringify(settings.overrides)]);
      return settings;
    });
  }
}
