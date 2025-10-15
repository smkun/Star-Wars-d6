# Quick Start - Deploy firebase-admin 12.7.0

## 1. Upload Files (304 KB)

Upload `backend-light/*` to `/home/gamers/nodejs/star-wars-api/`

## 2. SSH and Activate Environment

```bash
ssh gamers@your-server.ifastnet.com
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api
```

## 3. Configure .env

```bash
nano .env.production
# Update GOOGLE_APPLICATION_CREDENTIALS and ALLOWED_ORIGIN
mv .env.production .env
```

## 4. Install Dependencies

```bash
npm install --production
```

## 5. Verify firebase-admin

```bash
npm list firebase-admin
# Should show: firebase-admin@12.7.0
```

## 6. Restart App

iFastNet Control Panel → Software → Node.js → Restart

## 7. Test

```bash
curl https://yourdomain.com/api/species
```

✅ **Done!** No WASM errors should appear in logs.

---

**Full docs**: [DEPLOY.md](DEPLOY.md)
**SSH reference**: [../IFASTNET_SSH_COMMANDS.md](../IFASTNET_SSH_COMMANDS.md)
