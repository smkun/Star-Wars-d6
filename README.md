# Star Wars d6 Species Catalog

Fast, searchable catalog of Star Wars d6 RPG species with Firebase backend.

## Features

- 🔍 Fast search by name, homeworld, and sources (< 200ms)
- 📱 Responsive design with Star Wars theme
- 🔒 Secure admin-only imports and edits
- 📊 Complete species stats and abilities
- 🖼️ Image support with WebP optimization
- ♿ Accessible and keyboard-navigable
- 📦 Offline-capable PWA

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage, Functions, Hosting)
- **Validation**: Zod schemas
- **Testing**: Vitest (unit) + Playwright (E2E)
- **CI/CD**: GitHub Actions

## Project Structure

```
star-wars-d6/
├── web/                    # Frontend React app
│   ├── src/
│   │   ├── admin/         # Admin UI components
│   │   ├── components/    # Shared UI components
│   │   ├── pages/         # Route pages
│   │   ├── schemas/       # Zod validation schemas
│   │   └── utils/         # Utility functions
│   └── package.json
├── api/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── functions/     # Cloud Functions
│   │   └── utils/         # Shared utilities
│   └── package.json
├── packages/
│   └── types/             # Shared TypeScript types
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
└── package.json           # Root workspace config
```

## Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase CLI: `npm install -g firebase-tools`

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

Follow the detailed guide in [scripts/setup-firebase.md](scripts/setup-firebase.md):

1. Create Firebase project in console
2. Enable Firestore, Auth, Storage, Functions, Hosting
3. Copy Firebase config to `web/.env`
4. Initialize Firebase CLI
5. Deploy security rules
6. Set up admin user

Quick start (only required for production deploys):

```bash
# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy rules
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

### 3. Environment Variables

Copy example files and add your Firebase config:

```bash
cp web/.env.example web/.env
cp api/.env.example api/.env
```

Edit `web/.env` with Firebase config from console.

## Development

## Puppeteer / Headless Chrome smoke test

This repository includes a small smoke script to verify Puppeteer is usable by automated runners (for example, Claude Code or CI).

- Run the smoke test (uses the bundled Chromium by default):

```bash
npm run smoke:puppeteer
```

- Use an existing Chrome/Chromium binary to avoid launching the downloaded Chromium (handy in CI or when system libs are missing):

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser npm run smoke:puppeteer
```

- If the smoke test fails with a shared-library error (for example, missing libxkbcommon.so.0), install the OS packages listed in `TASKS.md` (Debian/Ubuntu and Fedora examples are provided there).

See `scripts/puppeteer-smoke.js` for the exact behavior (it honors the PUPPETEER_EXECUTABLE_PATH env var and prints helpful troubleshooting tips).

### Start Development Servers

**Quick Start (Recommended)**:

```bash
# 1. Create .env file (one-time setup)
cp .env.example .env
# Edit .env and add your MYSQL_URL

# 2. Start both servers with single command
npm run dev
```

This starts:
- MySQL API at http://localhost:4000
- Vite dev server at http://localhost:5173

**Manual Start** (separate terminals):

```bash
# Terminal 1: MySQL API
npm run dev:mysql-api

# Terminal 2: Vite dev server
npm run dev:web
```

📖 **Documentation**:
- [docs/DEV_LAUNCHER.md](docs/DEV_LAUNCHER.md) - Development launcher guide
- [dev/LOCAL_DEV_SETUP.md](dev/LOCAL_DEV_SETUP.md) - Architecture and manual setup

**Note**: Firebase emulators are not required for local development. The web app uses a local MySQL API with Vite proxy. Firebase Auth remains active for authentication.

### Run Tests

```bash
# Run all tests
npm test

# Run web tests only
npm run test:web

# Run with UI
npm run test:web -- --ui

# Run with coverage
npm run test:web -- --coverage
```

### Lint and Format

```bash
# Lint all code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Build and Deploy

### Build for Production

```bash
npm run build
```

This builds:

- Web app → `web/dist/`
- API functions → `api/dist/`

### Deploy to Firebase

```bash
# Deploy everything
npm run firebase:deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Project Workflow

