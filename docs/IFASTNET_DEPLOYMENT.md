# iFastNet Deployment Guide

Complete guide for deploying Star Wars d6 Database to iFastNet Ultimate with Node.js support.

## Architecture on iFastNet

- **Frontend**: Static React build → `/public_html/`
- **Backend**: Node.js API → runs as Node.js app
- **Database**: MySQL (already on iFastNet at 31.22.4.44)
- **Authentication**: Firebase Auth (client-side + API verification)

## Pre-Deployment Checklist

### 1. Prepare Files Locally

**Build the React frontend:**
```bash
cd "/home/skunian/code/MyCode/Star Wars d6"
npm run build:web
```

This creates `web/dist/` with all static files.

**Verify build output:**
```bash
ls -la web/dist/
# Should contain: index.html, assets/, aliens/, starships/, icons/
```

### 2. Environment Variables for iFastNet

**Create `.env` file for production:**

```bash
# MySQL Connection (already on iFastNet)
MYSQL_URL=mysql://gamers_sa:KAd5Og-nJbDc%25%3FC%26@31.22.4.44:3306/gamers_d6Holochron

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=/home/username/.config/firebase/star-wars-d6-service-account.json
# Or inline (if file upload not supported):
# FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Environment
NODE_ENV=production
PORT=3000

# CORS - Add your iFastNet domain
ALLOWED_ORIGIN=https://yourdomain.ifastnet.com
```

### 3. Upload Firebase Service Account

**Option A: Upload as file**
```bash
# On iFastNet, create directory:
mkdir -p ~/.config/firebase
chmod 700 ~/.config/firebase

# Upload firebase-admin-key.json to this directory
# Set permissions:
chmod 600 ~/.config/firebase/star-wars-d6-service-account.json
```

**Option B: Use environment variable**
- If iFastNet doesn't allow file uploads, use `FIREBASE_SERVICE_ACCOUNT` env var
- Paste the entire JSON as a single-line string

## Deployment Steps

### Step 1: Upload Frontend (React Build)

