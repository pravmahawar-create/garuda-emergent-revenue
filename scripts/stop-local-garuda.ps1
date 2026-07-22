$ErrorActionPreference = "Stop"
$ports = @(3000, 4001, 3001)
$stopped = @()
foreach ($port in $ports) {
  $pids = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
  foreach ($processId in $pids) {
    if ($processId -gt 0) {
      Stop-Process -Id $processId -Force
      $stopped += "port $port / PID $processId"
    }
  }
}
if ($stopped.Count) { Write-Host "Stopped GARUDA processes: $($stopped -join ', ')" } else { Write-Host "No GARUDA listeners found on ports 3000, 4001, or 3001." }
