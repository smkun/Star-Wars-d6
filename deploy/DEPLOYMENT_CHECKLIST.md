# iFastNet Deployment Checklist

## Pre-Deployment Verification

**Build Status**: ✅ Complete
- Frontend built: `web/dist/` (652 KB bundle)
- Backend prepared: `api/` + `package.json`
- Deployment package created in `deploy/` directory

## Deployment Steps

### 1. Upload Frontend Files

**Target location**: `/public_html/` (or your domain's root directory)

**Files to upload** (from `deploy/frontend/`):
```
✅ index.html
✅ assets/ (JS + CSS bundles)
✅ aliens/ (species images)
✅ starships/ (starship images)
✅ icons/ (category icons)
✅ images/ (other assets)
✅ data/ (any static data)
```

**Upload method**:
- FTP client (FileZilla, Cyberduck)
- iFastNet File Manager
- Command: Upload **contents** of `deploy/frontend/*`, not the folder itself

### 2. Upload Backend Files

**Target location**: `/nodejs/star-wars-api/` (or your Node.js app directory)

**Files to upload** (from `deploy/backend/`):
```
✅ api/ (entire directory)
✅ package.json
✅ package-lock.json
```

**DO NOT upload**:
- `.env` (create on server instead)
- `node_modules/` (install on server)
- Firebase credentials file (upload separately)

### 3. Install Dependencies on Server

**Via SSH or iFastNet terminal**:
```bash
cd /nodejs/star-wars-api
npm install --production
```

### 4. Upload Firebase Credentials

**Option A: Upload as file** (Recommended)
```bash
# On iFastNet, create directory:
mkdir -p ~/.config/firebase
chmod 700 ~/.config/firebase

# Upload firebase-admin-key.json to this directory
# Set permissions:
chmod 600 ~/.config/firebase/star-wars-d6-service-account.json
```

**Option B: Use environment variable**
- If file upload not supported, paste entire JSON as `FIREBASE_SERVICE_ACCOUNT` env var

### 5. Configure Environment Variables

**In iFastNet Control Panel → Node.js App → Environment Variables**:

```bash
# MySQL Connection (already on iFastNet)
MYSQL_URL=mysql://gamers_sa:KAd5Og-nJbDc%25%3FC%26@31.22.4.44:3306/gamers_d6Holochron

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=/home/username/.config/firebase/star-wars-d6-service-account.json

# Environment
NODE_ENV=production
PORT=3000

# CORS - Add your iFastNet domain
ALLOWED_ORIGIN=https://yourdomain.ifastnet.com
```

### 6. Configure Node.js App

**In iFastNet Control Panel → Node.js**:
- **Application Root**: `/nodejs/star-wars-api`
- **Application Startup File**: `api/run-local-server.js`
- **Application URL**: Your domain/subdomain
- **Node.js Version**: 20.x (or latest available)

### 7. Configure .htaccess (if needed)

**For React Router + API proxy**:

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

### 8. Update API for Production

**Update CORS in `api/run-local-server.js`**:
```javascript
const ALLOWED_ORIGINS = [
  'https://www.yourdomain.com',
  'https://yourdomain.com',
  'http://localhost:5173' // keep for local dev
];
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

Visit your domain and verify:
- [ ] Homepage loads
- [ ] Species catalog displays
- [ ] Starships catalog displays with images
- [ ] Capital ships show images (not broken links!)
- [ ] Search works
- [ ] Detail pages load
- [ ] Authentication works (register/login)
- [ ] Characters feature works (requires auth)

### 3. Check Console for Errors

Open browser DevTools → Console:
- No CORS errors
- No 404s for API calls
- No missing image errors (except known missing images)

## Troubleshooting

### CORS Errors
**Problem**: Frontend can't access API

**Solution**:
1. Check `ALLOWED_ORIGIN` in `.env`
2. Verify CORS headers in `api/run-local-server.js`
3. Make sure both frontend and API use HTTPS (or both HTTP)

### API Returns 500 Error
**Problem**: Node.js API crashing

**Solution**:
1. Check iFastNet Node.js logs
2. Verify MySQL connection string
3. Test MySQL connection: `mysql -h 31.22.4.44 -u gamers_sa -p`
4. Check Firebase credentials are loaded

### Images Not Loading
**Problem**: Broken image links

**Solution**:
1. Verify image files uploaded to correct directories
2. Check `BASE_URL` in frontend build
3. Verify image paths in database match file locations

### Authentication Not Working
**Problem**: Can't login/register

**Solution**:
1. Check Firebase project settings
2. Verify API can load Firebase Admin SDK credentials
3. Test with: `console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)`
4. Ensure auth endpoints return proper CORS headers

## Rollback Plan

**If deployment fails**:

1. **Frontend**: Replace `/public_html/` with previous backup
2. **Backend**: Restart Node.js app with previous code
3. **Database**: Run backup SQL: `mysql < backup.sql`

## Security Checklist

- [ ] HTTPS enabled on domain
- [ ] `.env` file has proper permissions (600)
- [ ] Firebase credentials not in git
- [ ] MySQL password is strong
- [ ] CORS limited to your domain only
- [ ] Admin claims only for trusted users
- [ ] Firebase security rules deployed
- [ ] Regular database backups

## Cost & Limits

**iFastNet Ultimate includes**:
- ✅ Node.js hosting
- ✅ MySQL database (already have)
- ✅ Unlimited bandwidth (typically)
- ✅ SSH access
- ✅ Multiple domains

**Monitor**:
- MySQL connection limits
- Node.js memory usage
- Disk space (images can grow)

## Quick Deploy Commands

```bash
# 1. Build frontend (already done)
npm run build:web

# 2. Create deployment package (already done)
mkdir -p deploy/frontend deploy/backend
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

---

**Deployment package ready in `deploy/` directory**
**Frontend**: 652 KB bundle + assets
**Backend**: Node.js API + dependencies
**Database**: Already configured on iFastNet
**Next step**: Upload files via FTP/File Manager
