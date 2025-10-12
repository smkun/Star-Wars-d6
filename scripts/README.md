# Development Scripts

Utility scripts for development, deployment, and database operations.

## Development Launchers

### Quick Start (Recommended)

```bash
npm run dev
```

This runs `scripts/dev.js` which starts both MySQL API (port 4000) and Vite dev server (port 5173) in a single process.

### dev.js (Cross-Platform)

**Node.js-based launcher** - Works on Windows, macOS, Linux

```bash
# Via npm (recommended)
npm run dev
npm run dev:all

# Direct invocation
node scripts/dev.js
```

**Features:**
- ✓ Cross-platform (Windows, macOS, Linux)
- ✓ Environment validation
- ✓ Process management (starts/stops both servers)
- ✓ Colored output with prefixes
- ✓ Graceful shutdown with Ctrl+C
- ✓ Automatic .env loading

**Output:**
```
╔═══════════════════════════════════════╗
║  Star Wars d6 Development Launcher   ║
╚═══════════════════════════════════════╝

✓ Node.js v20.12.0
✓ .env file loaded
✓ MYSQL_URL configured
✓ mysql2 installed

[API] Local API listening on 4000
✓ API ready at http://localhost:4000

[Web] VITE ready in 234 ms
✓ Web ready at http://localhost:5173
```

### dev.sh (Advanced - Linux/macOS)

**Bash-based launcher** - Linux/macOS only, more options

```bash
# Basic usage
./scripts/dev.sh

# Check environment only
./scripts/dev.sh --check

# Start API server only
./scripts/dev.sh --api-only

# Start web server only
./scripts/dev.sh --web-only

# Skip port cleanup
./scripts/dev.sh --no-cleanup

# Show help
./scripts/dev.sh --help
```

**Features:**
- ✓ Advanced options (--api-only, --web-only, --check)
- ✓ Port conflict detection and cleanup
- ✓ Detailed environment checks
- ✓ Process logging (api.log, web.log)
- ✓ Colorful banners and status

**Use when:**
- You need advanced control (start API or Web separately)
- You want detailed environment validation
- You prefer bash scripting
- Running on Linux/macOS

## Database Scripts

### update-mysql-from-aliens-json.js

Migrates species data from ALIENS.json to MySQL database.

```bash
node scripts/update-mysql-from-aliens-json.js
```

Merges: `stats`, `personality`, `physicalDescription`, `adventurers`, `languages`, `sources`

### link-starship-images.js

Links existing starship images to database records.

```bash
node scripts/link-starship-images.js
```

Uses slug-based and name-based matching strategies.

### download-capital-ship-images.js

Downloads missing capital ship images from d6 Holocron MediaWiki API.

```bash
# Test with first 5 images
node scripts/download-capital-ship-images.js --test

# Download all missing images
node scripts/download-capital-ship-images.js
```

## Deployment Scripts

### deploy-frontend.sh

Builds frontend and updates deployment package.

```bash
./scripts/deploy-frontend.sh
```

Steps:
1. Builds web app (`npm run build:web`)
2. Clears `deploy/frontend/`
3. Copies new build files
4. Bundles .htaccess for React Router

## Firebase Scripts

### set-admin-claim.js

Sets admin custom claim for Firebase user.

```bash
# Set admin claim
node scripts/set-admin-claim.js user@example.com

# With environment variable
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-admin-key.json
node scripts/set-admin-claim.js user@example.com
```

Requires Firebase Admin SDK credentials.

## Testing Scripts

### puppeteer-smoke.js

Smoke test for Puppeteer/Chromium availability.

```bash
npm run smoke:puppeteer
```

Verifies headless browser can launch (for CI/CD).

### playwright-smoke.js

Smoke test for Playwright availability.

```bash
npm run smoke:playwright
```

Verifies E2E testing framework is ready.

## Script Comparison

| Script | Platform | Purpose | Recommended |
|--------|----------|---------|-------------|
| **dev.js** | Windows/Mac/Linux | Quick dev start | ✓ Default |
| **dev.sh** | Mac/Linux only | Advanced dev control | Power users |
| **update-mysql-from-aliens-json.js** | All | Data migration | One-time |
| **link-starship-images.js** | All | Image linking | As needed |
| **download-capital-ship-images.js** | All | Image download | As needed |
| **deploy-frontend.sh** | Mac/Linux | Build deployment | Pre-deploy |
| **set-admin-claim.js** | All | Admin setup | Initial setup |

## Quick Reference

```bash
# Development (choose one)
npm run dev                          # Cross-platform (dev.js)
./scripts/dev.sh                     # Bash with more options

# Database operations
node scripts/update-mysql-from-aliens-json.js
node scripts/link-starship-images.js
node scripts/download-capital-ship-images.js

# Deployment
./scripts/deploy-frontend.sh

# Admin setup
node scripts/set-admin-claim.js user@example.com

# Testing
npm run smoke:puppeteer
npm run smoke:playwright
```

## Environment Requirements

All scripts require:
- Node.js 20.0.0+
- npm 10.0.0+

Additional requirements:
- **Database scripts**: `MYSQL_URL` environment variable
- **Firebase scripts**: `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT`
- **Bash scripts**: Linux or macOS

## See Also

- [docs/DEV_LAUNCHER.md](../docs/DEV_LAUNCHER.md) - Detailed launcher documentation
- [dev/LOCAL_DEV_SETUP.md](../dev/LOCAL_DEV_SETUP.md) - Local development architecture
- [CLAUDE.md](../CLAUDE.md) - Project instructions and quick reference
