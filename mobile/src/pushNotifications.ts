import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { PermissionsAndroid, Platform } from "react-native";
import { authApi } from "./api";
import { getDeviceId } from "./session";
import type { AuthSession } from "./types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function easProjectId() {
  return process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    || Constants.expoConfig?.extra?.eas?.projectId
    || Constants.easConfig?.projectId;
}

function pushIsAvailable() {
  return Platform.OS !== "web"
    && Device.isDevice
    && Constants.appOwnership !== "expo";
}

async function ensureOrderNotificationChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("orders", {
    name: "Статусы заказов",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 180, 250],
    lightColor: "#FF4D00",
  });
}

export async function requestOrderNotificationPermission() {
  if (Platform.OS === "web") {
    return { granted: false as const, status: "unsupported" as const };
  }

  await ensureOrderNotificationChannel();
  let permission = await Notifications.getPermissionsAsync();
  if (
    Platform.OS === "android"
    && Number(Platform.Version) >= 33
    && permission.status !== "granted"
  ) {
    // On Android 13+ request the runtime permission directly. In some
    // development/release builds expo-notifications returned the current
    // state without opening the native system dialog.
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    permission = await Notifications.getPermissionsAsync();
  } else if (permission.status !== "granted") {
    permission = await Notifications.requestPermissionsAsync();
  }

  return {
    granted: permission.status === "granted",
    status: permission.status,
  };
}

async function saveExpoPushToken(
  session: AuthSession,
  devicePushToken?: Notifications.DevicePushToken,
) {
  if (!pushIsAvailable()) {
    return { registered: false as const, reason: "development-build-required" as const };
  }
  const projectId = easProjectId();
  if (!projectId) {
    return { registered: false as const, reason: "project-id-missing" as const };
  }

  const [{ data: expoPushToken }, deviceId] = await Promise.all([
    Notifications.getExpoPushTokenAsync({ projectId, devicePushToken }),
    getDeviceId(),
  ]);
  await authApi.registerPushToken(session, {
    deviceId,
    expoPushToken,
    platform: Platform.OS as "android" | "ios",
  });
  return { registered: true as const, expoPushToken, deviceId };
}

export async function registerOrderPush(session: AuthSession, askPermission = true) {
  if (!pushIsAvailable()) {
    return { registered: false as const, reason: "development-build-required" as const };
  }

  await ensureOrderNotificationChannel();

  let permissions = await Notifications.getPermissionsAsync();
  if (askPermission && permissions.status !== "granted") {
    permissions = await Notifications.requestPermissionsAsync();
  }
  if (permissions.status !== "granted") {
    return { registered: false as const, reason: "permission-denied" as const };
  }

  return saveExpoPushToken(session);
}

export async function syncChangedOrderPushToken(
  session: AuthSession,
  devicePushToken: Notifications.DevicePushToken,
) {
  return saveExpoPushToken(session, devicePushToken);
}

export async function unregisterOrderPush(session: AuthSession) {
  if (Platform.OS === "web") return;
  const deviceId = await getDeviceId();
  await authApi.removePushToken(session, deviceId);
}
