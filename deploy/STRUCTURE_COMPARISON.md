# Structure Comparison: Local vs Production

## Quick Verification Checklist

Use this to verify your current production structure matches what you're about to deploy.

### Expected Production Structure (What You Should Have Online)

```
/home/username/nodejs/star-wars-api/
├── dist/                    ← Should exist
├── src/                     ← Should exist
├── migrations/              ← Should exist
├── node_modules/            ← Should exist
├── firebaseAdmin.js         ← Should exist
├── run-local-server.js      ← Should exist
├── package.json             ← Should exist
└── tsconfig.json            ← Should exist
```

### New deploy/backend/ Structure (What You're Uploading)

```
deploy/backend/
├── dist/                    ✅ Matches production
├── src/                     ✅ Matches production
├── migrations/              ✅ Matches production
├── node_modules/            ✅ Matches production (but upgraded firebase-admin)
├── firebaseAdmin.js         ✅ Matches production
├── run-local-server.js      ✅ Matches production
├── package.json             ✅ Matches production
└── tsconfig.json            ✅ Matches production
```

## Directory Contents Verification

### 1. Check dist/ Directory

**Production should have:**
```
dist/
├── functions/
│   └── importSpecies.js
├── utils/
│   ├── slug.js
│   ├── tokenize.js
│   ├── normalize.js
│   └── audit.js
└── index.js
```

**New package has:**
```bash
cd deploy/backend/dist
ls -R
```
✅ Should match exactly

### 2. Check src/ Directory

**Production should have:**
```
src/
├── functions/
│   └── importSpecies.ts
├── utils/
│   ├── slug.ts
│   ├── tokenize.ts
│   ├── normalize.ts
│   └── audit.ts
├── index.ts
└── server.ts
```

**New package has:**
```bash
cd deploy/backend/src
ls -R
```
✅ Should match exactly

### 3. Check migrations/ Directory

**Production should have:**
```
migrations/
└── 20251011_create_characters.sql
```

**New package has:**
```bash
cd deploy/backend/migrations
ls
```
✅ Should match exactly

## Key Files Comparison

### firebaseAdmin.js
- **Purpose**: Firebase Admin SDK initialization helper
- **Size**: ~1.6 KB
- **Status**: ✅ Same file in both

### run-local-server.js
- **Purpose**: Main Node.js API server
- **Size**: ~17 KB
- **Status**: ✅ Same file in both

### package.json
- **Purpose**: Dependencies manifest
- **Key Change**: firebase-admin version
  - Production (old): May have 11.10.1 or ^12.0.0
  - New package: ^12.0.0 (installs 12.7.0)

## What's Different (IMPORTANT)

### Only Change: firebase-admin Version

**Production (Current)**:
```bash
# If you downgraded previously
node_modules/firebase-admin/package.json → "version": "11.10.1"
```

**New Package**:
```bash
# Upgraded to latest
node_modules/firebase-admin/package.json → "version": "12.7.0"
```

### Everything Else is Identical
- ✅ Directory structure identical
- ✅ Source files identical
- ✅ Compiled files identical
- ✅ Server files identical
- ✅ All other dependencies identical

## Before You Upload - Verification Steps

### Step 1: Check Your Production Structure

SSH into iFastNet or use File Manager:

```bash
cd /home/username/nodejs/star-wars-api
ls -la
```

**You should see:**
- dist/
- src/
- migrations/
- node_modules/
- firebaseAdmin.js
- run-local-server.js
- package.json
- tsconfig.json

**If you DON'T see src/ or migrations/:**
- This means your production is missing these directories
- You MUST upload the complete structure
- See "Production Missing Directories" section below

### Step 2: Check firebase-admin Version in Production

```bash
cd /home/username/nodejs/star-wars-api/node_modules/firebase-admin
cat package.json | grep version
```

**Expected output**: `"version": "11.10.1"` or `"version": "12.x.x"`

### Step 3: Backup Production

