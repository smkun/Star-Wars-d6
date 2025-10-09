# Local Development Setup

This guide explains how to run the Star Wars d6 catalog in local development mode using the MySQL-backed API.

## Architecture

```
Browser (localhost:5173) → Vite Dev Server → MySQL API (localhost:4000) → MySQL DB
                            ↓ Proxy /api/*
```

The web app uses a Vite proxy to forward `/api/*` requests to the local MySQL API server.

## Prerequisites

1. **MySQL Database Access**: You need credentials for the hosted MySQL database (`gamers_d6Holochron`)
2. **Node.js**: Version 20.0.0 or higher
3. **Dependencies**: Run `npm install` in project root

## Setup Steps

### 1. Configure MySQL Credentials

Create a `.env` file in the project root (this file is gitignored):

```bash
# .env (DO NOT COMMIT THIS FILE)
MYSQL_URL=mysql://username:password@host:3306/gamers_d6Holochron
```

**Important**: Never commit this file to version control. The `.gitignore` already excludes it.

### 2. Start the MySQL API Server

In **Terminal 1**, start the MySQL API:

```bash
# Option A: Using npm script (reads .env automatically if using dotenv)
npm run dev:mysql-api

# Option B: Export env var first
export MYSQL_URL='mysql://username:password@host:3306/gamers_d6Holochron'
npm run dev:mysql-api
```

You should see:
```
Local API listening on 4000
```

**Troubleshooting**:

- **Port 4000 in use**: Kill the process using `lsof -ti:4000 | xargs kill -9`
- **MYSQL_URL not set**: Verify `.env` file exists or export the variable
- **Connection refused**: Check MySQL host, port, and credentials

### 3. Start the Vite Dev Server

In **Terminal 2**, start the web app:

```bash
npm run dev:web
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 4. Verify the Setup

**Test API directly**:
```bash
curl http://localhost:4000/species | jq '.[0]'
```

Expected: JSON with species data including `slug`, `name`, `homeworld`, `properties.stats`

**Test via Vite proxy**:
```bash
curl http://localhost:5173/api/species | jq '.[0]'
```

Expected: Same response (proxied through Vite)

**Open in browser**:
```
http://localhost:5173/
```

You should see:
- Home page with category tiles
- Species catalog at `/species` with 47+ species
- Individual species detail pages at `/species/{slug}`

## Project Structure

```
api/
├── run-local-server.js      # MySQL API server (port 4000)
└── src/
    └── server.ts             # TypeScript Express server (future)

web/
├── src/
│   ├── pages/
│   │   ├── Catalog.tsx       # Species catalog (uses speciesApi)
│   │   └── SpeciesDetail.tsx # Species detail (uses speciesApi)
│   └── utils/
│       └── speciesApi.ts     # API adapter (/api/species)
└── vite.config.ts            # Proxy: /api → localhost:4000
```

## API Endpoints

### GET /species
Returns all species (limit 1000):
```json
[
  {
    "slug": "bothan",
    "name": "Bothan",
    "classification": "Mammal",
    "homeworld": "Bothawui",
    "description": "...",
    "properties": {
      "stats": {
        "attributeDice": "12D",
        "attributes": { ... },
        "move": "10/12",
        "size": "1.5m"
      }
    },
    "imageUrl": "/images/bothan.webp"
  }
]
```

### GET /species/:slug
Returns single species by slug:
```json
{
  "slug": "bothan",
  "name": "Bothan",
  ...
}
```

## Firebase Auth

Firebase Authentication is still used for admin features. The MySQL API only handles species data reads. Admin authentication flows remain unchanged:

```typescript
import { getAuth } from 'firebase/auth';
// Auth still works via Firebase
```

## Development Workflow

1. **Start both servers**: MySQL API (Terminal 1) + Vite (Terminal 2)
2. **Make changes**: Edit files in `web/src/`
3. **Hot reload**: Vite automatically reloads on file changes
4. **Test changes**: Verify in browser at `http://localhost:5173`

## Differences from Firebase Emulator

The previous Firebase emulator setup has been removed. Key differences:

| Feature | Firebase Emulator | MySQL API |
|---------|------------------|-----------|
| Data source | Firestore emulator | Hosted MySQL |
| Startup | `firebase emulators:start` | `npm run dev:mysql-api` |
| Port | 8080 (UI), 8081 (Functions) | 4000 (API) |
| Auth | Emulated | Real Firebase Auth |
| Data persistence | Local only | Shared database |

## Common Issues

### Port conflicts
```bash
# Check what's using port 4000
lsof -i:4000

# Kill process
lsof -ti:4000 | xargs kill -9
```

### MYSQL_URL format errors
Ensure format is:
```
mysql://user:pass@host:3306/database
```

Not:
```
mysql://user@host/database  # Missing password and port
```

### Missing dependencies
```bash
# Install all workspace dependencies
npm install

# Verify mysql2 is installed
npm list mysql2
```

### API returns empty array
Check that MySQL database has species data:
```bash
export MYSQL_URL='...'
node -e "
const mysql = require('mysql2/promise');
mysql.createConnection(process.env.MYSQL_URL).then(async c => {
  const [rows] = await c.query('SELECT COUNT(*) as cnt FROM species');
  console.log('Species count:', rows[0].cnt);
  await c.end();
});
"
```

## Next Steps

After verifying local setup works:

1. **Document in CLAUDE.md**: Add link to this guide
2. **Update README.md**: Include local dev instructions
3. **Remove emulator references**: Clean up legacy scripts if not needed
4. **Deploy to production**: Use Firebase Hosting for static assets

## Production Deployment

For production, the MySQL API should be deployed as:

- **Option A**: Firebase Cloud Function (callable/HTTPS)
- **Option B**: Cloud Run container
- **Option C**: Express server on VPS/PaaS

Static web assets deploy to Firebase Hosting with CDN.
