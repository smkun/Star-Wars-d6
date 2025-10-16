#!/bin/bash
# Build and package both frontend and backend for deployment

set -e

echo "🚀 Building deployment package..."
echo ""

# Change to project root
cd "$(dirname "$0")/.."

# 1. Build frontend
echo "📦 Building frontend..."
cd web
npm run build
cd ..

# 2. Copy frontend to deploy
echo "📋 Copying frontend to deploy/frontend..."
rsync -av --delete web/dist/ deploy/frontend/

# 3. Copy backend to deploy
echo "📋 Copying backend to deploy/backend..."
rsync -av --delete \
  --exclude 'node_modules' \
  --exclude '.env' \
  api/ deploy/backend/api/

# Create production package.json with only required dependencies
cat > deploy/backend/package.json << 'EOF'
{
  "name": "star-wars-d6-api",
  "version": "1.0.0",
  "description": "Star Wars d6 MySQL API Server",
  "private": true,
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "node app.js"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "firebase-admin": "^12.7.0",
    "mysql2": "^3.15.2"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
EOF

echo "✅ Created production package.json"

# Create or update Passenger entry point wrapper
echo "📋 Creating app.js Passenger wrapper..."
cat > deploy/backend/app.js << 'EOF'
// @ts-nocheck
/* eslint-env node */
// Passenger entry point wrapper for iFastNet hosting
// Loads the actual Express server from api/run-local-server.js
//
// iFastNet's Passenger server expects an app.js file in the root directory
// of the Node.js application. This wrapper delegates to the actual server.
//
// Deployment path: /home/gamers/nodejs/star-wars-api/app.js
//
// Note: This is a CommonJS module (uses require). The IDE may show
// "require is not defined" but this is a false positive - Node.js will
// run this file correctly in CommonJS mode (package.json has no "type": "module").

// Load .env file BEFORE starting the server
// This ensures environment variables are available when Passenger starts the app
require('dotenv').config({ path: __dirname + '/.env' });

require('./api/run-local-server.js');
EOF

# 4. Summary
echo ""
echo "✅ Deployment package ready in deploy/"
echo ""
echo "Frontend bundle:"
ls -lh deploy/frontend/assets/*.js | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "Backend files:"
echo "  deploy/backend/app.js (Passenger entry point)"
echo "  deploy/backend/package.json (production dependencies: mysql2, dotenv, firebase-admin)"
echo "  deploy/backend/api/run-local-server.js (actual server)"
echo ""
echo "📤 Upload deploy/frontend/ and deploy/backend/ to production"
echo "   Run 'npm install --production' in backend directory"
echo "   Then restart Node.js app on iFastNet"