See [CLAUDE.md](CLAUDE.md) for AI-assisted development workflow.

See [TASKS.md](TASKS.md) for detailed task checklist organized by milestone.

See [PLANNING.md](PLANNING.md) for architecture decisions and technical design.

## Scripts Reference

### Root Workspace

- `npm run dev` - Start web dev server
- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run format` - Format all code
- `npm run type-check` - Type check all packages

### Web Package

- `npm run dev --workspace=web` - Start Vite dev server
- `npm run build --workspace=web` - Build production bundle
- `npm run test --workspace=web` - Run Vitest tests
- `npm run preview --workspace=web` - Preview production build

### API Package

- `npm run dev --workspace=api` - Start Functions emulator
- `npm run build --workspace=api` - Compile TypeScript
- `npm run deploy --workspace=api` - Deploy Functions

> Note: emulator support has been removed from the standard dev flow. Use the local MySQL API (`dev:mysql-api`) + Vite proxy for development. Firebase Auth remains in use for authentication flows.

## Contributing

1. Read [CLAUDE.md](CLAUDE.md) for development guidelines
2. Pick a task from [TASKS.md](TASKS.md)
3. Create a feature branch
4. Make changes with tests
5. Run lint and format
6. Commit with descriptive message
7. Push and create PR

## License

MIT

## Resources

- [PRD](PRD.md) - Product Requirements Document
- [PLANNING.md](PLANNING.md) - Technical architecture and design
- [TASKS.md](TASKS.md) - Detailed task breakdown
- [Firebase Setup Guide](scripts/setup-firebase.md) - Step-by-step Firebase configuration

## Security, Secrets & Git LFS

Important housekeeping performed on this repository:

- A sensitive Firebase service-account JSON that was accidentally committed was removed from the reachable history and `master` was force-updated on the remote to a cleaned state. If you or CI ever used that credential, rotate or revoke it in GCP immediately (see "Rotate credentials" below).
- Large build and image assets were migrated into Git LFS to reduce repository object bloat. Anyone who clones this repo must have Git LFS installed.

Rotate credentials (required)

- If the deleted service account was ever used in any environment, rotate its keys or delete the service account in the Google Cloud Console and create a new one. Treat the old private key as compromised.
- Replace credentials on any deployed infrastructure (CI, servers, hosting) with the new service account and ensure the old key is removed.

How to set the service account for local development

- Option A (recommended): Save the service account JSON locally and point Google SDKs at it with:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/star-wars-d6-service-account.json"
# or (if code expects a stringified env var): export FIREBASE_SERVICE_ACCOUNT="$(cat /path/to/star-wars-d6-service-account.json)"
```

- Do NOT commit the JSON or paste it into tracked files. Add it to your machine's secure storage or CI secret store.

Git LFS — short instructions

- Install Git LFS (macOS/Homebrew, Linux package manager, or https://git-lfs.github.com/).
- Initialize locally (one-time):

```bash
git lfs install
```

- The repo tracks large images and build artifacts (see `.gitattributes`). If you need to migrate additional large file patterns, update `.gitattributes` and run `git lfs migrate import --include="path/**"` (this rewrites history and requires a force-push).

What to do after the forced history rewrite

- This repository's `master` branch was force-updated to remove sensitive data. Collaborators should either reclone the repository or reset their local `master` to match the remote. Example commands:

```bash
# fast, destructive sync (recommended for collaborators)
git fetch origin
git checkout master
git reset --hard origin/master

# or simply reclone to avoid any local confusion
git clone <repo-url>
```

- Make sure everyone has Git LFS installed before running `git pull` or cloning, so LFS objects are fetched correctly.

Pre-push checks (recommended)

- Add a lightweight pre-push hook or CI check to scan for common secret patterns (private keys, API keys, service-account.json) to prevent accidental commits. Tools like `detect-secrets`, `git-secrets`, or simple grep checks are useful.

Backup branch

- A pre-cleanup backup branch `backup-before-cleanup-20251012054132` was created during remediation and has now been deleted from this repository to avoid retaining the sensitive state in refs. If you need the pre-cleanup history for any reason, contact the repo owner immediately — it may not be recoverable after deletion.
