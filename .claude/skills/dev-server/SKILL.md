---
name: dev-server
description: Safely start, stop, restart, and inspect local development servers (Next.js, Vite, Node, etc.) during testing. Checks port occupancy, terminates orphaned background processes cleanly on Windows/Unix, launches servers in background, and verifies endpoint health. Use when asked to "start dev server", "stop dev server", "restart the server", "kill port 3000", "check server status", "test the dev server", or manage server processes.
argument-hint: "[start | stop | restart | status] [port (default: 3000)] [command (default: npm run dev)]"
---

# Dev Server Lifecycle Manager

Safely manage local development servers without port conflicts, lingering zombie processes, or terminal lockups during testing.

## Quick Actions

Parse `$ARGUMENTS`: action (`start`, `stop`, `restart`, `status`), optional `port` (default 3000), and optional `command`.

### 1. Check Status
Check if a server is currently running on the target port (default `3000`):

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.gemini\config\skills\dev-server\scripts\server-ctl.ps1" -Action status -Port 3000
```
*Or native command:*
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -Property LocalPort, OwningProcess
```

**macOS / Linux:**
```bash
lsof -i :3000
```

---

### 2. Stop / Kill Server
Safely and cleanly terminate any process listening on the target port (and its child processes):

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.gemini\config\skills\dev-server\scripts\server-ctl.ps1" -Action stop -Port 3000
```
*Or native tree-kill:*
```powershell
$pid = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { taskkill /PID $pid /F /T }
```

**macOS / Linux:**
```bash
lsof -ti :3000 | xargs kill -9 2>/dev/null
```

---

### 3. Start Server
Start the development server as a background daemon and verify it is healthy:

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.gemini\config\skills\dev-server\scripts\server-ctl.ps1" -Action start -Port 3000 -Command "npm.cmd run dev"
```
*Or via agent command tool:*
Launch `npm.cmd run dev` with `IsDaemon: true` and `WaitMsBeforeAsync: 3000`.

---

### 4. Restart Server
Cleanly stops any existing process on port 3000, waits for port release, and restarts:

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.gemini\config\skills\dev-server\scripts\server-ctl.ps1" -Action restart -Port 3000 -Command "npm.cmd run dev"
```

---

## Health Verification

Always verify the server responds with HTTP 200 before reporting success:

**Windows (PowerShell):**
```powershell
(Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3).StatusCode
```

**macOS / Linux:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

---

## Common Gotchas & Best Practices

1. **Port Occupancy / Zombie Node Processes**:
   On Windows, Ctrl+C in some terminals kills the parent wrapper but leaves orphaned `node.exe` processes holding port 3000. Always use `taskkill /F /T` or the script above to terminate the entire process tree.
2. **Path Environment in Windows PowerShell**:
   If Node/npm is not in the active session PATH, prepend `C:\Program Files\nodejs`:
   `$env:Path = "C:\Program Files\nodejs;" + $env:Path`
3. **Execution Policy**:
   Run PowerShell helper scripts with `-ExecutionPolicy Bypass` to prevent script execution policy blocks.