```bash
cd /home/username/nodejs/
tar -czf star-wars-api-backup-$(date +%Y%m%d-%H%M%S).tar.gz star-wars-api/
ls -lh star-wars-api-backup-*
```

Save backup filename for rollback if needed.

## Upload Methods

### Method 1: Complete Overwrite (Recommended)
1. Rename production directory: `mv star-wars-api star-wars-api.old`
2. Upload `deploy/backend/` → `/home/username/nodejs/star-wars-api`
3. Verify structure matches
4. Restart Node.js app
5. Test endpoints
6. If successful, remove backup: `rm -rf star-wars-api.old`

### Method 2: Selective Update (If Confident)
1. Upload only `node_modules/` to replace firebase-admin
2. Verify other files unchanged
3. Restart Node.js app
4. Test endpoints

### Method 3: File Manager (If No SSH)
1. Download production as backup
2. Delete old `node_modules/`
3. Upload new `deploy/backend/node_modules/`
4. Restart via control panel

## Production Missing Directories?

If your production is missing `src/`, `dist/`, or `migrations/`:

### Why This Happened
- Initial deployment may have been incomplete
- These directories weren't uploaded originally
- Or were deleted by mistake

### What to Do
1. ✅ Upload the COMPLETE `deploy/backend/` structure
2. ✅ Include all directories: src/, dist/, migrations/, node_modules/
3. ✅ This won't break anything - they're just additional files
4. ✅ The server only needs `run-local-server.js` and `node_modules/`

### Will This Break Production?
**NO** - Adding these directories is safe:
- `src/` = TypeScript sources (not used at runtime, only for development)
- `dist/` = Compiled JS (used by Cloud Functions, not local server)
- `migrations/` = SQL files (only used for manual DB updates)

The production server runs `run-local-server.js` which doesn't depend on these directories.

## After Upload - Verification

### 1. Check Structure
```bash
cd /home/username/nodejs/star-wars-api
ls -la src/ dist/ migrations/
# All should exist now
```

### 2. Verify firebase-admin
```bash
cd node_modules/firebase-admin
cat package.json | grep version
# Should show: "version": "12.7.0"
```

### 3. Restart Node.js App
iFastNet Control Panel → Software → Node.js → Restart

### 4. Test Endpoints
```bash
# Public endpoint (should work immediately)
curl https://your-domain.com/api/species

# Protected endpoint (should return 401 without token)
curl https://your-domain.com/api/users
```

### 5. Check for WASM Errors
In iFastNet Node.js logs, look for:
- ❌ BAD: "WebAssembly.compile" errors
- ✅ GOOD: No WASM errors, server starts successfully

## Troubleshooting

### "Structure doesn't match"
- Verify you're in the correct production directory
- Check if files are hidden (ls -la)
- Confirm Node.js app path in control panel

### "Too many files to upload"
- node_modules/ is large (74 MB, 256 packages)
- Use FTP/SFTP instead of web File Manager
- Or upload as .tar.gz and extract on server

### "Upload failed"
- Check disk space quota
- Verify write permissions
- Try uploading in chunks (src/, then dist/, then node_modules/)

## Success Indicators

✅ All directories exist in production
✅ firebase-admin version is 12.7.0
✅ Node.js app starts without crashing
✅ API endpoints respond correctly
✅ No WASM errors in logs

## Questions to Confirm

Before uploading, can you confirm:

1. **Do you currently have these directories in production?**
   - [ ] src/
   - [ ] dist/
   - [ ] migrations/

2. **What firebase-admin version is in production now?**
   - [ ] 11.10.1 (downgraded)
   - [ ] 12.x.x (already upgraded)
   - [ ] Unknown (need to check)

3. **Did iFastNet confirm the 1GB memory increase?**
   - [ ] Yes, confirmed
   - [ ] No, need to verify
   - [ ] Unknown

Once you confirm these, we can proceed with the exact upload steps you need.
