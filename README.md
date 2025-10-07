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

Quick start:

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

### Start Emulators and Dev Server

```bash
# Terminal 1: Start Firebase emulators
npm run firebase:emulators

# Terminal 2: Start web dev server
npm run dev:web
```

Visit http://localhost:5173 (web app) and http://localhost:4000 (emulator UI).

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

## Firebase Emulator Ports

- **Auth**: 9099
- **Firestore**: 8080
- **Functions**: 5001
- **Storage**: 9199
- **Emulator UI**: 4000

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
