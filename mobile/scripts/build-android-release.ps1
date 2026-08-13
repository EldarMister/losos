$ErrorActionPreference = "Stop"

$mobileRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envFile = Join-Path $mobileRoot ".env.local"
if (!(Test-Path -LiteralPath $envFile)) {
  throw "Create mobile/.env.local before building the APK."
}

foreach ($line in Get-Content -LiteralPath $envFile) {
  if ($line -match '^\s*#' -or $line -notmatch '^\s*([^=]+)=(.*)$') { continue }
  $name = $Matches[1].Trim()
  $value = $Matches[2].Trim()
  [Environment]::SetEnvironmentVariable($name, $value, "Process")
}

$mapKitKey = [Environment]::GetEnvironmentVariable(
  "EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY",
  "Process"
)
if ([string]::IsNullOrWhiteSpace($mapKitKey)) {
  throw "EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY is required for a release APK."
}
[Environment]::SetEnvironmentVariable("NODE_ENV", "production", "Process")

$androidRoot = Join-Path $mobileRoot "android"
Push-Location $mobileRoot
try {
  & npx expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw "Expo Android prebuild failed." }
} finally {
  Pop-Location
}

$generatedReleaseResources = [IO.Path]::GetFullPath((Join-Path $androidRoot "app\build\generated\res\createBundleReleaseJsAndAssets"))
$expectedBuildRoot = [IO.Path]::GetFullPath((Join-Path $androidRoot "app\build"))
if (!$generatedReleaseResources.StartsWith($expectedBuildRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to clean a path outside android/app/build."
}
if (Test-Path -LiteralPath $generatedReleaseResources) {
  Remove-Item -LiteralPath $generatedReleaseResources -Recurse -Force
}
Push-Location $androidRoot
try {
  & .\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
  if ($LASTEXITCODE -ne 0) { throw "Gradle release build failed." }
} finally {
  Pop-Location
}

$sourceApk = Join-Path $androidRoot "app\build\outputs\apk\release\app-release.apk"
if (!(Test-Path -LiteralPath $sourceApk)) { throw "Release APK was not created." }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead($sourceApk)
try {
  $entry = $archive.GetEntry("assets/index.android.bundle")
  if (!$entry) { throw "Release APK does not contain the JavaScript bundle." }
  $stream = $entry.Open()
  $memory = New-Object IO.MemoryStream
  try {
    $stream.CopyTo($memory)
    $bundleText = [Text.Encoding]::ASCII.GetString($memory.ToArray())
    if (!$bundleText.Contains($mapKitKey)) {
      throw "Release APK does not contain the MapKit key; publication stopped."
    }
  } finally {
    $stream.Dispose()
    $memory.Dispose()
  }
} finally {
  $archive.Dispose()
}

$outputDirectory = Join-Path $mobileRoot "build-output"
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$outputApk = Join-Path $outputDirectory "nakta-sushi.apk"
Copy-Item -LiteralPath $sourceApk -Destination $outputApk -Force
Write-Output "Release APK ready: $outputApk"
