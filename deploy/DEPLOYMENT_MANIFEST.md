# Deployment Package Manifest

**Package**: `deploy/backend/`
**Version**: firebase-admin 12.7.0
**Date**: 2025-10-13
**Total Size**: 75 MB

## Directory Structure

```
deploy/backend/
├── dist/                           # TypeScript compiled output
│   ├── functions/
│   │   ├── importSpecies.js        # Cloud function for species import
│   │   ├── importSpecies.d.ts
│   │   └── *.map files
│   ├── utils/                      # Utility functions (compiled)
│   │   ├── slug.js                 # Slug generation
│   │   ├── tokenize.js             # Search tokenization
│   │   ├── normalize.js            # Data normalization
│   │   ├── audit.js                # Audit logging
│   │   └── *.d.ts, *.map files
│   ├── index.js                    # Main entry point
│   └── index.d.ts
│
├── src/                            # TypeScript source files
│   ├── functions/
│   │   └── importSpecies.ts        # Cloud function source
│   ├── utils/
│   │   ├── slug.ts
│   │   ├── tokenize.ts
│   │   ├── normalize.ts
│   │   ├── audit.ts
│   │   └── __tests__/              # Unit tests (not deployed)
│   ├── index.ts                    # Main entry
│   └── server.ts                   # Express server
│
├── migrations/                     # Database migrations
│   └── 20251011_create_characters.sql
│
├── node_modules/                   # Production dependencies (74 MB)
│   ├── firebase-admin@12.7.0       # ⭐ UPGRADED from 11.10.1
│   ├── firebase-functions@5.1.1
│   ├── mysql2@3.15.2
│   ├── dotenv@16.4.5
│   ├── zod@3.23.0
│   └── [251 other packages]
│
├── firebaseAdmin.js                # Firebase Admin SDK helper (1.6 KB)
├── run-local-server.js             # Main API server (17 KB)
├── package.json                    # Dependencies manifest (694 B)
├── package-lock.json               # Locked versions
└── tsconfig.json                   # TypeScript config
```

## Key Files for Production

### Primary Entry Point
- **run-local-server.js** (17 KB) - Node.js HTTP server that handles all API routes

### Firebase Integration
- **firebaseAdmin.js** (1.6 KB) - Initializes Firebase Admin SDK, provides `verifyIdToken()`

### Database Migrations
- **migrations/20251011_create_characters.sql** - Characters table schema

### Compiled Functions (dist/)
- **dist/functions/importSpecies.js** - Cloud Function for batch species import
- **dist/utils/*.js** - Helper utilities (slug, tokenize, normalize, audit)

### Source Files (src/)
- **src/index.ts** - Cloud Functions exports
- **src/server.ts** - Express server setup
- **src/functions/importSpecies.ts** - Species import logic
- **src/utils/*.ts** - Utility function sources

## Dependencies Verification

### Core Dependencies (Production)
```json
{
  "firebase-admin": "^12.0.0",      // Installed: 12.7.0 ✅
  "firebase-functions": "^5.0.0",   // Installed: 5.1.1 ✅
  "mysql2": "^3.15.2",              // Installed: 3.15.2 ✅
  "dotenv": "^16.4.5",              // Installed: 16.4.5 ✅
  "zod": "^3.23.0"                  // Installed: 3.23.0 ✅
}
```

### Dev Dependencies (Not Included)
- @types/node
- typescript
- vitest

## File Sizes

| Item | Size | Notes |
|------|------|-------|
| node_modules/ | 74 MB | Production dependencies only |
| src/ | ~20 KB | TypeScript source files |
| dist/ | ~100 KB | Compiled JavaScript |
| run-local-server.js | 17 KB | Main server file |
| firebaseAdmin.js | 1.6 KB | Firebase helper |
| Total | 75 MB | Ready to deploy |

## What Changed from Previous Deployment

### Structure Changes
- ✅ Added `src/` directory (TypeScript sources)
- ✅ Added `dist/` directory (compiled JavaScript)
- ✅ Added `migrations/` directory (SQL migrations)
- ✅ Complete source tree now included

### Dependency Changes
- ⬆️ **firebase-admin**: 11.10.1 → 12.7.0 (MAJOR UPGRADE)
- ✅ All other dependencies unchanged

### Why This Matters
- **firebase-admin 12.7.0** requires WASM support (1GB virtual memory)
- Previous 11.10.1 was temporary workaround for WASM limit
- Now upgraded with proper memory allocation from iFastNet

## Production Upload Checklist

### 1. Verify Current Production Structure
Before uploading, confirm your current production has these directories:
- [ ] `dist/` directory exists
- [ ] `src/` directory exists
- [ ] `migrations/` directory exists
- [ ] `node_modules/` directory exists
- [ ] `run-local-server.js` exists
- [ ] `firebaseAdmin.js` exists

### 2. Backup Current Production
```bash
# On iFastNet server, create backup
cd /home/username/nodejs/
tar -czf star-wars-api-backup-$(date +%Y%m%d).tar.gz star-wars-api/
```

### 3. Upload New Package
Upload entire `deploy/backend/` contents to production directory, overwriting existing files.

**Important**: Upload `node_modules/` to ensure firebase-admin 12.7.0 is deployed.

### 4. Verify Upload
```bash
# On iFastNet server
cd /home/username/nodejs/star-wars-api
node -p "require('./package.json').dependencies['firebase-admin']"
# Should output: ^12.0.0

cd node_modules/firebase-admin
cat package.json | grep version
# Should show: "version": "12.7.0"
```

### 5. Restart Node.js App
In iFastNet control panel: Software → Node.js → Restart

## Differences from Incomplete Package

**Previous deploy/backend/ (Incorrect)**:
- ❌ Missing `src/` directory
- ❌ Missing `migrations/` directory
- ❌ Missing `dist/` directory
- ✅ Had firebase-admin 12.7.0

**Current deploy/backend/ (Correct)**:
- ✅ Complete `src/` directory with TypeScript sources
- ✅ Complete `migrations/` directory with SQL files
- ✅ Complete `dist/` directory with compiled JavaScript
- ✅ Has firebase-admin 12.7.0

## Verification Commands

### Local Verification (Before Upload)
```bash
cd deploy/backend

# Check structure
ls -la src/ dist/ migrations/

# Verify firebase-admin version
npm list firebase-admin

# Test local startup
node run-local-server.js
# Should start without errors, listen on port 4000
```

### Production Verification (After Upload)
```bash
# Check Node.js app status in iFastNet control panel
# Status should be: Running

# Test API endpoint
curl https://your-domain.com/api/species
# Should return JSON array of species

# Check logs for WASM errors
# Logs location: Check Node.js app logs in iFastNet panel
# Should NOT see: "WebAssembly.compile" errors
```

## Rollback Procedure

If deployment fails:

1. **Stop Node.js app** in iFastNet control panel
2. **Restore backup**:
   ```bash
   cd /home/username/nodejs/
   rm -rf star-wars-api/
   tar -xzf star-wars-api-backup-YYYYMMDD.tar.gz
   ```
3. **Restart Node.js app**
4. **Report issue** for troubleshooting

## Support Documentation

- **Technical Background**: [deploy/FIREBASE_ADMIN_UPGRADE.md](FIREBASE_ADMIN_UPGRADE.md)
- **Deployment Steps**: [deploy/DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)
- **iFastNet Guide**: [docs/IFASTNET_DEPLOYMENT.md](../docs/IFASTNET_DEPLOYMENT.md)
