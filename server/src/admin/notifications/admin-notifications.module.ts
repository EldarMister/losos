import { Module } from "@nestjs/common";
import { AdminSecurityModule } from "../admin-security.module";
import { AdminNotificationsController } from "./admin-notifications.controller";
import { AdminNotificationsService } from "./admin-notifications.service";

@Module({ imports: [AdminSecurityModule], controllers: [AdminNotificationsController], providers: [AdminNotificationsService] })
export class AdminNotificationsModule {}
