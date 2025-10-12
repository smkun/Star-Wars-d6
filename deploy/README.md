# Star Wars d6 Database - Production Deployment Package

## Package Contents

This directory contains everything needed to deploy the Star Wars d6 Database to iFastNet Ultimate hosting.

### Directory Structure

```
deploy/
├── DEPLOYMENT_CHECKLIST.md    # Step-by-step deployment guide
├── README.md                   # This file
├── backend/                    # Node.js API server
│   ├── api/                    # API source code
│   ├── package.json            # Dependencies
│   ├── package-lock.json       # Locked versions
│   └── .env.production         # Environment template
└── frontend/                   # React app (production build)
    ├── index.html              # Entry point
    ├── assets/                 # JS/CSS bundles (652 KB)
    ├── aliens/                 # Species images
    ├── starships/              # Starship images
    ├── icons/                  # Category icons
    └── ...                     # Other static assets
```

## Quick Start

### 1. Upload Files

**Frontend** → `/public_html/` (or your domain root)
```bash
# Upload contents of frontend/ directory
frontend/* → /public_html/
```

**Backend** → `/nodejs/star-wars-api/` (or your Node.js app directory)
```bash
# Upload contents of backend/ directory
backend/* → /nodejs/star-wars-api/
```

### 2. Configure Environment

**On iFastNet server**, create `.env` file from `.env.production` template:
```bash
cd /nodejs/star-wars-api
cp .env.production .env
# Edit .env with your actual domain and credentials
```

### 3. Install Dependencies

```bash
cd /nodejs/star-wars-api
npm install --production
```

### 4. Configure Node.js App

**In iFastNet Control Panel → Node.js**:
- Application Root: `/nodejs/star-wars-api`
- Startup File: `api/run-local-server.js`
- Node.js Version: 20.x or higher

### 5. Upload Firebase Credentials

```bash
mkdir -p ~/.config/firebase
chmod 700 ~/.config/firebase
# Upload firebase-admin-key.json here
chmod 600 ~/.config/firebase/star-wars-d6-service-account.json
```

### 6. Start Application

Restart the Node.js app in iFastNet control panel.

## Detailed Instructions

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for:
- Complete step-by-step deployment guide
- Environment variable configuration
- .htaccess setup for React Router
- Testing procedures
- Troubleshooting guide
- Security checklist

## Architecture

**Frontend**: React + Vite (Static build)
- Served from Apache/NGINX at document root
- Routes handled by React Router with .htaccess fallback
- API calls proxied to Node.js backend

**Backend**: Node.js + Express
- Runs as Node.js app on iFastNet
- Serves API at `/api/*` endpoints
- Connects to MySQL database (already on iFastNet)
- Firebase Auth for authentication

**Database**: MySQL (already configured)
- Host: 31.22.4.44
- Database: gamers_d6Holochron
- Collections: species, starships, characters

## API Endpoints

### Public Endpoints
- `GET /api/species` - List all species
- `GET /api/species/:slug` - Get species by slug
- `GET /api/starships` - List all starships
- `GET /api/starships/:slug` - Get starship by slug

### Protected Endpoints (Require Firebase Auth)
- `GET /api/characters` - List user's characters
- `POST /api/characters` - Create character
- `GET /api/characters/:id` - Get character
- `PUT /api/characters/:id` - Update character
- `DELETE /api/characters/:id` - Delete character

## Environment Variables

Required on iFastNet server:

```bash
MYSQL_URL=mysql://user:pass@host:3306/database
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-admin-key.json
NODE_ENV=production
PORT=3000
ALLOWED_ORIGIN=https://yourdomain.ifastnet.com
```

## Build Information

**Frontend Build**:
- Bundle size: 652 KB (161 KB gzipped)
- CSS: 31 KB (5.7 KB gzipped)
- Build time: ~2 seconds
- Vite version: 7.1.8

**Dependencies**:
- React 19.0.0
- React Router DOM 7.1.1
- Firebase 11.2.0
- Tailwind CSS 3.4.17
- MySQL2 3.11.5
- Express 4.21.2

## Security Notes

✅ **Included in package**:
- Production-ready frontend build
- Secure API with CORS protection
- Firebase authentication integration

⚠️ **NOT included** (must configure on server):
- `.env` file (use `.env.production` template)
- Firebase credentials (upload separately)
- SSL certificate (configure in iFastNet)

🔒 **Security checklist**:
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Firebase credentials protected (600 permissions)
- [ ] CORS limited to your domain
- [ ] Admin claims configured
- [ ] Database backups enabled

## Support

For deployment issues, check:
1. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Complete guide
2. [../docs/IFASTNET_DEPLOYMENT.md](../docs/IFASTNET_DEPLOYMENT.md) - Architecture details
3. iFastNet Node.js app logs
4. Browser console for frontend errors

## Rollback

If deployment fails, you can rollback by:
1. Restoring previous frontend files to `/public_html/`
2. Restoring previous backend code to Node.js app
3. Restarting Node.js app in control panel

---

**Package created**: 2025-10-11
**Build version**: 1.0.0
**Node.js required**: 20.19+ or 22.12+
**Ready for upload**: ✅
