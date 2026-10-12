import { Controller,Get,Module,Query,Req,UseGuards } from "@nestjs/common";
import { AdminReportsService } from "./admin-reports.service";
import { AdminSecurityModule } from "./admin-security.module";
import { AdminTokenGuard,type AdminRequest } from "./admin-token.guard";
import { AnyPermission,RequirePermissions } from "./admin-permissions";
@Controller("admin") @UseGuards(AdminTokenGuard)
export class AdminReportsController{
 constructor(private readonly reports:AdminReportsService){}
 @Get("reports") @RequirePermissions("analytics.view") report(@Req() request:AdminRequest,@Query("region") region="bishkek",@Query("from") from?:string,@Query("to") to?:string){return this.reports.report(region,from,to,request.staff)}
 @Get("reports/export") @RequirePermissions("analytics.view","analytics.export") export(@Req() request:AdminRequest,@Query("region") region="bishkek",@Query("from") from?:string,@Query("to") to?:string){return this.reports.export(region,from,to,request.staff)}
 @Get("overview") @RequirePermissions("dashboard.view") overview(@Query("region") region="bishkek",@Req() request:AdminRequest){return this.reports.overview(region,request.staff)}
 @Get("catalog-page") @AnyPermission("products.view","modifiers.view","kits.view") catalog(@Req() request:AdminRequest,@Query("region") region="bishkek",@Query("search") search="",@Query("categoryId") categoryId="0",@Query("limit") limit="25",@Query("offset") offset="0"){return this.reports.catalogPage(region,search,Number(categoryId),Number(limit),Number(offset),request.staff)}
 @Get("category-list") @AnyPermission("categories.view","products.view","modifiers.view","kits.view") categories(@Query("region") region="bishkek"){return this.reports.categories(region)}
 @Get("promotion-list") @RequirePermissions("promotions.view") promotions(@Query("region") region="bishkek"){return this.reports.promotions(region)}
}
@Module({imports:[AdminSecurityModule],controllers:[AdminReportsController],providers:[AdminReportsService]})
export class AdminReportsModule{}