**Via FTP/File Manager:**
1. Connect to iFastNet FTP/File Manager
2. Navigate to `/public_html/` (or your domain's root)
3. Upload contents of `web/dist/*`:
   ```
   /public_html/
   ├── index.html
   ├── assets/
   ├── aliens/
   ├── starships/
   ├── icons/
   └── data/ (if using static exports)
   ```

**Important:** Upload the **contents** of `web/dist/`, not the folder itself!

### Step 2: Upload Node.js API

**Via FTP/File Manager:**
1. Create `/nodejs/` directory (or wherever iFastNet specifies)
2. Upload:
   ```
   /nodejs/star-wars-api/
   ├── api/
   │   ├── run-local-server.js
   │   └── package.json
   ├── package.json
   ├── package-lock.json
   └── .env (with production values)
   ```

### Step 3: Install Dependencies on iFastNet

**Via SSH or iFastNet's Node.js app manager:**
```bash
cd /nodejs/star-wars-api
npm install --production
```

### Step 4: Configure Node.js App on iFastNet

**In iFastNet Control Panel → Node.js:**
1. **Application Root:** `/nodejs/star-wars-api`
2. **Application Startup File:** `api/run-local-server.js`
3. **Application URL:** Your domain/subdomain
4. **Node.js Version:** 20.x (or latest available)
5. **Environment Variables:**
   - Add `MYSQL_URL`
   - Add `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT`
   - Add `NODE_ENV=production`
   - Add `ALLOWED_ORIGIN` (your frontend URL)

### Step 5: Update Frontend API Calls

**If API is on different subdomain/port:**

Update `web/src/utils/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://api.yourdomain.ifastnet.com'
    : 'http://localhost:4000');
```

**Or if same domain:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

### Step 6: Configure .htaccess (if needed)

**For React Router on Apache:**

Create `/public_html/.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Proxy API requests to Node.js
  RewriteCond %{REQUEST_URI} ^/api/
  RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

  # React Router - serve index.html for all non-file requests
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Alternative: Separate Subdomains

**Easier approach:**

1. **Frontend:** `www.yourdomain.com` → `/public_html/`
2. **API:** `api.yourdomain.com` → Node.js app on port 3000

**Update CORS in `api/run-local-server.js`:**
```javascript
const ALLOWED_ORIGINS = [
  'https://www.yourdomain.com',
  'https://yourdomain.com',
  'http://localhost:5173' // for local dev
];
```

## Files to Upload

### Frontend Files (to /public_html/)
```
✅ index.html
✅ assets/ (JS, CSS bundles)
✅ aliens/ (species images)
✅ starships/ (starship images)
✅ icons/ (category icons)
✅ .htaccess (if needed)
```

### Backend Files (to /nodejs/star-wars-api/)
```
✅ api/run-local-server.js
✅ api/package.json
✅ package.json
✅ package-lock.json
✅ .env (production values)
✅ node_modules/ (or install via npm on server)
```

### DO NOT Upload
```
❌ .git/
❌ node_modules/ (install on server instead)
❌ web/src/
❌ web/public/
❌ scripts/
❌ Source Data/
❌ firebase-admin-key.json (store securely, reference via env var)
```

## Testing Deployment

### 1. Test API Endpoints

```bash
# Test species endpoint
curl https://api.yourdomain.com/api/species

# Test starships endpoint
curl https://api.yourdomain.com/api/starships

# Test authentication (with valid Firebase token)
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://api.yourdomain.com/api/characters
```

### 2. Test Frontend

**Visit your domain and verify:**
- [ ] Homepage loads
- [ ] Species catalog displays
- [ ] Starships catalog displays with images
- [ ] Capital ships show images (not broken links!)
- [ ] Search works
- [ ] Detail pages load
- [ ] Authentication works (register/login)
- [ ] Characters feature works (requires auth)

### 3. Check Console for Errors

Open browser DevTools → Console and verify:
- No CORS errors
- No 404s for API calls
- No missing image errors (except known missing images)

## Troubleshooting

### CORS Errors
**Problem:** Frontend can't access API

**Solution:**
1. Check `ALLOWED_ORIGIN` in `.env`
2. Verify CORS headers in `api/run-local-server.js`
3. Make sure both frontend and API use HTTPS (or both HTTP)

### API Returns 500 Error
**Problem:** Node.js API crashing

**Solution:**
1. Check iFastNet Node.js logs
2. Verify MySQL connection string
3. Test MySQL connection: `mysql -h 31.22.4.44 -u gamers_sa -p`
4. Check Firebase credentials are loaded

### Images Not Loading
**Problem:** Broken image links

**Solution:**
1. Verify image files uploaded to correct directories
2. Check `BASE_URL` in frontend build
3. Verify image paths in database match file locations

### Authentication Not Working
**Problem:** Can't login/register

**Solution:**
1. Check Firebase project settings
2. Verify API can load Firebase Admin SDK credentials
3. Test with: `console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)`
4. Ensure auth endpoints return proper CORS headers

## Performance Optimization

### 1. Enable Gzip Compression

Add to `.htaccess`:
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### 2. Browser Caching

Add to `.htaccess`:
```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 3. Database Connection Pooling

Already implemented in `api/run-local-server.js` - MySQL pool reuses connections.

## Rollback Plan

**If deployment fails:**

1. **Frontend:** Replace `/public_html/` with previous backup
2. **Backend:** Restart Node.js app with previous code
3. **Database:** Run backup SQL: `mysql < backup.sql`

## Cost & Limits

**iFastNet Ultimate includes:**
- ✅ Node.js hosting
- ✅ MySQL database (already have)
- ✅ Unlimited bandwidth (typically)
- ✅ SSH access
- ✅ Multiple domains

**Monitor:**
- MySQL connection limits
- Node.js memory usage
- Disk space (images can grow)

## Security Checklist

- [ ] HTTPS enabled on domain
- [ ] `.env` file has proper permissions (600)
- [ ] Firebase credentials not in git
- [ ] MySQL password is strong
- [ ] CORS limited to your domain only
- [ ] Admin claims only for trusted users
- [ ] Firebase security rules deployed
- [ ] Regular database backups

## Quick Deploy Checklist

```bash
# 1. Build frontend
npm run build:web

# 2. Create deployment package
mkdir deploy
cp -r web/dist/* deploy/frontend/
cp -r api deploy/backend/
cp package.json package-lock.json deploy/backend/

# 3. Upload via FTP
# - deploy/frontend/* → /public_html/
# - deploy/backend/* → /nodejs/star-wars-api/

# 4. On iFastNet (via SSH):
cd /nodejs/star-wars-api
npm install --production

# 5. Configure Node.js app in control panel

# 6. Restart Node.js app

# 7. Test!
```

## Support

If deployment issues occur:
1. Check iFastNet Node.js app logs
2. Verify environment variables are set
3. Test MySQL connection from Node.js app
4. Check Firebase Admin SDK initialization
5. Review browser console for frontend errors
