# iFastNet SSH Commands Reference

## Environment Setup

**IMPORTANT**: iFastNet uses a Node.js virtual environment that must be activated before running npm commands.

### Activate Node.js Environment

```bash
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api
```

**Breakdown**:
- `source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate` - Activates Node.js 20 virtual environment
- `cd /home/gamers/nodejs/star-wars-api` - Changes to application directory

### One-Line Setup Command

For convenience, use this single command:

```bash
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api
```

## Common Commands

### After Activating Environment

Once environment is activated, you can run:

```bash
# Install dependencies
npm install --production

# Check installed packages
npm list

# Check firebase-admin version
npm list firebase-admin

# Update a specific package
npm install firebase-admin@12.7.0 --save

# Remove old dependencies
rm -rf node_modules package-lock.json
npm install --production

# Check Node.js version
node --version

# Test the server (if not running as service)
node api/run-local-server.js
```

## Deployment Workflow

### Complete Deployment Process

```bash
# 1. Connect via SSH
ssh gamers@your-server.ifastnet.com

# 2. Activate Node.js environment and navigate to app
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api

# 3. Backup current setup
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz api/ package.json .env

# 4. (Upload new files via FTP/File Manager first)

# 5. Install/update dependencies
npm install --production

# 6. Verify firebase-admin version
npm list firebase-admin
# Should show: firebase-admin@12.7.0

# 7. Check configuration
cat .env | grep -E "MYSQL_URL|GOOGLE_APPLICATION_CREDENTIALS|ALLOWED_ORIGIN"

# 8. Exit environment
deactivate

# 9. Restart Node.js app (via control panel or if CLI available)
# pm2 restart star-wars-api  # If pm2 is available
```

## Troubleshooting Commands

### Check Environment

```bash
# Verify Node.js version
node --version
# Should be: v20.x.x

# Verify npm version
npm --version

# Check which node
which node
# Should show: /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/node

# Check environment variables
env | grep NODE
```

### Debug Installation Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --production

# Verbose install (see what's happening)
npm install --production --loglevel=verbose

# Check for errors in package-lock.json
cat package-lock.json | grep firebase-admin
```

### Check Running Processes

```bash
# Find Node.js processes
ps aux | grep node

# Check port usage
lsof -i :3000  # Or whatever port your app uses

# Check app logs (if accessible)
tail -f /path/to/app/logs/app.log
```

## File Paths Reference

### Important Directories

```bash
# Application root
/home/gamers/nodejs/star-wars-api/

# Node.js virtual environment
/home/gamers/nodevenv/nodejs/star-wars-api/20/

# Typical file structure
/home/gamers/nodejs/star-wars-api/
├── api/
│   ├── run-local-server.js
│   └── ...
├── node_modules/
├── package.json
├── package-lock.json
└── .env
```

### Configuration Files

```bash
# Environment variables
/home/gamers/nodejs/star-wars-api/.env

# Firebase credentials (typical location)
/home/gamers/.config/firebase/star-wars-d6-service-account.json

# Package manifest
/home/gamers/nodejs/star-wars-api/package.json
```

## Quick Reference

### Essential Commands Cheat Sheet

```bash
# SSH login
ssh gamers@server.ifastnet.com

# Activate environment (ALWAYS RUN FIRST)
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api

# Install dependencies
npm install --production

# Check firebase-admin
npm list firebase-admin

# Verify environment
node --version && npm --version

# Exit environment
deactivate

# Exit SSH
exit
```

## Notes

### Why Virtual Environment?

iFastNet uses Python-style virtual environments for Node.js to:
- Isolate different Node.js versions per app
- Prevent conflicts between applications
- Allow multiple Node.js versions on the same server

### Environment Path Pattern

```
/home/<username>/nodevenv/nodejs/<app-name>/<node-version>/bin/activate
```

For this project:
- Username: `gamers`
- App name: `star-wars-api`
- Node version: `20`

### Deactivating Environment

When you're done, deactivate the environment:

```bash
deactivate
```

This returns you to the system's default Node.js (if any).

## Deployment Checklist

Use this for every deployment:

```bash
# 1. Activate environment
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api

# 2. Verify location
pwd
# Should output: /home/gamers/nodejs/star-wars-api

# 3. Install dependencies
npm install --production

# 4. Check firebase-admin
npm list firebase-admin | grep firebase-admin
# Should show: firebase-admin@12.7.0

# 5. Verify .env exists
ls -la .env
# Should exist

# 6. Deactivate
deactivate

# 7. Restart app (via control panel)
# Go to iFastNet Control Panel → Node.js → Restart
```

## Common Errors

### "npm: command not found"

**Cause**: Virtual environment not activated

**Fix**:
```bash
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate
```

### "EACCES: permission denied"

**Cause**: Running npm without proper environment

**Fix**:
1. Activate environment first
2. Or check file permissions: `ls -la`

### "Cannot find module 'firebase-admin'"

**Cause**: Dependencies not installed or installed in wrong location

**Fix**:
```bash
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate
cd /home/gamers/nodejs/star-wars-api
rm -rf node_modules
npm install --production
```

## Additional Resources

- iFastNet Node.js Documentation: Check control panel for version-specific docs
- Virtual Environment Docs: Similar to Python's venv
- Node.js Version Manager: iFastNet handles this automatically

---

**Last Updated**: 2025-10-13
**Node.js Version**: 20.x
**Application**: star-wars-api
**Username**: gamers
