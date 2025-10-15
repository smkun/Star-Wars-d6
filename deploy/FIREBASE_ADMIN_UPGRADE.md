# Firebase Admin SDK Upgrade Notes

## Change Summary

**Date**: 2025-10-13
**Action**: Reverted firebase-admin from 11.10.1 → 12.7.0 (latest)

## Background

During production deployment to iFastNet, the backend API was crashing with WASM-related errors:

```
Failed to execute 'WebAssembly.compile': The Buffer size (5452736 Bytes) exceeds
the limit supported on this platform (5242880 Bytes)
```

### Root Cause

firebase-admin 12.x uses Undici's WebAssembly HTTP parser, which requires more virtual memory than CloudLinux's default 5MB WASM limit on iFastNet shared hosting.

### Initial Workaround

Downgraded to firebase-admin 11.10.1, which uses the older node-fetch HTTP client and doesn't touch Undici's WebAssembly parser. This temporarily resolved the crashes.

## Resolution

**iFastNet increased virtual memory limit to 1GB** for the hosting account.

This allows firebase-admin 12.x to run without WASM memory errors.

## Testing Results

### Local Development (2025-10-13)

✅ **API Server**: Running successfully with firebase-admin 12.7.0
- Process: Node.js v20.12.0
- Port: 4000
- Firebase Admin SDK: Successfully initialized with service account
- Test endpoints:
  - `/species` → 49 species loaded ✅
  - `/users` → Requires auth (401) ✅
  - `/characters` → Requires auth (401) ✅

### Expected Production Behavior

With 1GB virtual memory:
- Firebase Admin SDK should initialize without WASM errors
- Token verification will work normally (`admin.auth().verifyIdToken()`)
- Protected endpoints will validate Firebase ID tokens correctly
- No node process crashes on `/users` or `/characters` requests

## Deployment Package

**Location**: `deploy/backend/`
**Size**: 75 MB total (74 MB node_modules)
**Key Dependencies**:
- firebase-admin: 12.7.0
- firebase-functions: 5.1.1
- mysql2: 3.15.2
- dotenv: 16.4.5
- zod: 3.23.0

## Production Deployment Steps

1. **Upload backend files** to iFastNet Node.js app directory
2. **Set environment variables** in iFastNet control panel:
   ```
   MYSQL_URL=mysql://user:pass@host:3306/db
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   NODE_ENV=production
   ```
3. **Upload Firebase service account JSON** securely (600 permissions)
4. **Restart Node.js app** in iFastNet control panel
5. **Monitor logs** for WASM errors (should not occur with 1GB memory)

## Smoke Test Checklist

After deployment, verify:

- [ ] Node.js app starts without crashing
- [ ] `/species` endpoint returns data (no auth required)
- [ ] `/starships` endpoint returns data (no auth required)
- [ ] `/users` endpoint returns 401 without token ✅
- [ ] `/users` endpoint returns user list with valid admin token
- [ ] `/characters` endpoint returns 401 without token ✅
- [ ] `/characters` endpoint returns user's characters with valid token
- [ ] Character creation with auto user_id assignment
- [ ] Admin reassignment functionality

## Rollback Plan

If WASM errors persist in production despite 1GB memory:

1. Downgrade firebase-admin to 11.10.1:
   ```bash
   cd deploy/backend
   npm install firebase-admin@11.10.1
   ```
2. Rebuild deployment package
3. Re-upload to iFastNet
4. Contact iFastNet support to verify memory limit increase was applied

## Benefits of firebase-admin 12.x

- **Security patches**: Latest security fixes and improvements
- **Performance**: Faster token verification with Undici HTTP/2
- **Features**: Support for latest Firebase Auth features
- **Maintenance**: Active development and bug fixes

## References

- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Undici WASM issue: https://github.com/nodejs/undici/issues/2290
- iFastNet Node.js hosting: https://ifastnet.com/portal/knowledgebase/146/Node-JS.html
