# Production Deployment Structure - CORRECT VERSION

## Your Current Production Structure

Based on what you have online:

```
/nodejs/star-wars-api/
├── api/                    ← All backend code in this folder
│   ├── dist/               ← Compiled TypeScript
│   ├── src/                ← TypeScript sources
│   ├── migrations/         ← SQL files
│   ├── node_modules/       ← (if present, remove - use root level)
│   ├── firebaseAdmin.js
│   ├── run-local-server.js
│   ├── package.json
│   └── tsconfig.json
├── node_modules/           ← Dependencies at root level (THIS IS WHERE IT SHOULD BE)
├── Public/                 ← (Not sure what this is - possibly frontend?)
├── tmp/                    ← Temporary files
├── package.json            ← Root package.json
├── package-lock.json
└── .env.production         ← Environment variables
```

## New deploy/backend/ Structure (MATCHES PRODUCTION)

```
deploy/backend/
├── api/                    ✅ All backend code here
│   ├── dist/
│   ├── src/
│   ├── migrations/
│   ├── firebaseAdmin.js
│   ├── run-local-server.js
│   ├── package.json        (api-specific, not needed for production)
│   └── tsconfig.json
├── node_modules/           ✅ Root-level dependencies (firebase-admin 12.7.0)
├── package.json            ✅ Root package.json
├── package-lock.json       ✅ Lock file
└── .env.production         ✅ Environment template
```

**Total Size**: 75 MB

## What's Different from Before

### ❌ Previous Incorrect Structure
```
deploy/backend/
├── src/                    ← WRONG: At root level
├── dist/                   ← WRONG: At root level
├── migrations/             ← WRONG: At root level
├── node_modules/
├── firebaseAdmin.js        ← WRONG: At root level
└── run-local-server.js     ← WRONG: At root level
```

### ✅ Current Correct Structure
```
deploy/backend/
├── api/                    ← RIGHT: Everything in api/ subfolder
│   ├── src/
│   ├── dist/
│   ├── migrations/
│   ├── firebaseAdmin.js
│   └── run-local-server.js
├── node_modules/           ← RIGHT: At root level
├── package.json            ← RIGHT: Root package.json
└── .env.production         ← RIGHT: At root level
```

## Key Files

### Root Level Files

**package.json** (ROOT):
```json
{
  "name": "star-wars-d6-api-production",
  "main": "api/run-local-server.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",  // 12.7.0 installed
    "firebase-functions": "^5.0.0",
    "mysql2": "^3.15.2",
    "dotenv": "^16.4.5",
    "zod": "^3.23.0"
  }
}
```

**.env.production** (ROOT):
```bash
MYSQL_URL=mysql://user:pass@31.22.4.44:3306/gamers_d6Holochron
GOOGLE_APPLICATION_CREDENTIALS=/home/username/.config/firebase/service-account.json
NODE_ENV=production
ALLOWED_ORIGIN=https://yourdomain.ifastnet.com
```

### api/ Subfolder Files

**api/run-local-server.js** (17 KB):
- Main Node.js HTTP server
- Handles all API routes
- Requires firebase-admin from root node_modules

**api/firebaseAdmin.js** (1.6 KB):
- Firebase Admin SDK helper
- Used by run-local-server.js

**api/src/**, **api/dist/**, **api/migrations/**:
- Additional source and utility files
- Not directly needed for API server but good to include

## Upload Instructions

### Step 1: Backup Current Production

On iFastNet server:
```bash
cd /nodejs
tar -czf star-wars-api-backup-$(date +%Y%m%d-%H%M%S).tar.gz star-wars-api/
```

### Step 2: Upload New Package

**Option A: Upload Entire Package (Recommended)**

Upload `deploy/backend/*` to `/nodejs/star-wars-api/`

This will overwrite:
- `api/` folder (with all backend code)
- `node_modules/` folder (with firebase-admin 12.7.0)
- `package.json` (root level)
- `package-lock.json` (root level)

**Option B: Selective Upload (If Bandwidth Limited)**

1. Upload only `node_modules/` to replace firebase-admin:
   ```bash
   # Delete old node_modules
   rm -rf /nodejs/star-wars-api/node_modules

   # Upload new node_modules from deploy/backend/
   # This gets you firebase-admin 12.7.0
   ```

2. Upload `package.json` and `package-lock.json` to root

### Step 3: Configure .env.production

Either:
1. Upload `.env.production` and edit values on server
2. Manually create `.env.production` on server with your values

**IMPORTANT**: Update these values:
- `GOOGLE_APPLICATION_CREDENTIALS` path
- `ALLOWED_ORIGIN` domain

### Step 4: Restart Node.js App

In iFastNet Control Panel:
- Software → Node.js
- Find your app
- Click **Restart**

## Verification Checklist

### After Upload, Verify Structure:

```bash
cd /nodejs/star-wars-api

# Should see:
ls -la
# api/
# node_modules/
# package.json
# package-lock.json
# .env.production
# Public/ (if it was there before)
# tmp/

# Check api/ contents:
ls -la api/
# dist/
# src/
# migrations/
# firebaseAdmin.js
# run-local-server.js
# package.json
# tsconfig.json

# Verify firebase-admin version:
cat node_modules/firebase-admin/package.json | grep version
# Should show: "version": "12.7.0"
```

### Test API Server:

```bash
# Public endpoint (no auth)
curl https://yourdomain.com/api/species

# Should return: JSON array of species

# Protected endpoint (requires auth)
curl https://yourdomain.com/api/users

# Should return: {"error":"unauthorized"}
```

### Check Logs for WASM Errors:

In iFastNet Node.js logs, should NOT see:
```
Failed to execute 'WebAssembly.compile'
```

## What About Public/ and tmp/ Folders?

### Public/
- **If it exists in production**: Leave it alone
- **If it's for frontend**: You may not need it (frontend should be in /public_html/)
- **If unsure**: Don't delete it, just leave it

### tmp/
- **Temporary files**: Safe to leave
- **May be created automatically**: Don't need to upload

## iFastNet Node.js App Configuration

In Control Panel, verify:

1. **Application Root**: `/nodejs/star-wars-api`
2. **Application Startup File**: `api/run-local-server.js`
3. **Node.js Version**: 20.x
4. **Environment Variables**:
   - All variables from `.env.production`
   - OR just ensure `.env.production` file exists in root

## Common Issues

### "Cannot find module 'firebase-admin'"

**Cause**: node_modules not at correct level

**Fix**:
```bash
cd /nodejs/star-wars-api
rm -rf api/node_modules  # Remove if exists
npm install  # Installs to root node_modules/
```

### "WASM memory error"

**Cause**: iFastNet memory limit not increased

**Fix**:
1. Verify with iFastNet support that 1GB memory was applied
2. Check Node.js app memory limit in control panel
3. Restart Node.js app after memory increase

### "Cannot start application"

**Cause**: Startup file path incorrect

**Fix**:
- Startup file should be: `api/run-local-server.js` (not just `run-local-server.js`)
- Application root should be: `/nodejs/star-wars-api`

## Summary

✅ **Correct Structure**:
- All backend code in `api/` subfolder
- Dependencies in root-level `node_modules/`
- Root `package.json` with main: "api/run-local-server.js"
- `.env.production` at root level

✅ **firebase-admin 12.7.0** in root `node_modules/`

✅ **Ready to upload** - structure matches your production

## Next Steps

1. Review this structure
2. Confirm it matches your production layout
3. Upload `deploy/backend/` contents to `/nodejs/star-wars-api/`
4. Configure `.env.production` with your values
5. Restart Node.js app
6. Test endpoints
7. Check logs for WASM errors
