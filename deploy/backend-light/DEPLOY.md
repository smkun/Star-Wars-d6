# Lightweight Deployment - firebase-admin 12.7.0 Upgrade

## Package Contents

**Size**: 304 KB (no node_modules - much faster upload!)

```
backend-light/
├── api/                    ← All backend code
│   ├── src/
│   ├── dist/
│   ├── migrations/
│   ├── firebaseAdmin.js
│   ├── run-local-server.js
│   ├── package.json
│   └── tsconfig.json
├── package.json            ← Root dependencies (firebase-admin 12.7.0)
└── .env.production         ← Environment template
```

**NO node_modules** - Let npm install on server!

## Deployment Steps

### 1. Upload Files

Upload `backend-light/*` to `/nodejs/star-wars-api/`

**What gets uploaded**:
- `api/` folder (304 KB)
- `package.json` (528 bytes)
- `.env.production` (892 bytes)

**Total upload size**: ~304 KB (vs 75 MB with node_modules!)

### 2. SSH into iFastNet Server and Activate Node.js Environment

```bash
ssh gamers@your-server.ifastnet.com
```

**⚠️ IMPORTANT - Always activate Node.js virtual environment first:**

```bash
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api
```

This command:
- Activates Node.js 20 virtual environment
- Changes to your application directory

See [IFASTNET_SSH_COMMANDS.md](../IFASTNET_SSH_COMMANDS.md) for complete SSH reference.

### 3. Configure Environment

Edit `.env.production` with your values:

```bash
nano .env.production
```

Update:
- `GOOGLE_APPLICATION_CREDENTIALS` - path to your service account JSON
- `ALLOWED_ORIGIN` - your production domain

Save and rename:
```bash
mv .env.production .env
```

### 4. Install Dependencies on Server

This is where firebase-admin 12.7.0 gets installed:

**Make sure environment is activated** (from step 2), then:

```bash
npm install --production
```

(You're already in `/home/gamers/nodejs/star-wars-api` from the activation command)

**Expected output**:
```
added 255 packages in 10s
```

### 5. Verify firebase-admin Version

```bash
npm list firebase-admin
```

**Should show**:
```
star-wars-d6-api-production@1.0.0
└── firebase-admin@12.7.0
```

### 6. Restart Node.js App

**In iFastNet Control Panel**:
- Software → Node.js
- Find your app
- Click **Restart**

**Via SSH** (if supported):
```bash
# Check if pm2 or similar is available
pm2 restart star-wars-api
# OR
systemctl restart nodejs-app
```

### 7. Test Deployment

```bash
# Public endpoint
curl https://yourdomain.com/api/species
# Should return: JSON array of species

# Protected endpoint
curl https://yourdomain.com/api/users
# Should return: {"error":"unauthorized"}
```

### 8. Check Logs for WASM Errors

**In iFastNet Node.js logs**, should NOT see:
```
Failed to execute 'WebAssembly.compile'
```

If you see WASM errors, the 1GB memory increase wasn't applied. Contact iFastNet support.

## Why This Works Better

### Old Method (deploy/backend/)
- **Size**: 75 MB
- **Upload time**: Several minutes
- **Files**: 30,000+ (node_modules)
- **Risk**: Upload failures, timeout issues

### New Method (deploy/backend-light/)
- **Size**: 304 KB
- **Upload time**: Seconds
- **Files**: ~200
- **Risk**: Minimal

### Benefits
✅ **Faster upload** - 304 KB vs 75 MB
✅ **Fewer files** - 200 vs 30,000+
✅ **Less failure risk** - Small file transfers are more reliable
✅ **Platform-specific builds** - npm installs correct binaries for iFastNet's OS
✅ **Cleaner process** - Standard npm workflow

## Key Change

**package.json** specifies:
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0"  // Will install 12.7.0
  }
}
```

When you run `npm install --production` on the server, it installs firebase-admin 12.7.0 and all other dependencies.

## Troubleshooting

### npm install fails

**Error**: "Cannot find module" or dependency resolution errors

**Fix**:
```bash
# Delete package-lock.json and try again
rm package-lock.json
npm install --production
```

### Still seeing firebase-admin 11.10.1

**Cause**: Old node_modules not deleted

**Fix**:
```bash
rm -rf node_modules
npm install --production
```

### WASM memory error persists

**Cause**: iFastNet memory limit not increased to 1GB

**Fix**:
1. Contact iFastNet support
2. Request confirmation that virtual memory was increased
3. Or rollback to 11.10.1:
   ```bash
   npm install firebase-admin@11.10.1 --save
   ```

## Verification Checklist

After deployment:

- [ ] Files uploaded (304 KB)
- [ ] `.env` configured with your values
- [ ] `npm install --production` completed successfully
- [ ] firebase-admin version is 12.7.0
- [ ] Node.js app restarted
- [ ] `/api/species` endpoint working
- [ ] `/api/users` returns 401 (auth required)
- [ ] No WASM errors in logs

## Rollback

If you need to rollback to firebase-admin 11.10.1:

```bash
cd /nodejs/star-wars-api
npm install firebase-admin@11.10.1 --save
# Restart Node.js app
```

## Summary

✅ Upload 304 KB instead of 75 MB
✅ Let npm install dependencies on server
✅ firebase-admin 12.7.0 will be installed
✅ Requires 1GB virtual memory from iFastNet
✅ Much faster and more reliable deployment

Upload `backend-light/` and run `npm install --production` on the server!
