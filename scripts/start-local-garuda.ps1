param([switch]$NoBrowser)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$workspaceRoot = Split-Path $repoRoot -Parent
$coreRoot = Join-Path $workspaceRoot "GARUDA-AI"
$backendRoot = Join-Path $repoRoot "backend-node"
$frontendRoot = Join-Path $repoRoot "frontend"
$runtimeRoot = Join-Path $repoRoot ".garuda-runtime"

foreach ($path in @($coreRoot, $backendRoot, $frontendRoot)) {
  if (-not (Test-Path -LiteralPath $path)) { throw "Required GARUDA directory not found: $path" }
}
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null

function Test-Endpoint([string]$Url) {
  try { return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { return $false }
}

$health = @(
  @{ Name = "Core"; Url = "http://127.0.0.1:3000/api/health"; Port = 3000 },
  @{ Name = "Revenue backend"; Url = "http://127.0.0.1:4001/health"; Port = 4001 },
  @{ Name = "Frontend"; Url = "http://127.0.0.1:3001"; Port = 3001 }
)
if (@($health | Where-Object { Test-Endpoint $_.Url }).Count -eq $health.Count) {
  Write-Host "GARUDA local stack is already healthy."
  if (-not $NoBrowser) { Start-Process "http://localhost:3001/execution-missions" }
  exit 0
}

$occupied = foreach ($item in $health) {
  $connection = Get-NetTCPConnection -LocalPort $item.Port -State Listen -ErrorAction SilentlyContinue
  if ($connection) { $item.Port }
}
if ($occupied) { throw "Ports already occupied but the stack is not healthy: $($occupied -join ', '). Run scripts\stop-local-garuda.ps1 first." }

function Start-GarudaProcess([string]$Name, [string]$WorkingDirectory, [string]$Command) {
  $stdout = Join-Path $runtimeRoot "$Name.out.log"
  $stderr = Join-Path $runtimeRoot "$Name.err.log"
  return Start-Process powershell -WindowStyle Hidden -PassThru -WorkingDirectory $WorkingDirectory -ArgumentList @("-NoProfile", "-Command", $Command) -RedirectStandardOutput $stdout -RedirectStandardError $stderr
}

$core = Start-GarudaProcess "core" $coreRoot "npm start"
$backend = Start-GarudaProcess "backend" $backendRoot "npm start"
$frontend = Start-GarudaProcess "frontend" $frontendRoot "`$env:PORT='3001'; `$env:BROWSER='none'; `$env:REACT_APP_BACKEND_URL='http://localhost:4001'; npm start"
@{ core = $core.Id; backend = $backend.Id; frontend = $frontend.Id; startedAt = (Get-Date).ToString("o") } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimeRoot "pids.json")

$deadline = (Get-Date).AddSeconds(90)
do {
  $ready = @($health | Where-Object { Test-Endpoint $_.Url }).Count
  if ($ready -eq $health.Count) { break }
  Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)

if ($ready -ne $health.Count) {
  foreach ($process in @($core, $backend, $frontend)) {
    if ($process -and -not $process.HasExited) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  }
  throw "GARUDA did not become healthy within 90 seconds. Check .garuda-runtime logs."
}

Write-Host "GARUDA local stack healthy: Core 3000, Revenue 4001, Frontend 3001."
Write-Host "Stop safely with: powershell -ExecutionPolicy Bypass -File scripts\stop-local-garuda.ps1"
if (-not $NoBrowser) { Start-Process "http://localhost:3001/execution-missions" }
