type ServerEnvName =
  | "YANDEX_MAPS_API_KEY"
  | "NEXT_PUBLIC_YANDEX_MAPS_API_KEY"
  | "YANDEX_SUGGEST_API_KEY"
  | "NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY"
  | "YANDEX_GEOCODER_API_KEY";

// vinext may inline direct process.env access while building for a worker-like
// runtime. Keep the build-time values, but prefer Railway's real runtime env
// when the server is started from an already-built bundle.
const buildTimeEnv: Partial<Record<ServerEnvName, string>> = {
  YANDEX_MAPS_API_KEY: process.env.YANDEX_MAPS_API_KEY,
  NEXT_PUBLIC_YANDEX_MAPS_API_KEY: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY,
  YANDEX_SUGGEST_API_KEY: process.env.YANDEX_SUGGEST_API_KEY,
  NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY: process.env.NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY,
  YANDEX_GEOCODER_API_KEY: process.env.YANDEX_GEOCODER_API_KEY,
};

const runtimeEnv = () => (
  (globalThis as unknown as {
    process?: { env?: Partial<Record<ServerEnvName, string>> };
  }).process?.env
);

export function readServerEnv(...names: ServerEnvName[]) {
  const currentEnv = runtimeEnv();

  for (const name of names) {
    const runtimeValue = currentEnv?.[name]?.trim();
    if (runtimeValue) return runtimeValue;

    const buildTimeValue = buildTimeEnv[name]?.trim();
    if (buildTimeValue) return buildTimeValue;
  }

  return "";
}
