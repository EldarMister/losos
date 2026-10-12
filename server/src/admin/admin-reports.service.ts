import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { freeKitItemsForRegion } from "../catalog/cart-configuration";
import { publicProduct, publicRegion } from "../catalog/catalog.service";
import { Product } from "../catalog/product.entity";
import { Region } from "../catalog/region.entity";
import { Category } from "../catalog/category.entity";
import { Promotion } from "../catalog/promotion.entity";
import { regionContentSourceSlug } from "../catalog/region-content-source";
import { isLegacyFinancialPromotion } from "../catalog/financial-promotion";
import { filterAdminRegion } from "./admin-payload-access";
import { hasPermission, type StaffIdentity } from "./admin-permissions";

export const csvReportCell = (value:unknown) => `"${String(value??"").replace(/^(\s*[=+@-]|[\t\r\n])/,"'$1").replace(/"/g,'""')}"`;

export function reportDates(from?: string,to?: string){
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bishkek",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 const validDate = (value:string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value;
 const end=to||today;
 if(!validDate(end) || (from !== undefined && !validDate(from))) throw new BadRequestException("Укажите существующие календарные даты в формате ГГГГ-ММ-ДД");
 const start=from||new Date(Date.parse(`${end}T00:00:00+06:00`)-6*86400000).toLocaleDateString("en-CA",{timeZone:"Asia/Bishkek"});
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))throw new BadRequestException("Укажите даты в формате ГГГГ-ММ-ДД");
 const startMs=Date.parse(`${start}T00:00:00+06:00`);const endMs=Date.parse(`${end}T00:00:00+06:00`)+86400000;
 if(!Number.isFinite(startMs)||!Number.isFinite(endMs)||startMs>=endMs||(endMs-startMs)>366*86400000)throw new BadRequestException("Период должен составлять от 1 до 366 дней");
 return {from:start,to:end,start:new Date(startMs),end:new Date(endMs),previousStart:new Date(startMs-(endMs-startMs))};
}
@Injectable()
export class AdminReportsService{
 constructor(private readonly db:DataSource){}
 private async region(slug:string){const region=await this.db.getRepository(Region).findOneBy({slug});if(!region)throw new BadRequestException("Город не найден");return region}
 async catalogPage(regionSlug:string,search:string,categoryId:number,limit:number,offset:number,staff:StaffIdentity){
   const region=await this.region(regionSlug);const menuRegionSlug=regionContentSourceSlug(region,"menuSourceRegionSlug");const menuRegion=await this.region(menuRegionSlug);
   const safeLimit=Math.min(100,Math.max(1,Number.isFinite(limit)?Math.trunc(limit):25));const safeOffset=Math.max(0,Number.isFinite(offset)?Math.trunc(offset):0);
   const categories=await this.db.getRepository(Category).find({where:{region:{id:menuRegion.id}},order:{sortOrder:"ASC",id:"ASC"}});
   const query=this.db.getRepository(Product).createQueryBuilder("product").innerJoinAndSelect("product.category","category").where('category."regionId"=:regionId',{regionId:menuRegion.id});
   if(search?.trim())query.andWhere('product.name ILIKE :search',{search:`%${search.trim().slice(0,160)}%`});if(Number.isSafeInteger(categoryId)&&categoryId>0)query.andWhere('category.id=:categoryId',{categoryId});
   const [products,total]=await query.orderBy('product.sortOrder','ASC').addOrderBy('product.id','ASC').take(safeLimit).skip(safeOffset).getManyAndCount();
   const effectiveToppingProductIds = region.toppingProductIds ?? (await this.db.query(`SELECT p.id FROM products p JOIN categories c ON c.id=p."categoryId" WHERE c."regionId"=$1 AND (c.title || ' ' || c.slug) ~* $2`, [menuRegion.id, "топпинг|соус|добав|васаби|имбир"])).map((row:{id:number})=>row.id);
   return {effectiveToppingProductIds:hasPermission(staff,"kits.view")?effectiveToppingProductIds:[],items:products.map(product=>({...publicProduct(product),category:undefined,categoryId:product.category.id,modifierGroups:hasPermission(staff,"modifiers.view")?product.modifierGroups:[],kitItems:hasPermission(staff,"kits.view")?product.kitItems:[]})),total,limit:safeLimit,offset:safeOffset,categories:categories.map(c=>({id:c.id,title:c.title,slug:c.slug,image:c.image,sortOrder:c.sortOrder,products:[]})),kitCatalog:hasPermission(staff,"kits.view")?freeKitItemsForRegion(menuRegion.freeKitItems):[],menuRegionSlug,region:filterAdminRegion(publicRegion(region),staff)};
 }
 async categories(regionSlug:string){const region=await this.region(regionSlug);const menuRegionSlug=regionContentSourceSlug(region,"menuSourceRegionSlug");const menu=await this.region(menuRegionSlug);const rows=await this.db.query(`SELECT c.*,COUNT(p.id)::int AS "productCount",MIN(p.image) AS "fallbackImage" FROM categories c LEFT JOIN products p ON p."categoryId"=c.id WHERE c."regionId"=$1 GROUP BY c.id ORDER BY c."sortOrder",c.id`,[menu.id]);return {items:rows.map((r:Record<string,unknown>)=>({...r,products:[]})),menuRegionSlug}}
 async promotions(regionSlug:string){const region=await this.region(regionSlug);const promotionRegionSlug=regionContentSourceSlug(region,"promotionSourceRegionSlug");const source=await this.region(promotionRegionSlug);const items=await this.db.getRepository(Promotion).find({where:{region:{id:source.id}},order:{sortOrder:"ASC",id:"ASC"}});return {items:items.filter(item=>!isLegacyFinancialPromotion(item)),promotionRegionSlug}}
 async overview(regionSlug:string,staff:StaffIdentity){await this.region(regionSlug);const result:{orders:unknown;analytics:unknown}={orders:null,analytics:null};if(hasPermission(staff,"orders.view")){const [row]=await this.db.query(`SELECT COUNT(*) FILTER(WHERE status='new')::int AS "newOrders",COUNT(*) FILTER(WHERE status NOT IN ('completed','cancelled'))::int AS "activeOrders" FROM orders WHERE "regionSlug"=$1`,[regionSlug]);result.orders=row}if(hasPermission(staff,"analytics.view")){const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bishkek"}).format(new Date());const data=await this.report(regionSlug,today,today);result.analytics=data.current}return result}
 async report(regionSlug:string,from?:string,to?:string,staff?:StaffIdentity){
   await this.region(regionSlug);const dates=reportDates(from,to);
   const [row]=await this.db.query(`
 WITH scoped AS(SELECT o.*,o."createdAt" AT TIME ZONE current_setting('TIMEZONE') AS created,COALESCE(o."completedAt",o."updatedAt" AT TIME ZONE current_setting('TIMEZONE')) AS completed FROM orders o WHERE o."regionSlug"=$1),
 current_orders AS(SELECT * FROM scoped WHERE created >= $2 AND created < $3),
 completed_orders AS(SELECT * FROM scoped WHERE status='completed' AND completed >= $2 AND completed < $3),
 previous_orders AS(SELECT * FROM scoped WHERE created >= $4 AND created < $2),
 previous_completed AS(SELECT * FROM scoped WHERE status='completed' AND completed >= $4 AND completed < $2),
 first_orders AS(SELECT phone,MIN(created) AS first FROM scoped GROUP BY phone),
 product_rows AS(SELECT i."productName" AS name,SUM(i.quantity)::int AS count,SUM(i."lineTotal")::numeric AS revenue FROM order_items i JOIN completed_orders o ON o.id=i."orderId" GROUP BY i."productName" ORDER BY revenue DESC LIMIT 50),
 category_rows AS(SELECT COALESCE(i."categoryName",'Категория не зафиксирована') AS name,SUM(i.quantity)::int AS count,SUM(i."lineTotal")::numeric AS revenue FROM order_items i JOIN completed_orders o ON o.id=i."orderId" GROUP BY i."categoryName" ORDER BY revenue DESC LIMIT 50),
 modifier_rows AS(SELECT m->>'itemName' AS name,SUM((m->>'quantity')::int * CASE WHEN m->>'priceScope'='per-line' THEN 1 ELSE i.quantity END)::int AS count,SUM((m->>'totalPrice')::numeric * CASE WHEN m->>'priceScope'='per-line' THEN 1 ELSE i.quantity END) AS revenue FROM order_items i JOIN completed_orders o ON o.id=i."orderId" CROSS JOIN LATERAL jsonb_array_elements(i."modifierSnapshots") m GROUP BY m->>'itemName' ORDER BY count DESC LIMIT 50),
 kit_rows AS(SELECT k->>'name' AS name,SUM((k->>'quantity')::int)::int AS count FROM completed_orders o CROSS JOIN LATERAL jsonb_array_elements(o."kitItems") k GROUP BY k->>'name' ORDER BY count DESC LIMIT 50),
 days AS(SELECT generate_series(($2::timestamptz AT TIME ZONE 'Asia/Bishkek')::date,($3::timestamptz AT TIME ZONE 'Asia/Bishkek')::date-1,interval '1 day') AS day),
 day_rows AS(SELECT to_char(d.day,'YYYY-MM-DD') AS label,COALESCE(SUM(o.total),0)::numeric AS revenue,COUNT(o.id)::int AS count FROM days d LEFT JOIN completed_orders o ON (o.completed AT TIME ZONE 'Asia/Bishkek')::date=d.day::date GROUP BY d.day ORDER BY d.day),
 hour_rows AS(SELECT h AS hour,COUNT(o.id)::int AS count,COALESCE(SUM(o.total),0)::numeric AS revenue FROM generate_series(0,23) h LEFT JOIN completed_orders o ON EXTRACT(HOUR FROM o.completed AT TIME ZONE 'Asia/Bishkek')=h GROUP BY h ORDER BY h),
 status_rows AS(SELECT status,COUNT(*)::int AS count FROM current_orders GROUP BY status)
 SELECT jsonb_build_object(
 'current',jsonb_build_object('orders',(SELECT COUNT(*)::int FROM current_orders),'completed',(SELECT COUNT(*)::int FROM completed_orders),'revenue',(SELECT COALESCE(SUM(total),0)::numeric FROM completed_orders),'average',(SELECT COALESCE(AVG(total),0)::numeric FROM completed_orders),'cancelled',(SELECT COUNT(*)::int FROM current_orders WHERE status='cancelled'),'newCustomers',(SELECT COUNT(DISTINCT o.phone)::int FROM current_orders o JOIN first_orders f ON f.phone=o.phone WHERE f.first >= $2),'repeatCustomers',(SELECT COUNT(DISTINCT o.phone)::int FROM current_orders o JOIN first_orders f ON f.phone=o.phone WHERE f.first < $2)),
 'previous',jsonb_build_object('orders',(SELECT COUNT(*)::int FROM previous_orders),'completed',(SELECT COUNT(*)::int FROM previous_completed),'revenue',(SELECT COALESCE(SUM(total),0)::numeric FROM previous_completed),'average',(SELECT COALESCE(AVG(total),0)::numeric FROM previous_completed)),
 'products',COALESCE((SELECT jsonb_agg(p) FROM product_rows p),'[]'::jsonb),
 'categories',COALESCE((SELECT jsonb_agg(c) FROM category_rows c),'[]'::jsonb),
 'modifiers',COALESCE((SELECT jsonb_agg(m) FROM modifier_rows m),'[]'::jsonb),
 'kits',COALESCE((SELECT jsonb_agg(k) FROM kit_rows k),'[]'::jsonb),
 'days',COALESCE((SELECT jsonb_agg(d) FROM day_rows d),'[]'::jsonb),
 'hours',COALESCE((SELECT jsonb_agg(h) FROM hour_rows h),'[]'::jsonb),
 'statuses',COALESCE((SELECT jsonb_agg(s) FROM status_rows s),'[]'::jsonb)) AS data`,[regionSlug,dates.start,dates.end,dates.previousStart]);
   let employees: { recordedSince: unknown; items: Array<{name:string;statusChanges:number;completions:number}> } | null = null;
   if(staff && hasPermission(staff,"staff.view") && hasPermission(staff,"audit.view")) {
     const [recording] = await this.db.query('SELECT MIN("createdAt") AS since FROM admin_audit');
     const items = await this.db.query(`SELECT a."actorName" AS name, COUNT(*)::int AS "statusChanges", COUNT(*) FILTER (WHERE a.details->>'status'='completed')::int AS completions FROM admin_audit a JOIN orders o ON o.id::text=a.target WHERE a.action='order.status' AND o."regionSlug"=$1 AND a."createdAt">=$2 AND a."createdAt"<$3 GROUP BY a."actorId",a."actorName" ORDER BY "statusChanges" DESC LIMIT 100`,[regionSlug,dates.start,dates.end]);
     employees={recordedSince:recording.since,items};
   }
   return {...row.data,employees,period:{from:dates.from,to:dates.to,timezone:"Asia/Bishkek",previousFrom:new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bishkek"}).format(dates.previousStart),previousTo:new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bishkek"}).format(new Date(dates.start.getTime()-1))},returns:null,profit:null};
 }
 async export(region:string,from?:string,to?:string,staff?:StaffIdentity){
   const data=await this.report(region,from,to,staff);
   const rows:unknown[][]=[
     ["Отчёт NAKTA",data.period.from,data.period.to,"Asia/Bishkek"],
     ["Показатель","Значение"],["Заказы",data.current.orders],["Завершено",data.current.completed],
     ["Выручка, сом",data.current.revenue],["Средний чек, сом",data.current.average],
     ["Отмены",data.current.cancelled],["Новые клиенты",data.current.newCustomers],["Повторные клиенты",data.current.repeatCustomers],
     [],["Дата","Выручка, сом","Завершено"],
     ...data.days.map((d:{label:string;revenue:number;count:number})=>[d.label,d.revenue,d.count]),
     [],["Час, Asia/Bishkek","Выручка, сом","Завершено"],
     ...data.hours.map((h:{hour:number;revenue:number;count:number})=>[h.hour,h.revenue,h.count]),
     [],["Статус","Заказы"],...data.statuses.map((s:{status:string;count:number})=>[s.status,s.count]),
   ];
   for(const key of ["products","categories","modifiers","kits"]){
     rows.push([],[({products:"Товары",categories:"Категории",modifiers:"Модификаторы",kits:"Комплектации"} as Record<string,string>)[key],"Количество","Сумма до общей скидки, сом"]);
     for(const item of data[key]) rows.push([item.name,item.count,item.revenue??"Не учитывается"]);
   }
   if(data.employees){
     rows.push([],["Персонал","Изменения статусов","Завершения"]);
     for(const item of data.employees.items) rows.push([item.name,item.statusChanges,item.completions]);
   }
   return {filename:`nakta-report-${data.period.from}-${data.period.to}.csv`,csv:'\uFEFF'+rows.map(row=>row.map(csvReportCell).join(';')).join('\r\n')};
 }
}
