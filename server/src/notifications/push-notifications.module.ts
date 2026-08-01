import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DevicePushToken } from "../auth/device-push-token.entity";
import { PushNotificationsService } from "./push-notifications.service";

@Module({
  imports: [TypeOrmModule.forFeature([DevicePushToken])],
  providers: [PushNotificationsService],
  exports: [PushNotificationsService],
})
export class PushNotificationsModule {}
