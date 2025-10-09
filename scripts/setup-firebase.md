# Firebase Setup Guide

Step-by-step instructions to create and configure Firebase project for Star Wars d6 Species Catalog.

## Prerequisites

- Node.js 20+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Google account

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `star-wars-d6-species` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 2: Enable Services

### Firestore Database

1. In Firebase Console, navigate to **Firestore Database**
2. Click "Create database"
3. Select **Production mode**
4. Choose Cloud Firestore location (e.g., `us-central1`)
5. Click "Enable"

### Authentication

1. Navigate to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider
4. (Optional) Enable **Multi-factor authentication** in Settings

### Storage

1. Navigate to **Storage**
2. Click "Get started"
3. Accept default security rules (we'll deploy custom rules)
4. Choose Storage location (same as Firestore)
5. Click "Done"

### Hosting

1. Navigate to **Hosting**
2. Click "Get started"
3. Follow prompts (we'll use Firebase CLI for actual setup)

### Functions

1. Navigate to **Functions**
2. Click "Get started"
3. Upgrade to Blaze plan (required for Functions)
   - Note: Blaze plan has free tier limits sufficient for development

## Step 3: Get Firebase Config

1. In Project Overview (gear icon → Project settings)
2. Scroll to "Your apps" section
3. Click "Add app" → Web (</>) icon
4. Register app name: `Star Wars d6 Web`
5. Copy the Firebase config object

### Create web/.env

Create `web/.env` file with your Firebase config:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Step 4: Initialize Firebase CLI

```bash
# Login to Firebase
firebase login

# Initialize project (from repo root)
firebase init

# Select:
# - Firestore (rules and indexes)
# - Functions (use existing api/ directory)
# - Hosting (use web/dist as public directory)
# - Storage (use storage.rules)

# When prompted:
# - Use existing firestore.rules
# - Use existing firestore.indexes.json
# - Use TypeScript for Functions: No (we have custom setup)
# - Use existing storage.rules
# - Single-page app: Yes
# - Set up GitHub Actions: No (we have custom workflow)
```

## Step 5: Deploy Security Rules

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Storage rules
firebase deploy --only storage:rules
```

## Step 6: Set Up Admin User

After deploying Functions, set admin custom claim:

```bash
# Get user UID from Authentication tab in Firebase Console
# Or create user first:
firebase auth:export users.json
# Note the UID of your admin user

# Set admin claim using Firebase CLI
firebase functions:shell
# In the shell:
admin.auth().setCustomUserClaims('YOUR_USER_UID', { admin: true })
```

Alternatively, create `scripts/set-admin-claim.js`:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

const userEmail = 'your-admin@example.com'; // Replace with your email

admin
  .auth()
  .getUserByEmail(userEmail)
  .then((user) => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log(`✅ Admin claim set for ${userEmail}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

Run with:

```bash
cd api
node ../scripts/set-admin-claim.js
```

## Step 7: Test Firebase Setup

```bash
# (Optional) Start local services or run against a real project
# To test locally against emulators you manage, start them separately. The standard dev flow uses the local MySQL API and Vite proxy.

# Start the web dev server
npm run dev

# Verify:
# - Firestore rules are enforced when running against a real project
# - Public can read species collection
# - Unauthenticated users cannot write
```

## Step 8: Install Dependencies

```bash
# Install all workspace dependencies
npm install

# This installs:
# - Root workspace dependencies
# - web/ dependencies (React, Vite, Firebase SDK)
# - api/ dependencies (firebase-admin, firebase-functions)
# - packages/types dependencies
```

## Verification Checklist

- [ ] Firebase project created in console
- [ ] Firestore enabled in production mode
- [ ] Authentication with Email/Password enabled
- [ ] Storage enabled
- [ ] Hosting enabled
- [ ] Upgraded to Blaze plan
- [ ] Firebase config copied to web/.env
- [ ] Firebase CLI initialized and linked to project
- [ ] Security rules deployed
- [ ] Indexes deployed
- [ ] Admin user created with custom claim
- [ ] Emulators running successfully
- [ ] Dependencies installed

## Troubleshooting

### "Missing permissions" error when deploying

- Ensure you're logged in: `firebase login`
- Check IAM permissions in Google Cloud Console

### Emulators fail to start

- Check if ports are available: 4000, 5001, 8080, 9099, 9199
- Kill processes using ports: `lsof -ti:8080 | xargs kill -9`

### Admin claim not working

- User must sign out and sign in again for custom claims to take effect
- Verify claim in Firebase Console: Authentication → Users → Custom claims

### Functions deployment fails

- Ensure Node 20 runtime specified in api/package.json engines
- Check Functions logs in Firebase Console

## Next Steps

After completing setup:

1. Run `npm run firebase:emulators` to start local development
2. Complete M0 tasks in TASKS.md
3. Proceed to M1: Import and Display features
