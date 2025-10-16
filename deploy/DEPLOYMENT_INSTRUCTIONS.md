# iFastNet Deployment Instructions - Firebase Admin 12.7.0

## Pre-Deployment Verification

### 1. Verify Virtual Memory Increase

Contact iFastNet support to confirm your account has been upgraded to **1GB virtual memory**.

**Why**: Firebase Admin SDK 12.x requires ~5.5MB WASM memory. CloudLinux default is 5MB.

### 2. Local Testing Complete ✅

- [x] API server running with firebase-admin 12.7.0
- [x] No WASM crashes in local environment
- [x] Species endpoint working
- [x] Authentication endpoints working
- [x] Firebase Admin SDK initializing successfully

## Deployment Package Contents

**Location**: `deploy/backend/`
**Files**:
- `app.js` (5 lines) - **Passenger entry point wrapper** (loads actual server)
- `api/run-local-server.js` (17 KB) - Main API server
- `firebaseAdmin.js` (1.6 KB) - Firebase Admin helper
- `package.json` (694 B) - Dependencies manifest
- `node_modules/` (74 MB) - Production dependencies
  - firebase-admin@12.7.0
  - firebase-functions@5.1.1
  - mysql2@3.15.2
  - dotenv@16.4.5
  - zod@3.23.0

**Total Size**: 75 MB

## Deployment Steps

### Step 1: Upload Backend Files

Upload `deploy/backend/` contents to your iFastNet Node.js app directory.

**Recommended path**: `/home/username/nodejs/star-wars-api/`

**Upload method**: FTP, SFTP, or iFastNet File Manager

**Important**: Include the entire `node_modules/` directory (firebase-admin 12.7.0 is required).

### Step 2: Upload Firebase Service Account

Upload your Firebase service account JSON file to a secure location:

```bash
# Example secure path
/home/username/.config/firebase/star-wars-d6-service-account.json
```

**Set permissions**:
```bash
chmod 600 /home/username/.config/firebase/star-wars-d6-service-account.json
```

### Step 3: Configure Environment Variables

In iFastNet Node.js control panel, set these environment variables:

```env
# MySQL Database
MYSQL_URL=mysql://gamers_sa:PASSWORD@31.22.4.44:3306/gamers_d6Holochron

# Firebase Admin SDK Credentials
GOOGLE_APPLICATION_CREDENTIALS=/home/username/.config/firebase/star-wars-d6-service-account.json

# Node Environment
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGIN=https://your-domain.com
```

**Replace**:
- `PASSWORD` with actual MySQL password
- `/home/username` with your iFastNet home directory path
- `https://your-domain.com` with your production domain

### Step 4: Configure Node.js App in iFastNet Panel

1. **Log in to iFastNet Control Panel**
2. **Navigate to**: Software → Node.js
3. **Configure Application**:
   - **Application Root**: `/home/username/nodejs/star-wars-api`
   - **Application URL**: `https://your-domain.com/api` (or subdomain)
   - **Application Startup File**: `app.js` *(Passenger wrapper that loads api/run-local-server.js)*
   - **Node.js Version**: 20.x or higher

**Note**: Using `app.js` as the entry point allows Passenger to automatically start/restart the server. This eliminates the need for manual SSH commands after deployment.

### Step 5: Start/Restart Node.js App

In iFastNet Node.js control panel:
- Click **Restart** if app is running
- Click **Start** if app is stopped

**Monitor startup logs** for any errors.

### Step 6: Verify Deployment

Test production endpoints:

#### Public Endpoints (No Auth Required)

```bash
# Test species endpoint
curl https://your-domain.com/api/species

# Expected: JSON array of 49 species
```

```bash
# Test starships endpoint
curl https://your-domain.com/api/starships

# Expected: JSON array of starships
```

#### Protected Endpoints (Require Auth)

```bash
# Test users endpoint without auth (should fail with 401)
curl https://your-domain.com/api/users

# Expected: {"error":"unauthorized"}
```

```bash
# Test characters endpoint without auth (should fail with 401)
curl https://your-domain.com/api/characters

# Expected: {"error":"unauthorized"}
```

