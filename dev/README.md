# Dev: Emulator + Seeding

This repository previously supported a Firebase Emulator Suite workflow. The standard development flow now uses the local MySQL-backed API and Vite proxy.

Quick start (local API + web):

1. Start the local API (set `MYSQL_URL` first):

```bash
export MYSQL_URL='mysql://<user>:<pass>@<host>:3306/gamers_d6Holochron'
npm run dev:mysql-api
```

2. Start the web dev server:

```bash
npm run dev:web
```

Notes:

- The seeder scripts still exist and can be run against a production Firebase project if desired (they expect `GOOGLE_APPLICATION_CREDENTIALS` to be set). If you need an emulator-based workflow later, we can re-enable the emulator instructions.
