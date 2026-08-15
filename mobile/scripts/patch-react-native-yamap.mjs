import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const packageRoot = resolve("node_modules/react-native-yamap");

function updateFile(relativePath, update, verify) {
  const path = resolve(packageRoot, relativePath);
  const original = readFileSync(path, "utf8");
  const updated = update(original);
  if (!verify(updated)) {
    throw new Error(`Unexpected react-native-yamap source in ${relativePath}`);
  }
  if (updated !== original) writeFileSync(path, updated);
}

function makeEventMapMutable(source, functionName) {
  const signature = `override fun ${functionName}`;
  const start = source.indexOf(signature);
  if (start < 0) throw new Error(`Missing ${functionName}`);
  const end = source.indexOf("\n    }", start);
  if (end < 0) throw new Error(`Incomplete ${functionName}`);
  let block = source.slice(start, end);
  block = block.replace(": Map<String, Any>?", ": MutableMap<String, Any>?");
  if (!block.includes(".build().toMutableMap()")) {
    const build = block.lastIndexOf(".build()");
    if (build < 0) throw new Error(`Missing MapBuilder result in ${functionName}`);
    block = `${block.slice(0, build)}.build().toMutableMap()${block.slice(build + ".build()".length)}`;
  }
  return `${source.slice(0, start)}${block}${source.slice(end)}`;
}

updateFile(
  "android/build.gradle",
  (source) => source
    .replace("safeExtGet('playServicesLocationVersion', \"+\")", "safeExtGet('playServicesLocationVersion', \"21.3.0\")")
    .replace(
      "implementation 'com.google.android.gms:play-services-location:$GOOGLE_PLAY_SERVICES_LOCATION_VERSION'",
      'implementation "com.google.android.gms:play-services-location:${GOOGLE_PLAY_SERVICES_LOCATION_VERSION}"',
    )
    .replace("com.yandex.android:maps.mobile:4.19.0-full", "com.yandex.android:maps.mobile:4.39.1-full"),
  (source) => source.includes('playServicesLocationVersion\', "21.3.0"')
    && source.includes('play-services-location:${GOOGLE_PLAY_SERVICES_LOCATION_VERSION}')
    && source.includes("com.yandex.android:maps.mobile:4.39.1-full"),
);

const managerFiles = [
  "ClusteredYamapViewManager.kt",
  "YamapCircleManager.kt",
  "YamapMarkerManager.kt",
  "YamapPolygonManager.kt",
  "YamapPolylineManager.kt",
  "YamapViewManager.kt",
];

for (const file of managerFiles) {
  updateFile(
    `android/src/main/java/ru/vvdev/yamap/${file}`,
    (source) => makeEventMapMutable(
      makeEventMapMutable(source, "getExportedCustomDirectEventTypeConstants()"),
      "getExportedCustomBubblingEventTypeConstants()",
    ),
    (source) => {
      const mutableResults = source.match(/\.build\(\)\.toMutableMap\(\)/g) ?? [];
      return mutableResults.length >= 2;
    },
  );
}

updateFile(
  "android/src/main/java/ru/vvdev/yamap/view/YamapView.kt",
  (source) => source.replace(
    "Arguments.fromList(value)",
    "Arguments.fromList(value ?: emptyList<String?>())",
  ),
  (source) => source.includes("Arguments.fromList(value ?: emptyList<String?>())"),
);

console.log("react-native-yamap Android compatibility patch applied");
