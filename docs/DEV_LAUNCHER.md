# Development Launcher

Quick-start scripts for local development that manage both MySQL API and Vite dev servers.

## Quick Start

```bash
# Start both servers (recommended)
npm run dev

# Alternative explicit command
npm run dev:all
```

That's it! The launcher will:
1. ✓ Check environment (Node.js version, dependencies, .env file)
2. ✓ Start MySQL API on port 4000
3. ✓ Start Vite dev server on port 5173
4. ✓ Display ready status and URLs
5. ✓ Handle graceful shutdown with Ctrl+C

## Prerequisites

1. **Create `.env` file** (one-time setup):
   ```bash
   cp .env.example .env
   # Edit .env and add your MySQL credentials
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

## Available Commands

### Start Everything (Recommended)
```bash
npm run dev
# or
npm run dev:all
```

**Output:**
```
╔═══════════════════════════════════════╗
║  Star Wars d6 Development Launcher   ║
╚═══════════════════════════════════════╝

✓ Node.js v20.12.0
✓ .env file loaded
✓ MYSQL_URL configured
✓ mysql2 installed
✓ Environment check passed

ℹ Starting API...
[API] Local API listening on 4000
✓ API ready at http://localhost:4000
  GET /species - List all species
  GET /species/:slug - Get species by slug

ℹ Starting Web...
[Web] VITE v5.x.x ready in xxx ms
[Web] ➜ Local: http://localhost:5173/
✓ Web ready at http://localhost:5173
  Home:    http://localhost:5173/
  Species: http://localhost:5173/species
  Ships:   http://localhost:5173/starships

═══════════════════════════════════════
Development servers running!
═══════════════════════════════════════

MySQL API:    http://localhost:4000 (PID: 12345)
Vite Server:  http://localhost:5173 (PID: 12346)

Press Ctrl+C to stop all servers
```

### Individual Servers

Start only MySQL API:
```bash
npm run dev:mysql-api
```

Start only Vite dev server:
```bash
npm run dev:web
```

### Bash Script (Linux/macOS)

Advanced usage with options:
```bash
# Check environment without starting
./scripts/dev.sh --check

# Start API only
./scripts/dev.sh --api-only

# Start web only
./scripts/dev.sh --web-only

# Skip port cleanup
./scripts/dev.sh --no-cleanup

# Show help
./scripts/dev.sh --help
```

## Features

### ✅ Environment Validation
- Checks Node.js version (≥20.0.0)
- Verifies `.env` file exists and loads it
- Validates `MYSQL_URL` is configured
- Confirms `mysql2` dependency is installed

### ✅ Port Management
- Automatically detects port conflicts (4000, 5173)
- Kills existing processes on those ports (optional)
- Clean shutdown on Ctrl+C

### ✅ Process Management
- Starts both servers in correct order (API first, then Web)
- Waits for each server to be ready before continuing
- Captures and displays colored output from both servers
- Tracks PIDs for clean shutdown

### ✅ Error Handling
- Validates environment before starting
- Provides helpful error messages
- Logs process output to files (api.log, web.log)
- Graceful cleanup on failure or interruption

### ✅ Cross-Platform
- **Node.js script** (`scripts/dev.js`): Works on Windows, macOS, Linux
- **Bash script** (`scripts/dev.sh`): Linux/macOS with advanced options

## Architecture

```
┌─────────────────────────────────────────────────┐
│  npm run dev (or npm run dev:all)              │
│  → node scripts/dev.js                          │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│  MySQL API    │       │  Vite Server  │
│  Port 4000    │◄──────│  Port 5173    │
│               │ Proxy │               │
└───────────────┘ /api  └───────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│  MySQL DB     │       │  Browser      │
│  31.22.4.44   │       │  localhost    │
└───────────────┘       └───────────────┘
```

## Ports

| Service | Port | URL |
|---------|------|-----|
| MySQL API | 4000 | http://localhost:4000 |
| Vite Dev Server | 5173 | http://localhost:5173 |

## Environment Variables

Required in `.env` file:

```bash
# MySQL Database Connection
MYSQL_URL=mysql://username:password@host:3306/gamers_d6Holochron

