const { withGradleProperties } = require("@expo/config-plugins");

const RELEASE_PROPERTIES = {
  reactNativeArchitectures: "arm64-v8a",
  "android.enableMinifyInReleaseBuilds": "true",
  "android.enableShrinkResourcesInReleaseBuilds": "true",
  "android.enablePngCrunchInReleaseBuilds": "true",
  "expo.useLegacyPackaging": "true",
};

function setGradleProperty(properties, key, value) {
  const existing = properties.find(
    (item) => item.type === "property" && item.key === key,
  );
  if (existing) {
    existing.value = value;
  } else {
    properties.push({ type: "property", key, value });
  }
}

function withAndroidReleaseSize(config) {
  return withGradleProperties(config, (config) => {
    for (const [key, value] of Object.entries(RELEASE_PROPERTIES)) {
      setGradleProperty(config.modResults, key, value);
    }
    return config;
  });
}

module.exports = withAndroidReleaseSize;
