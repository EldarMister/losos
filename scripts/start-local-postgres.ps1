$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $workspace ".postgres-data"
$postgresRoot = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction Stop |
  Sort-Object { [int]$_.Name } -Descending |
  Select-Object -First 1

if (-not $postgresRoot) {
  throw "PostgreSQL is not installed. Use Docker Compose instead: npm run db:docker"
}

$binPath = Join-Path $postgresRoot.FullName "bin"
$initDb = Join-Path $binPath "initdb.exe"
$pgCtl = Join-Path $binPath "pg_ctl.exe"
$createdb = Join-Path $binPath "createdb.exe"
$isReady = Join-Path $binPath "pg_isready.exe"
$logPath = Join-Path $dataPath "postgres.log"

if (-not (Test-Path $dataPath)) {
  & $initDb -D $dataPath -U losos --auth=trust --encoding=UTF8 --no-locale
}

& $isReady -h 127.0.0.1 -p 55432 *> $null
if ($LASTEXITCODE -ne 0) {
  & $pgCtl -D $dataPath -l $logPath -o '"-p 55432"' start
}

& $createdb -h 127.0.0.1 -p 55432 -U losos losos 2>$null
Write-Output "PostgreSQL is ready: postgresql://losos@127.0.0.1:55432/losos"
