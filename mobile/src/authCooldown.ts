import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "nakta:sms-cooldown:v1:";

function key(phone: string) {
  return `${KEY_PREFIX}${phone.replace(/\D/g, "")}`;
}

export async function getSmsCooldownSeconds(phone: string) {
  const stored = await AsyncStorage.getItem(key(phone));
  const endsAt = Number(stored);
  if (!Number.isFinite(endsAt)) return 0;
  const seconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1_000));
  if (seconds === 0) await AsyncStorage.removeItem(key(phone));
  return seconds;
}

export async function saveSmsCooldown(phone: string, seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  if (safeSeconds === 0) {
    await AsyncStorage.removeItem(key(phone));
    return;
  }
  await AsyncStorage.setItem(key(phone), String(Date.now() + safeSeconds * 1_000));
}
