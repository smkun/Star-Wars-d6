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

# Copy package files
cp package.json deploy/backend/
cp package-lock.json deploy/backend/

# 4. Summary
echo ""
echo "✅ Deployment package ready in deploy/"
echo ""
echo "Frontend bundle:"
ls -lh deploy/frontend/assets/*.js | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "Backend API:"
echo "  deploy/backend/api/run-local-server.js"
echo ""
echo "📤 Upload deploy/frontend/ and deploy/backend/ to production"
echo "   Then restart Node.js app on iFastNet"
