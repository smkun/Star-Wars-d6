#!/bin/bash
# Start API server with Firebase Admin SDK credentials

export GOOGLE_APPLICATION_CREDENTIALS="/tmp/firebase-admin-key.json"
# MYSQL_URL should be provided via environment or .env; do NOT hardcode credentials here.
# Example: export MYSQL_URL='mysql://user:password@host:3306/database'

echo "Starting API server with Firebase Admin SDK..."
echo "Admin authentication: ENABLED"
echo ""

npm run dev:mysql-api
