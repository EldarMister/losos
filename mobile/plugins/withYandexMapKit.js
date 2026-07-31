const { withAppDelegate, withGradleProperties } = require("@expo/config-plugins");

const importBlock = "// @generated begin yandex-mapkit-import\nimport YandexMapsMobile\n// @generated end yandex-mapkit-import";
const initStart = "// @generated begin yandex-mapkit-init";
const initEnd = "// @generated end yandex-mapkit-init";

function escapeSwiftString(value) {
  return value.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");
}

/**
 * MapKit has to receive its key before the first map view is created on iOS.
 * Android is initialised from JavaScript by react-native-yamap.
 */
function withYandexMapKit(config) {
  const apiKey = (
    process.env.YANDEX_MAPKIT_API_KEY
    || process.env.EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY
    || ""
  ).trim();

  config = withGradleProperties(config, (config) => {
    const property = config.modResults.find(
      (item) => item.type === "property" && item.key === "android.minSdkVersion",
    );
    if (property) {
      property.value = "26";
    } else {
      config.modResults.push({
        type: "property",
        key: "android.minSdkVersion",
        value: "26",
      });
    }
    return config;
  });

  return withAppDelegate(config, (config) => {
    if (!apiKey) return config;
    if (config.modResults.language !== "swift") {
      throw new Error("Yandex MapKit config plugin requires a Swift AppDelegate.");
    }

    let contents = config.modResults.contents;
    if (!contents.includes(importBlock)) {
      contents = contents.replace(
        /import Expo\n/,
        `import Expo\n${importBlock}\n`,
      );
    }

    if (!contents.includes(initStart)) {
      const initBlock = [
        initStart,
        `YMKMapKit.setApiKey(\"${escapeSwiftString(apiKey)}\")`,
        "YMKMapKit.sharedInstance().onStart()",
        initEnd,
      ].join("\n      ");
      const returnStatement = /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/;
      if (!returnStatement.test(contents)) {
        throw new Error("Could not find the Expo AppDelegate launch method for Yandex MapKit setup.");
      }
      contents = contents.replace(returnStatement, `${initBlock}\n      return super.application(application, didFinishLaunchingWithOptions: launchOptions)`);
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withYandexMapKit;
