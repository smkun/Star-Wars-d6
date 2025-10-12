# Production Deployment Guide

Complete guide for deploying Star Wars d6 Database to production.

## Current Architecture

- **Frontend**: Static React app (Vite build)
- **API**: Node.js Express server with MySQL backend
- **Authentication**: Firebase Auth with Admin SDK
- **Database**: MySQL (hosted at 31.22.4.44)
- **Current Config**: Deployed to Firebase Hosting at `/d6StarWars/` path

## Pre-Deployment Checklist

### 1. Environment Variables

**Production `.env` file needs:**

```bash
# MySQL Database - Production Connection
MYSQL_URL=mysql://username:password@host:3306/database_name

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-admin-key.json
# OR use inline JSON (less secure):
# FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Node Environment
NODE_ENV=production

# Optional: Port for API server
PORT=3000
```

**DO NOT:**
- ❌ Commit `.env` to git (already in `.gitignore`)
- ❌ Use development credentials in production
- ❌ Expose Firebase private keys

### 2. Firebase Configuration

**Service Account Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `star-wars-d6-species`
3. Project Settings → Service Accounts
4. Generate new private key (download JSON)
5. Store securely on production server:
   ```bash
   mkdir -p ~/.config/firebase
   chmod 700 ~/.config/firebase
   mv firebase-admin-key.json ~/.config/firebase/star-wars-d6-service-account.json
   chmod 600 ~/.config/firebase/star-wars-d6-service-account.json
   ```

**Enable Authentication:**
- Email/Password: Already enabled ✓
- Google OAuth: Already enabled ✓

**Set Admin Claims:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
node scripts/set-admin-claim.js your-admin-email@example.com
```

### 3. Database Setup

**Production MySQL:**
- Ensure MySQL server is accessible from production host
- Create production database if needed
- Run migrations (if any)
- Import initial data if starting fresh

**Test Connection:**
```bash
export MYSQL_URL='mysql://user:pass@host:3306/db'
node -e "const mysql=require('mysql2/promise');(async()=>{const c=await mysql.createConnection(process.env.MYSQL_URL);console.log('✓ Connected');await c.end();})();"
```

### 4. Build Verification

**Test local build:**
```bash
# Clean build
rm -rf web/dist
npm run build:web

# Verify build output
ls -la web/dist/
```

**Build should contain:**
- `index.html`
- `assets/` (JS, CSS bundles)
- `aliens/` (species images)
- `starships/` (starship images)
- `icons/` (category icons)

## Deployment Options

### Option A: Firebase Hosting + Cloud Functions (Recommended)

**Pros:**
- Easy deployment with `firebase deploy`
- CDN for static files
- Automatic HTTPS
- Good for current setup

**Cons:**
- Cloud Functions have cold start latency
- Costs scale with usage

**Deploy Steps:**

1. **Install Firebase CLI** (if not already):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize project** (if not done):
   ```bash
   firebase use star-wars-d6-species
   ```

3. **Build application:**
   ```bash
   npm run build:web
   ```

4. **Deploy:**
   ```bash
   firebase deploy --only hosting
   firebase deploy --only functions
   firebase deploy --only firestore:rules
   ```

5. **Set Firebase Functions environment variables:**
   ```bash
   firebase functions:config:set mysql.url="mysql://user:pass@host:3306/db"
   firebase functions:config:set firebase.admin_sdk="$(cat path/to/service-account.json)"
   ```

### Option B: VPS/Cloud Server (DigitalOcean, AWS EC2, etc.)

**Pros:**
- Full control
- No cold starts
- Predictable costs

**Cons:**
- Requires server management
- Manual HTTPS setup

**Deploy Steps:**

1. **Provision server** (Ubuntu 22.04 recommended)

2. **Install dependencies:**
   ```bash
   # Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # PM2 for process management
   sudo npm install -g pm2

   # Nginx for reverse proxy
   sudo apt-get install nginx
   ```

3. **Clone repository:**
   ```bash
   git clone <your-repo-url> /var/www/star-wars-d6
   cd /var/www/star-wars-d6
   npm install
   ```

4. **Setup environment:**
   ```bash
   # Copy and edit .env
   cp .env.example .env
   nano .env  # Add production credentials

   # Setup Firebase credentials
   mkdir -p ~/.config/firebase
   # Upload firebase-admin-key.json to server
   mv firebase-admin-key.json ~/.config/firebase/star-wars-d6-service-account.json
   chmod 600 ~/.config/firebase/star-wars-d6-service-account.json
   ```

5. **Build frontend:**
   ```bash
   npm run build:web
   ```

6. **Start API with PM2:**
   ```bash
   pm2 start api/run-local-server.js --name star-wars-d6-api
   pm2 save
   pm2 startup  # Enable auto-start on reboot
   ```

7. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Redirect to HTTPS (after setting up SSL)
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       # Static files
       location / {
           root /var/www/star-wars-d6/web/dist;
           try_files $uri $uri/ /index.html;
       }

       # API proxy
       location /api/ {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option C: Static Hosting + Serverless API

**Example: Netlify/Vercel (Frontend) + Railway/Render (API)**

1. **Frontend on Netlify/Vercel:**
   - Connect GitHub repo
   - Build command: `npm run build:web`
   - Publish directory: `web/dist`
   - Base directory: `/`

2. **API on Railway/Render:**
   - Connect GitHub repo
   - Start command: `node api/run-local-server.js`
   - Add environment variables (MYSQL_URL, GOOGLE_APPLICATION_CREDENTIALS)

## Post-Deployment

### 1. Verify Deployment

**Test checklist:**
- [ ] Homepage loads correctly
- [ ] Species catalog displays with images
- [ ] Starships catalog displays with images (capital ships!)
- [ ] Authentication works (register/login)
- [ ] Character creation requires login
- [ ] Admin features work (show all, reassign)
- [ ] API endpoints respond correctly
- [ ] HTTPS enabled (if applicable)

### 2. Monitor

**Key metrics to watch:**
- API response times
- MySQL connection pool
- Firebase Auth usage
- Error rates
- Memory/CPU usage (if self-hosted)

**Logging:**
```bash
# PM2 logs (if using PM2)
pm2 logs star-wars-d6-api

