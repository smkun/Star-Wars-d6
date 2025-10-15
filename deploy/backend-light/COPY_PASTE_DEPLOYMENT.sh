#!/bin/bash
# ========================================
# iFastNet Deployment Script
# firebase-admin 12.7.0 Upgrade
# ========================================
#
# INSTRUCTIONS:
# 1. SSH to iFastNet: ssh gamers@your-server.ifastnet.com
# 2. Copy and paste each section below ONE AT A TIME
# 3. Wait for each section to complete before running the next
# 4. Check output for errors after each section
#
# ========================================

# ========================================
# SECTION 1: Activate Environment & Navigate
# ========================================
echo "=== Activating Node.js Environment ==="
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api
echo "Current directory: $(pwd)"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# ========================================
# SECTION 2: Backup Current Setup
# ========================================
echo "=== Creating Backup ==="
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" api/ package.json package-lock.json .env 2>/dev/null || echo "Some files missing - partial backup created"
ls -lh "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"
echo ""

# ========================================
# SECTION 3: Check Current firebase-admin Version
# ========================================
echo "=== Current firebase-admin Version ==="
npm list firebase-admin 2>/dev/null || echo "firebase-admin not found or node_modules missing"
echo ""

# ========================================
# SECTION 4: Configure Environment Variables
# ========================================
echo "=== Checking .env Configuration ==="
if [ -f .env ]; then
    echo ".env file exists"
    echo "Current configuration:"
    grep -E "MYSQL_URL|GOOGLE_APPLICATION_CREDENTIALS|ALLOWED_ORIGIN|NODE_ENV" .env | sed 's/=.*/=***/' || echo "Some variables missing"
else
    echo "WARNING: .env file not found!"
    echo "You need to create .env from .env.production template"
    echo "Run: nano .env.production"
    echo "Then: mv .env.production .env"
fi
echo ""

# ========================================
# SECTION 5: Clean Install Dependencies
# ========================================
echo "=== Installing Dependencies ==="
echo "This will install firebase-admin 12.7.0..."
echo ""

# Remove old dependencies
rm -rf node_modules package-lock.json

# Install production dependencies
npm install --production

echo ""
echo "Installation complete!"
echo ""

# ========================================
# SECTION 6: Verify firebase-admin Version
# ========================================
echo "=== Verifying firebase-admin Version ==="
npm list firebase-admin
echo ""

# Check if 12.7.0 is installed
if npm list firebase-admin | grep -q "12.7.0"; then
    echo "✅ SUCCESS: firebase-admin 12.7.0 is installed"
else
    echo "⚠️  WARNING: firebase-admin version may not be 12.7.0"
    echo "Check the version above"
fi
echo ""

# ========================================
# SECTION 7: Verify File Structure
# ========================================
echo "=== Verifying File Structure ==="
echo "Checking required files and directories..."
echo ""

[ -d "api" ] && echo "✅ api/ directory exists" || echo "❌ api/ directory missing"
[ -f "api/run-local-server.js" ] && echo "✅ api/run-local-server.js exists" || echo "❌ run-local-server.js missing"
[ -f "api/firebaseAdmin.js" ] && echo "✅ api/firebaseAdmin.js exists" || echo "❌ firebaseAdmin.js missing"
[ -d "node_modules" ] && echo "✅ node_modules/ exists" || echo "❌ node_modules/ missing"
[ -d "node_modules/firebase-admin" ] && echo "✅ firebase-admin installed" || echo "❌ firebase-admin not installed"
[ -f "package.json" ] && echo "✅ package.json exists" || echo "❌ package.json missing"
[ -f ".env" ] && echo "✅ .env exists" || echo "⚠️  .env missing - needs configuration"

echo ""

# ========================================
# SECTION 8: Check Firebase Credentials
# ========================================
echo "=== Checking Firebase Credentials ==="
if [ -f ".env" ]; then
    CRED_PATH=$(grep GOOGLE_APPLICATION_CREDENTIALS .env | cut -d'=' -f2)
    if [ -n "$CRED_PATH" ]; then
        echo "Credentials path: $CRED_PATH"
        if [ -f "$CRED_PATH" ]; then
            echo "✅ Firebase credentials file exists"
            ls -lh "$CRED_PATH"
        else
            echo "❌ Firebase credentials file NOT FOUND at: $CRED_PATH"
            echo "You need to upload the service account JSON file"
        fi
    else
        echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS not set in .env"
    fi
else
    echo "❌ .env file not found"
fi
echo ""

# ========================================
# SECTION 9: Test Configuration
# ========================================
echo "=== Testing Node.js Startup ==="
echo "Attempting to load firebaseAdmin module..."
node -e "try { require('./api/firebaseAdmin'); console.log('✅ firebaseAdmin module loads successfully'); } catch(e) { console.log('❌ Error loading firebaseAdmin:', e.message); }" 2>&1
echo ""

# ========================================
# SECTION 10: Summary
# ========================================
echo "========================================="
echo "DEPLOYMENT SUMMARY"
echo "========================================="
echo ""
echo "Package Information:"
npm list firebase-admin | head -3
echo ""
echo "Node.js Version: $(node --version)"
echo "npm Version: $(npm --version)"
echo "Working Directory: $(pwd)"
echo ""
echo "Next Steps:"
echo "1. ✅ Dependencies installed"
echo "2. ⚠️  Verify .env configuration above"
echo "3. ⚠️  Verify Firebase credentials exist"
echo "4. 🔄 Restart Node.js app in iFastNet Control Panel"
echo "5. 🧪 Test API endpoints"
echo ""
echo "To restart the app:"
echo "- Go to: iFastNet Control Panel → Software → Node.js"
echo "- Find: star-wars-api"
echo "- Click: Restart"
echo ""
echo "To test after restart:"
echo "curl https://yourdomain.com/api/species"
echo ""
echo "========================================="
echo "Deployment preparation complete!"
echo "========================================="

# Don't forget to deactivate when done
echo ""
echo "When finished, deactivate environment with: deactivate"
