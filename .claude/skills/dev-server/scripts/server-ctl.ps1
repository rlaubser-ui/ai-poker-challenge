<#
.SYNOPSIS
  Safely start, stop, restart, and inspect local development servers on Windows.
.EXAMPLE
  .\server-ctl.ps1 -Action status -Port 3000
  .\server-ctl.ps1 -Action stop -Port 3000
  .\server-ctl.ps1 -Action start -Port 3000 -Command "npm.cmd run dev"
  .\server-ctl.ps1 -Action restart -Port 3000
#>

param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("start", "stop", "restart", "status")]
  [string]$Action,

  [int]$Port = 3000,
  [string]$Command = "npm.cmd run dev",
  [string]$HealthUrl = "http://localhost:$Port"
)

# Ensure Node and npm paths are available
if ($env:Path -notlike "*C:\Program Files\nodejs*") {
  $env:Path = "C:\Program Files\nodejs;" + $env:Path
}

function Get-PortPID {
  param([int]$TargetPort)
  $conns = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue
  if ($conns) {
    return ($conns.OwningProcess | Select-Object -Unique)
  }
  return $null
}

function Stop-DevServer {
  param([int]$TargetPort)
  $pids = Get-PortPID -TargetPort $TargetPort
  if (-not $pids) {
    Write-Host "No process listening on port $TargetPort." -ForegroundColor Yellow
    return $true
  }

  Write-Host "Terminating process(es) on port $TargetPort (PID(s): $($pids -join ', '))..." -ForegroundColor Cyan
  foreach ($p in $pids) {
    try {
      # Use taskkill with tree flag (/T) to ensure child node processes are terminated
      taskkill /PID $p /F /T 2>$null | Out-Null
    } catch {
      Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
  }

  # Wait for port release
  $timeout = 5
  while ($timeout -gt 0) {
    Start-Sleep -Seconds 1
    $remaining = Get-PortPID -TargetPort $TargetPort
    if (-not $remaining) {
      Write-Host "Port $TargetPort is now free." -ForegroundColor Green
      return $true
    }
    $timeout--
  }

  Write-Host "Warning: Port $TargetPort may still be occupied." -ForegroundColor Red
  return $false
}

function Check-Health {
  param([string]$Url)
  $testUrls = @($Url, ($Url -replace "localhost", "127.0.0.1")) | Select-Object -Unique
  foreach ($u in $testUrls) {
    try {
      $res = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
      if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 400) {
        return $true
      }
    } catch {}
  }
  return $false
}

function Start-DevServer {
  param(
    [int]$TargetPort,
    [string]$StartCommand,
    [string]$Url
  )

  $existing = Get-PortPID -TargetPort $TargetPort
  if ($existing) {
    Write-Host "Port $TargetPort is already occupied by PID(s): $($existing -join ', ')." -ForegroundColor Yellow
    Write-Host "Use -Action restart to cleanly terminate and restart." -ForegroundColor Yellow
    return $false
  }

  Write-Host "Launching dev server in background: $StartCommand..." -ForegroundColor Cyan
  
  $currentDir = (Get-Location).Path
  Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -NoProfile -Command `"`$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; Set-Location -Path '$currentDir'; $StartCommand`"" -WorkingDirectory $currentDir -WindowStyle Hidden

  Write-Host "Waiting for server to become healthy on $Url..." -ForegroundColor Cyan
  $maxAttempts = 15
  for ($i = 1; $i -le $maxAttempts; $i++) {
    Start-Sleep -Seconds 1
    if (Check-Health -Url $Url) {
      $newPid = Get-PortPID -TargetPort $TargetPort
      Write-Host "Server is UP and healthy on $Url (PID: $newPid)!" -ForegroundColor Green
      return $true
    }
  }

  $pidCheck = Get-PortPID -TargetPort $TargetPort
  if ($pidCheck) {
    Write-Host "Server is listening on port $TargetPort (PID: $pidCheck) but health check did not respond yet." -ForegroundColor Yellow
    return $true
  }

  Write-Host "Server failed to start or did not respond within $maxAttempts seconds." -ForegroundColor Red
  return $false
}

function Get-ServerStatus {
  param(
    [int]$TargetPort,
    [string]$Url
  )

  $pids = Get-PortPID -TargetPort $TargetPort
  if ($pids) {
    $procNames = ($pids | ForEach-Object { (Get-Process -Id $_ -ErrorAction SilentlyContinue).ProcessName }) -join ", "
    Write-Host "Port ${TargetPort}: OCCUPIED (PID(s): $($pids -join ', ') - $procNames)" -ForegroundColor Green
    if (Check-Health -Url $Url) {
      Write-Host "Health Check: $Url is RESPONDING (HTTP 200 OK)" -ForegroundColor Green
    } else {
      Write-Host "Health Check: $Url is NOT responding" -ForegroundColor Yellow
    }
  } else {
    Write-Host "Port ${TargetPort}: FREE (No server running)" -ForegroundColor DarkGray
  }
}

switch ($Action) {
  "stop" {
    Stop-DevServer -TargetPort $Port
  }
  "start" {
    Start-DevServer -TargetPort $Port -StartCommand $Command -Url $HealthUrl
  }
  "restart" {
    Stop-DevServer -TargetPort $Port
    Start-Sleep -Seconds 1
    Start-DevServer -TargetPort $Port -StartCommand $Command -Url $HealthUrl
  }
  "status" {
    Get-ServerStatus -TargetPort $Port -Url $HealthUrl
  }
}