#### Admin Endpoint Test (With Valid Token)

1. Sign in to production site as admin user
2. Open browser DevTools → Network tab
3. Copy `Authorization: Bearer <token>` from any API request
4. Test endpoint:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://your-domain.com/api/users

# Expected: JSON array of Firebase users
```

## Troubleshooting

### WASM Memory Error Still Occurring

**Error**:
```
Failed to execute 'WebAssembly.compile': The Buffer size (5452736 Bytes)
exceeds the limit supported on this platform (5242880 Bytes)
```

**Solution**:
1. Verify virtual memory increase was applied: Contact iFastNet support
2. Check Node.js app logs for confirmation of memory limit
3. If not fixed, request specific WASM memory limit increase to 10MB

### Node.js App Won't Start

**Check**:
1. Application startup file path is correct: `app.js` (wrapper) or `api/run-local-server.js` (direct)
2. Ensure `app.js` exists in application root directory
3. All environment variables are set correctly
4. GOOGLE_APPLICATION_CREDENTIALS path is absolute and file exists
5. MySQL connection string is correct (test with mysql client)

**Alternative**: If `app.js` doesn't work, try setting startup file to `api/run-local-server.js` directly.

### Firebase Admin SDK Initialization Failed

**Error**: `firebase_admin_not_configured`

**Check**:
1. GOOGLE_APPLICATION_CREDENTIALS environment variable is set
2. Service account JSON file exists at specified path
3. File has correct permissions (600)
4. File contains valid JSON (not corrupted during upload)

### Authentication Not Working

**Error**: `unauthorized` on all protected endpoints

**Check**:
1. Firebase Admin SDK initialized successfully (check logs)
2. Frontend is sending `Authorization: Bearer <token>` header
3. Token is valid (not expired, from correct Firebase project)
4. CORS is configured correctly (ALLOWED_ORIGIN matches frontend domain)

### Database Connection Failed

**Error**: `ECONNREFUSED` or MySQL timeout

**Check**:
1. MYSQL_URL is correct format: `mysql://user:pass@host:3306/database`
2. Password special characters are URL-encoded (`%` = `%25`, `@` = `%40`)
3. Database server allows connections from iFastNet IP
4. Database credentials are valid

## Success Indicators

✅ Node.js app starts without crashing
✅ `/species` returns JSON array (49 items)
✅ `/starships` returns JSON array
✅ `/users` returns 401 without token
✅ `/characters` returns 401 without token
✅ `/users` returns user list with valid admin token
✅ `/characters` returns user's characters with valid token
✅ Character creation works from frontend
✅ Admin reassignment functionality works
✅ No WASM memory errors in logs

## Rollback Procedure

If firebase-admin 12.7.0 causes issues:

1. **Install downgraded version**:
   ```bash
   cd deploy/backend
   npm install firebase-admin@11.10.1
   ```

2. **Re-upload backend** to iFastNet

3. **Restart Node.js app**

4. **Verify**: Should work with 11.10.1 even without memory increase

## Post-Deployment

### Monitor Performance

- Check Node.js app logs regularly
- Monitor memory usage in iFastNet control panel
- Watch for any WASM-related errors
- Test authentication flows periodically

### Security Checklist

- [ ] Service account JSON has 600 permissions
- [ ] No credentials in public files or git history
- [ ] CORS restricted to production domain only
- [ ] HTTPS enabled for all API endpoints
- [ ] Rate limiting configured (if available)

## Support Resources

- **iFastNet Support**: https://ifastnet.com/portal/submitticket.php
- **Firebase Admin Docs**: https://firebase.google.com/docs/admin/setup
- **Project Documentation**: See `docs/IFASTNET_DEPLOYMENT.md`
- **Upgrade Notes**: See `deploy/FIREBASE_ADMIN_UPGRADE.md`

## Questions?

If you encounter issues not covered here:
1. Check Node.js app logs first
2. Review `deploy/FIREBASE_ADMIN_UPGRADE.md` for technical details
3. Contact iFastNet support for hosting-specific issues
4. Check Firebase Console for authentication/project issues