# Firebase Admin SDK (for authentication)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-admin-key.json
```

## Troubleshooting

### Port 4000 or 5173 Already in Use

**Symptom:**
```
⚠ Port 4000 in use
```

**Solution:**
```bash
# Kill process manually
lsof -ti:4000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Or use --no-cleanup flag
./scripts/dev.sh --no-cleanup
```

### MYSQL_URL Not Set

**Symptom:**
```
✗ MYSQL_URL not set
```

**Solution:**
1. Create `.env` file from template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your MySQL credentials:
   ```bash
   MYSQL_URL=mysql://your_user:your_pass@31.22.4.44:3306/gamers_d6Holochron
   ```

### mysql2 Not Installed

**Symptom:**
```
⚠ mysql2 not installed
```

**Solution:**
```bash
npm install
```

### API Not Responding

**Symptom:**
```
✗ API failed to start
```

**Solution:**
1. Check api.log for errors:
   ```bash
   tail -f api.log
   ```

2. Verify MySQL credentials:
   ```bash
   node -e "console.log(require('fs').readFileSync('.env', 'utf8'))"
   ```

3. Test MySQL connection:
   ```bash
   npm run dev:mysql-api
   # Check for connection errors
   ```

### Vite Not Starting

**Symptom:**
```
✗ Vite failed to start
```

**Solution:**
1. Check web.log for errors:
   ```bash
   tail -f web.log
   ```

2. Try starting Vite alone:
   ```bash
   npm run dev:web
   ```

3. Clear Vite cache:
   ```bash
   rm -rf web/node_modules/.vite
   npm run dev:web
   ```

### Ctrl+C Not Stopping Servers

**Symptom:**
Processes remain after Ctrl+C

**Solution:**
```bash
# Manual cleanup
lsof -ti:4000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Or use pkill
pkill -f "run-local-server"
pkill -f "vite"
```

## Log Files

Both scripts create log files for debugging:

- `api.log` - MySQL API server output
- `web.log` - Vite dev server output

View logs in real-time:
```bash
# API logs
tail -f api.log

# Vite logs
tail -f web.log

# Both (split terminal)
tail -f api.log & tail -f web.log
```

## Comparison: Node.js vs Bash

| Feature | Node.js (`dev.js`) | Bash (`dev.sh`) |
|---------|-------------------|-----------------|
| **Platform** | Windows, macOS, Linux | macOS, Linux only |
| **Options** | Basic | Advanced (--api-only, --web-only, etc.) |
| **Output** | Colored, interleaved | Colored, prefixed |
| **Recommended** | ✓ Default (cross-platform) | Advanced users |

## Advanced Usage

### Bash Script Options

```bash
# Environment check only
./scripts/dev.sh --check

# Start API server only
./scripts/dev.sh --api-only

# Start web server only
./scripts/dev.sh --web-only

# Skip automatic port cleanup
./scripts/dev.sh --no-cleanup

# Show help
./scripts/dev.sh --help
```

### Running in Background (tmux/screen)

**tmux:**
```bash
# Create session
tmux new -s dev

# Run launcher
npm run dev

# Detach: Ctrl+B, then D
# Reattach: tmux attach -t dev
```

**screen:**
```bash
# Create session
screen -S dev

# Run launcher
npm run dev

# Detach: Ctrl+A, then D
# Reattach: screen -r dev
```

### PM2 (Production-like)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start scripts/dev.js --name dev

# View logs
pm2 logs dev

# Stop
pm2 stop dev
pm2 delete dev
```

## Integration with CLAUDE.md

The Quick Reference section in [CLAUDE.md](../CLAUDE.md#quick-reference) has been updated to reference this launcher:

```bash
# Start development (single command)
npm run dev

# Opens:
# - MySQL API at http://localhost:4000
# - Vite dev server at http://localhost:5173
```

## Next Steps

After starting the dev servers:

1. **Open browser:** http://localhost:5173
2. **Test API:** http://localhost:4000/species
3. **Make changes:** Edit files in `web/src/`
4. **Hot reload:** Vite automatically reloads on save

## See Also

- [Local Development Setup](LOCAL_DEV_SETUP.md) - Detailed architecture and manual setup
- [CLAUDE.md](../CLAUDE.md) - Project instructions and quick reference
- [.env.example](../.env.example) - Environment variable template
