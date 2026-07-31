import * as SecureStore from "expo-secure-store";
import type { AuthSession } from "./types";

const SESSION_KEY = "nakta.mobile.auth-session.v1";
const DEVICE_ID_KEY = "nakta.mobile.device-id.v1";

function isSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AuthSession>;
  return (
    typeof session.phone === "string"
    && typeof session.verificationToken === "string"
    && /^[a-f0-9]{64}$/.test(session.verificationToken)
    && typeof session.expiresAt === "number"
  );
}

export async function readSession() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSession(parsed) || parsed.expiresAt <= Date.now()) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
}

export async function writeSession(session: AuthSession) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

function uuidV4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    return (character === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
}

export async function getDeviceId() {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const deviceId = uuidV4();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return deviceId;
}
