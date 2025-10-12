# Admin Setup Guide

This guide explains how to set up admin users who can view all characters and reassign ownership.

## Prerequisites

1. Firebase project configured
2. Firebase Admin SDK service account JSON file
3. Node.js installed

## Setting Admin Custom Claim

### Step 1: Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file securely (e.g., `firebase-admin-key.json`)

### Step 2: Set Environment Variable

```bash
export FIREBASE_SERVICE_ACCOUNT=/path/to/firebase-admin-key.json
# Or
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-admin-key.json
```

### Step 3: Run Admin Claim Script

```bash
node scripts/set-admin-claim.js scottkunian@gmail.com
```

Expected output:
```
Found user: abc123... (scottkunian@gmail.com)
✅ Admin claim set for scottkunian@gmail.com
User must sign out and sign back in for claim to take effect
Custom claims: { admin: true }
```

### Step 4: Verify Admin Access

1. **User must sign out and sign back in** for the claim to take effect
2. After signing in, the Characters page will show:
   - "Show all" checkbox (admin only)
   - User ID column when viewing all characters
   - "Reassign" button for each character

## Admin Capabilities

When signed in as admin with "Show all" enabled:

### View All Characters
- Admin can see characters from all users
- Each character card shows the owner's user ID

### Reassign Character Ownership
1. Click "Reassign" on any character
2. Enter new owner's user ID (Firebase UID)
3. Click "Save"
4. Character ownership is updated immediately

## Security Notes

1. **Service Account Security**
   - Never commit `firebase-admin-key.json` to git
   - Add to `.gitignore`: `*-admin-key.json`
   - Store securely (environment variable, secrets manager)

2. **Admin Role Security**
   - Admin custom claim is verified server-side via Firebase Admin SDK
   - Cannot be spoofed by client-side code
   - Only users with admin claim can access admin-only endpoints

3. **API Security**
   - `GET /characters?all=true` - Requires admin claim
   - `PATCH /characters/:id` - Requires admin claim (ownership change)
   - Regular users only see their own characters

## Finding User IDs

To get a user's Firebase UID for reassignment:

### Method 1: Firebase Console
1. Go to Firebase Console → Authentication → Users
2. Find the user by email
3. Copy the User UID column

### Method 2: Admin Character List
1. Sign in as admin
2. Enable "Show all" checkbox
3. User IDs are displayed under each character name

## Removing Admin Access

To remove admin privileges:

```bash
node scripts/set-admin-claim.js user@example.com --remove
```

Or manually via Firebase Admin SDK:
```javascript
await firebaseAdmin.auth.setCustomUserClaims(uid, { admin: false });
// or
await firebaseAdmin.auth.setCustomUserClaims(uid, null);
```

## Troubleshooting

### "Admin claim not working"
- Ensure user signed out and back in after claim was set
- Check browser console for auth token refresh
- Verify service account has necessary permissions

### "Cannot read firebase-admin-key.json"
- Check file path in environment variable
- Ensure file has read permissions
- Verify JSON format is valid

### "User not found"
- User must create account first (register via /register page)
- Check spelling of email address
- Verify user exists in Firebase Console → Authentication

## Development Mode

For local development without Firebase Admin SDK:

```bash
# Start API with dev auth enabled
export DEV_AUTH=true
export MYSQL_URL='...'
npm run dev:mysql-api
```

Dev mode tokens:
- Regular user: `dev:user@example.com`
- Admin user: `dev-admin:admin@example.com`

**Note:** Dev auth should never be enabled in production.