# Firebase Functions logs
firebase functions:log
```

### 3. Backup Strategy

**Database backups:**
```bash
# Automated daily backup
mysqldump -h host -u user -p database > backup-$(date +%Y%m%d).sql
```

**Code backups:**
- Git repository (already version controlled)
- Firebase Hosting keeps deployment history

## Security Checklist

- [ ] Environment variables not committed to git
- [ ] Firebase Admin SDK credentials secured (600 permissions)
- [ ] MySQL credentials use strong password
- [ ] HTTPS enabled in production
- [ ] CORS configured properly for API
- [ ] Rate limiting enabled (if needed)
- [ ] Firebase security rules deployed
- [ ] Admin claims only for trusted users

## Rollback Plan

**If deployment fails:**

1. **Firebase Hosting:**
   ```bash
   firebase hosting:rollback  # Rollback to previous version
   ```

2. **Self-hosted:**
   ```bash
   git checkout <previous-commit>
   npm run build:web
   pm2 restart star-wars-d6-api
   ```

3. **Database:**
   ```bash
   mysql -h host -u user -p database < backup-YYYYMMDD.sql
   ```

## Cost Estimates

### Firebase (Current Setup)
- Hosting: Free tier (10GB storage, 360MB/day bandwidth)
- Authentication: Free tier (50K MAUs)
- Cloud Functions: Pay-as-you-go (~$0.40 per million invocations)
- **Estimated**: $0-20/month for small traffic

### VPS (Alternative)
- DigitalOcean Droplet: $6-12/month (Basic)
- AWS EC2 t3.micro: ~$8/month
- **Estimated**: $10-20/month

### MySQL Hosting
- Current: Self-hosted (already paid for)
- Alternative: PlanetScale, AWS RDS (~$15-30/month)

## Troubleshooting

### Issue: Firebase Functions timeout
**Solution:** Increase timeout in firebase.json
```json
{
  "functions": [{
    "source": "api",
    "runtime": "nodejs20",
    "timeout": "60s"
  }]
}
```

### Issue: MySQL connection limit
**Solution:** Implement connection pooling
```javascript
const pool = mysql.createPool({
  connectionLimit: 10,
  // ... other config
});
```

### Issue: CORS errors
**Solution:** Configure CORS in API
```javascript
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

## Support

For deployment issues:
1. Check Firebase Console logs
2. Review API server logs (PM2/Cloud Functions)
3. Verify environment variables
4. Test MySQL connection
5. Check Firebase Admin SDK initialization
