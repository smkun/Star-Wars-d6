# iFastNet Node.js App Checklist

Use this reference after uploading the backend bundle so the managed Node.js app has everything it needs to run.

## Required Files
- **Firebase service account JSON** uploaded to `/home/gamers/.config/firebase/star-wars-d6-service-account.json`.
  ```bash
  mkdir -p ~/.config/firebase
  chmod 700 ~/.config/firebase
  # upload the JSON file, then
  chmod 600 ~/.config/firebase/star-wars-d6-service-account.json
  ```

## Environment Variables (set in cPanel → Setup Node.js App)
- `PORT=3000`
- `NODE_ENV=production`
- `MYSQL_URL=mysql://gamers_sa:KAd5Og-nJbDc%25%3FC%26@31.22.4.44:3306/gamers_d6Holochron`
- `ALLOWED_ORIGIN=https://32gamers.ifastnet.com`
- `GOOGLE_APPLICATION_CREDENTIALS=/home/gamers/.config/firebase/star-wars-d6-service-account.json`
- Optional: keep the `DB_*` variables if other scripts need them.

## Dependencies (install inside the CloudLinux virtualenv)
```bash
rm -rf ~/nodejs/star-wars-api/node_modules ~/nodejs/star-wars-api/api/node_modules
~/nodevenv/nodejs/star-wars-api/20/bin/npm install --omit=dev mysql2 firebase-admin --prefix ~/nodejs/star-wars-api/api
```

## Sanity Check Before Restarting
```bash
MYSQL_URL='mysql://gamers_sa:KAd5Og-nJbDc%25%3FC%26@31.22.4.44:3306/gamers_d6Holochron' \
GOOGLE_APPLICATION_CREDENTIALS=/home/gamers/.config/firebase/star-wars-d6-service-account.json \
~/nodevenv/nodejs/star-wars-api/20/bin/node ~/nodejs/star-wars-api/api/run-local-server.js
# In another shell:
curl http://localhost:3000/species
```
If the curl returns JSON, stop the manual server (Ctrl+C) and use the cPanel UI to restart the Node.js app.

## After Restart
- `https://32gamers.com/api/species` should return JSON.
- Frontend pages (species, starships, characters) should load without 503 errors.

