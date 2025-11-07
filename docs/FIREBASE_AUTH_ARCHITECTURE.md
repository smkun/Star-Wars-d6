# Firebase Authentication Architecture

## Overview

This document explains how Firebase Authentication is integrated into the Star Wars d6 application, covering both frontend (React) and backend (Node.js Express API) implementations.

**Authentication Flow**: Firebase client-side auth → ID tokens → Backend verification via Firebase Admin SDK

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Authentication](#frontend-authentication)
3. [Backend Token Verification](#backend-token-verification)
4. [Protected Routes](#protected-routes)
5. [API Authentication Flow](#api-authentication-flow)
6. [Admin Custom Claims](#admin-custom-claims)
7. [Development Mode](#development-mode)
8. [Complete Request Flow](#complete-request-flow)
9. [File Locations](#file-locations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React SPA)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐          ┌────────────────┐                     │
│  │  Login.tsx   │          │ Register.tsx   │                     │
│  │  - Email/Pass│          │ - Create Account│                    │
│  │  - Google    │          │ - Email/Pass   │                     │
│  └──────┬───────┘          └───────┬────────┘                     │
│         │                          │                              │
│         └──────────┬───────────────┘                              │
│                    │                                               │
│                    ▼                                               │
│         ┌──────────────────────┐                                  │
│         │  firebase.ts         │                                  │
│         │  - Firebase Config   │                                  │
│         │  - auth = getAuth()  │                                  │
│         └──────────┬───────────┘                                  │
│                    │                                               │
│         ┌──────────▼───────────┐                                  │
│         │  auth.currentUser    │                                  │
│         │  .getIdToken()       │                                  │
│         └──────────┬───────────┘                                  │
│                    │                                               │
│                    ▼                                               │
│         ┌──────────────────────┐                                  │
│         │  api.ts              │                                  │
│         │  fetchWithAuth()     │                                  │
│         │  Authorization:      │                                  │
│         │  Bearer <token>      │                                  │
│         └──────────┬───────────┘                                  │
│                    │                                               │
└────────────────────┼───────────────────────────────────────────────┘
                     │
                     │ HTTP Request
                     │ GET /api/characters
                     │ Authorization: Bearer eyJhbGc...
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js Express)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│         ┌────────────────────────┐                                 │
│         │ run-local-server.js    │                                 │
│         │ resolveAuthInfo()      │                                 │
│         └────────┬───────────────┘                                 │
│                  │                                                  │
│                  ▼                                                  │
│         ┌────────────────────────┐                                 │
│         │ firebaseAdmin.js       │                                 │
│         │ verifyIdToken(token)   │                                 │
│         └────────┬───────────────┘                                 │
│                  │                                                  │
│                  ▼                                                  │
│         ┌────────────────────────┐                                 │
│         │ Firebase Admin SDK     │                                 │
│         │ - Verify signature     │                                 │
│         │ - Check expiration     │                                 │
│         │ - Extract claims       │                                 │
│         └────────┬───────────────┘                                 │
│                  │                                                  │
│                  ▼                                                  │
│         ┌────────────────────────┐                                 │
│         │ Return: {              │                                 │
│         │   uid: "oWfK2...",     │                                 │
│         │   admin: true,         │                                 │
│         │   claims: {...}        │                                 │
│         │ }                      │                                 │
│         └────────┬───────────────┘                                 │
│                  │                                                  │
│                  ▼                                                  │
│         ┌────────────────────────┐                                 │
│         │ MySQL Query            │                                 │
│         │ WHERE user_id = uid    │                                 │
│         └────────┬───────────────┘                                 │
│                  │                                                  │
│                  ▼                                                  │
│         ┌────────────────────────┐                                 │
│         │ JSON Response          │                                 │
│         └────────────────────────┘                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Authentication

### 1. Firebase Client Configuration

**File**: [web/src/utils/firebase.ts](../web/src/utils/firebase.ts)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: 'star-wars-d6-species.firebaseapp.com',
  projectId: 'star-wars-d6-species',
  storageBucket: 'star-wars-d6-species.firebasestorage.app',
  messagingSenderId: '13155025417',
  appId: '1:13155025417:web:0b6c99afb060cb772aaed8',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
```

**Key Points:**
- Firebase client SDK initialized once at app startup
- `auth` object exported for use throughout the application
- API key can be public (Firebase restricts access via security rules and domain restrictions)
- Environment variable `VITE_FIREBASE_API_KEY` for build-time injection (optional)

### 2. Login Component

**File**: [web/src/pages/Login.tsx](../web/src/pages/Login.tsx)

```typescript
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/utils/firebase';

// Email/Password Login
async function handleEmailLogin(e: React.FormEvent) {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    navigate('/characters');
  } catch (err: any) {
    if (err.code === 'auth/invalid-credential') {
      setError('Invalid email or password');
    }
    // ... error handling
  }
}

// Google OAuth Login
async function handleGoogleLogin() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    navigate('/characters');
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user') {
      setError('Login cancelled');
    }
    // ... error handling
  }
}
```

**Authentication Methods Supported:**
- ✅ Email/Password (`signInWithEmailAndPassword`)
- ✅ Google OAuth (`signInWithPopup`)
- Extensible to other providers (GitHub, Facebook, etc.)

**Error Handling:**
- `auth/invalid-credential` - Wrong email/password
- `auth/user-not-found` - Account doesn't exist
- `auth/too-many-requests` - Rate limit exceeded
- `auth/popup-closed-by-user` - User cancelled OAuth
- `auth/popup-blocked` - Browser blocked popup

### 3. Registration Component

**File**: [web/src/pages/Register.tsx](../web/src/pages/Register.tsx)

```typescript
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/utils/firebase';

async function handleRegister(e: React.FormEvent) {
  e.preventDefault();
  try {
    // Create Firebase user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Set display name
    await updateProfile(userCredential.user, { displayName });

    navigate('/characters');
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      setError('Email already registered');
    }
    // ... error handling
  }
}
```

**Registration Flow:**
1. Create user account via `createUserWithEmailAndPassword`
2. Update profile with display name via `updateProfile`
3. User automatically signed in after registration
4. Redirect to protected route

### 4. Protected Routes

**File**: [web/src/components/ProtectedRoute.tsx](../web/src/components/ProtectedRoute.tsx)

```typescript
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '@/utils/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Still loading auth state
  if (user === undefined) {
    return <div>Loading...</div>;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated - render protected content
  return <>{children}</>;
}
```

**State Machine:**
- `undefined` - Loading auth state (show spinner)
- `null` - Not authenticated (redirect to login)
- `User object` - Authenticated (render children)

**Usage in App.tsx:**
```typescript
<Route path="/characters/*" element={
  <ProtectedRoute>
    <CharacterRoutes />
  </ProtectedRoute>
} />
```

### 5. API Request Helper

**File**: [web/src/utils/api.ts](../web/src/utils/api.ts)

```typescript
import { auth } from './firebase';

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(); // Returns JWT token
}

export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {}
) {
  // Get Firebase ID token
  let token = await getIdToken();

  // Dev mode fallback (see Development Mode section)
  if (!token && import.meta.env.DEV) {
    token = `dev:${import.meta.env.VITE_DEV_AUTH_UID || 'scottkunian@gmail.com'}`;
    console.log('[DEV] Using dev auth token');
  }

  // Add Authorization header
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // Route through Vite proxy: /characters → /api/characters
  let resolvedInput = input;
  if (typeof input === 'string' && input.startsWith('/')) {
    if (!input.startsWith('/api')) {
      resolvedInput = `/api${input}`;
    }
  }

  return fetch(resolvedInput, { ...init, headers });
}
```

**Key Features:**
- Automatically gets fresh Firebase ID token
- Adds `Authorization: Bearer <token>` header
- Routes relative paths through Vite dev proxy
- Dev mode fallback for testing without Firebase

**Example Usage:**
```typescript
// In CharactersList.tsx
const response = await fetchWithAuth('/characters');
const characters = await response.json();
```

---

## Backend Token Verification

### 1. Firebase Admin SDK Setup

**File**: [api/firebaseAdmin.js](../api/firebaseAdmin.js)

```javascript
let admin = null;
let initialized = false;

function ensureInitialized() {
  if (initialized) return;

  // Lazy require to avoid breaking environments without package
  admin = require('firebase-admin');

  // Option 1: Full service account JSON in env variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
    initialized = true;
    return;
  }

  // Option 2: GOOGLE_APPLICATION_CREDENTIALS path (recommended)
  // Admin SDK will pick it up automatically via ADC
  admin.initializeApp();
  initialized = true;
}

async function verifyIdToken(idToken) {
  ensureInitialized();
  return admin.auth().verifyIdToken(idToken);
}

module.exports = { verifyIdToken, ensureInitialized };
```

**Credential Loading Options:**

1. **Recommended**: Service account file path
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
   ```

2. **Alternative**: JSON string in environment variable
   ```bash
   export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   ```

**Service Account JSON Format:**
```json
{
  "type": "service_account",
  "project_id": "star-wars-d6-species",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-...@star-wars-d6-species.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 2. API Server Authentication Middleware

**File**: [api/run-local-server.js](../api/run-local-server.js)

```javascript
const firebaseAdmin = require('./firebaseAdmin');

// Helper: resolve auth info from Authorization header
async function resolveAuthInfo() {
  const auth = (req.headers && req.headers.authorization) || '';

  // Check for Bearer token
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();

  // Production: Verify Firebase ID token via Admin SDK
  if (
    firebaseAdmin &&
    (process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_SERVICE_ACCOUNT)
  ) {
    try {
      const decoded = await firebaseAdmin.verifyIdToken(token);
      return {
        uid: decoded.uid,
        admin: !!decoded.admin || !!(decoded.claims && decoded.claims.admin),
        claims: decoded,
      };
    } catch (e) {
      console.warn('Failed to verify Firebase ID token:', e && e.message);
      return null;
    }
  }

  // Dev mode fallback (see Development Mode section)
  if (process.env.DEV_AUTH === 'true' && token.startsWith('dev:')) {
    const uid = token.slice('dev:'.length);
    const admin = token.startsWith('dev-admin:');
    return { uid, admin, claims: {} };
  }

  return null;
}
```

**Return Values:**
- `null` - No valid auth (return 401)
- `{ uid, admin, claims }` - Valid authentication
  - `uid` - User's Firebase UID (e.g., `oWfK2bwb7FbveHTk5rHM2uqLPgF2`)
  - `admin` - Boolean indicating admin custom claim
  - `claims` - Full decoded token payload

### 3. Protected Endpoint Examples

**User-Specific Data (Characters):**
```javascript
// GET /characters - List user's characters
if (pathname === '/characters' && req.method === 'GET') {
  const authInfo = await resolveAuthInfo();
  if (!authInfo) return json(res, { error: 'unauthorized' }, 401);

  // Admin can view all characters
  const whereClause = authInfo.admin
    ? ''
    : 'WHERE user_id = ?';

  const rows = await queryRows(
    `SELECT * FROM characters ${whereClause} ORDER BY name`,
    authInfo.admin ? [] : [authInfo.uid]
  );

  return json(res, rows);
}
```

**Admin-Only Endpoint:**
```javascript
// GET /users - List all Firebase users (admin only)
if (pathname === '/users' && req.method === 'GET') {
  const authInfo = await resolveAuthInfo();
  if (!authInfo) return json(res, { error: 'unauthorized' }, 401);
  if (!authInfo.admin) return json(res, { error: 'admin_required' }, 403);

  firebaseAdmin.ensureInitialized();
  const admin = require('firebase-admin');
  const listUsersResult = await admin.auth().listUsers();

  const users = listUsersResult.users.map(user => ({
    uid: user.uid,
    email: user.email || 'No email',
    displayName: user.displayName || user.email || 'Unknown',
  }));

  return json(res, users);
}
```

**Public Endpoint (No Auth Required):**
```javascript
// GET /species - Public species list
if (pathname === '/species' && req.method === 'GET') {
  const rows = await queryRows(
    'SELECT slug, name, classification FROM species ORDER BY name'
  );
  return json(res, rows);
}
```

---

## Protected Routes

### Frontend Routing

**File**: [web/src/App.tsx](../web/src/App.tsx)

```typescript
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/species" element={<Catalog />} />
        <Route path="/starships" element={<Starships />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/characters" element={
          <ProtectedRoute>
            <CharactersList />
          </ProtectedRoute>
        } />
        <Route path="/characters/new" element={
          <ProtectedRoute>
            <CharacterNew />
          </ProtectedRoute>
        } />
        <Route path="/characters/:id" element={
          <ProtectedRoute>
            <CharacterDetail />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
```

**Route Types:**
- **Public**: Accessible without authentication
- **Auth**: Login/Register pages (redirect to /characters if already logged in)
- **Protected**: Require authentication, redirect to /login if not authenticated

---

## API Authentication Flow

### Request Flow Example

```
1. User clicks "View Characters"
   ├─ ProtectedRoute checks: auth.currentUser exists? ✅
   └─ Renders CharactersList component

2. CharactersList.tsx mounts
   ├─ Calls: fetchWithAuth('/characters')
   └─ api.ts intercepts

3. api.ts processing
   ├─ Gets Firebase ID token: auth.currentUser.getIdToken()
   │  └─ Token: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2M..."
   ├─ Adds header: Authorization: Bearer eyJhbGc...
   ├─ Transforms path: /characters → /api/characters
   └─ Sends: fetch('/api/characters', { headers: {...} })

4. Vite dev proxy (localhost:5173)
   ├─ Sees: /api/characters
   ├─ Routes to: http://localhost:4000/characters
   └─ Forwards Authorization header

5. Passenger (production) OR local API server
   ├─ Receives: GET /characters
   ├─ Headers: { Authorization: "Bearer eyJhbGc..." }
   └─ Calls: resolveAuthInfo()

6. resolveAuthInfo()
   ├─ Extracts token from header
   ├─ Calls: firebaseAdmin.verifyIdToken(token)
   └─ Firebase Admin SDK verifies:
      ├─ Token signature (RSA public key)
      ├─ Expiration (exp claim)
      ├─ Audience (aud claim matches project ID)
      └─ Issuer (iss claim matches Firebase)

7. Firebase Admin SDK returns
   └─ {
        uid: "oWfK2bwb7FbveHTk5rHM2uqLPgF2",
        email: "scottkunian@gmail.com",
        admin: true,
        exp: 1697500000,
        iat: 1697496400,
        ...
      }

8. API queries MySQL
   ├─ SQL: SELECT * FROM characters WHERE user_id = ?
   ├─ Params: ["oWfK2bwb7FbveHTk5rHM2uqLPgF2"]
   └─ Returns: [{ id: "uuid", name: "Bilar Saruun", ... }]

9. API responds
   ├─ Status: 200 OK
   ├─ Body: [{ id: "uuid", name: "Bilar Saruun", ... }]
   └─ CORS headers set

10. Frontend receives
    ├─ CharactersList.tsx: setCharacters(data)
    └─ Renders character cards
```

---

## Admin Custom Claims

### What Are Custom Claims?

Firebase allows setting custom data on user accounts that is included in ID tokens. We use this for admin privileges:

```javascript
// Token without admin claim
{
  uid: "abc123",
  email: "user@example.com"
}

// Token with admin claim
{
  uid: "abc123",
  email: "admin@example.com",
  admin: true  // ← Custom claim
}
```

### Setting Admin Claims

**Script**: [scripts/set-admin-claim.js](../scripts/set-admin-claim.js)

```javascript
const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const email = process.argv[2]; // e.g., "scottkunian@gmail.com"

async function setAdminClaim(email) {
  // Find user by email
  const user = await admin.auth().getUserByEmail(email);

  // Set custom claim
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });

  console.log(`✅ Admin claim set for ${email}`);
  console.log('⚠️  User must sign out and back in for claim to take effect');
}

setAdminClaim(email).catch(console.error);
```

**Usage:**
```bash
# Set GOOGLE_APPLICATION_CREDENTIALS environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Run script with user email
node scripts/set-admin-claim.js scottkunian@gmail.com
```

**Important**: User must sign out and sign back in for the claim to appear in new ID tokens.

### Checking Admin Status (Frontend)

**File**: [web/src/pages/CharactersList.tsx](../web/src/pages/CharactersList.tsx)

```typescript
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Get token result with custom claims
      const idTokenResult = await user.getIdTokenResult();
      setIsAdmin(!!idTokenResult.claims.admin);
    } else {
      setIsAdmin(false);
    }
  });

  return () => unsubscribe();
}, []);

// Conditional UI based on admin status
{isAdmin && (
  <div>
    <label>
      <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
      Show all characters
    </label>
  </div>
)}
```

### Admin Feature Example: Character Reassignment

```typescript
// Admin can reassign character ownership
async function handleReassign(characterId: string, newUserId: string) {
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`/api/characters/${characterId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: newUserId }),
  });

  if (!response.ok) {
    throw new Error('Failed to reassign character');
  }
}
```

**Backend Handler:**
```javascript
// PATCH /characters/:id - Reassign ownership (admin only)
if (pathname.startsWith('/characters/') && req.method === 'PATCH') {
  const authInfo = await resolveAuthInfo();
  if (!authInfo) return json(res, { error: 'unauthorized' }, 401);
  if (!authInfo.admin) return json(res, { error: 'admin_required' }, 403);

  const characterId = pathname.split('/')[2];
  const body = await readBody(req);
  const { user_id } = JSON.parse(body);

  await queryRows(
    'UPDATE characters SET user_id = ? WHERE id = ?',
    [user_id, characterId]
  );

  return json(res, { success: true });
}
```

---

## Development Mode

### Problem

During local development, you may want to test authenticated endpoints without setting up Firebase or logging in every time.

### Solution: Dev Auth Tokens

**Frontend Dev Mode** ([web/src/utils/api.ts](../web/src/utils/api.ts)):

```typescript
async function getIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  let token = await getIdToken();

  // Dev mode fallback: use dev token if no Firebase user
  if (!token && import.meta.env.DEV) {
    const devUid = import.meta.env.VITE_DEV_AUTH_UID || 'scottkunian@gmail.com';
    token = `dev:${devUid}`;
    console.log('[DEV] Using dev auth token:', devUid);
  }

  // ... rest of function
}
```

**Backend Dev Mode** ([api/run-local-server.js](../api/run-local-server.js)):

```javascript
async function resolveAuthInfo() {
  const auth = (req.headers && req.headers.authorization) || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();

  // Production: Verify via Firebase Admin SDK
  if (firebaseAdmin && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const decoded = await firebaseAdmin.verifyIdToken(token);
      return { uid: decoded.uid, admin: !!decoded.admin, claims: decoded };
    } catch (e) {
      console.warn('Failed to verify token:', e.message);
      return null;
    }
  }

  // Dev mode fallback: accept dev:<uid> when DEV_AUTH=true
  if (process.env.DEV_AUTH === 'true' && token.startsWith('dev:')) {
    const uid = token.slice('dev:'.length);
    const admin = token.startsWith('dev-admin:');
    return { uid, admin, claims: {} };
  }

  return null;
}
```

**Environment Setup**:

```bash
# Backend .env
DEV_AUTH=true  # Enable dev auth mode

# Frontend .env
VITE_DEV_AUTH_UID=scottkunian@gmail.com  # Default dev user
```

**Dev Token Formats:**
- Regular user: `dev:user@example.com`
- Admin user: `dev-admin:admin@example.com`

**Security Note**: Dev mode MUST be disabled in production. The backend checks `process.env.DEV_AUTH === 'true'` to enable it.

---

## Complete Request Flow

### Authenticated Request Example

**1. User Action:**
```typescript
// CharactersList.tsx
useEffect(() => {
  loadCharacters();
}, []);

async function loadCharacters() {
  const response = await fetchWithAuth('/characters');
  const data = await response.json();
  setCharacters(data);
}
```

**2. Frontend Processing:**
```typescript
// api.ts: fetchWithAuth()
const user = auth.currentUser; // Firebase user object
const token = await user.getIdToken(); // Get fresh ID token

// Token structure (JWT):
// eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2M...
//   Header: { alg: "RS256", kid: "..." }
//   Payload: { uid: "oWfK2bwb...", email: "user@example.com", exp: 1697500000, ... }
//   Signature: <RSA signature>

headers.set('Authorization', `Bearer ${token}`);
fetch('/api/characters', { headers });
```

**3. HTTP Request:**
```http
GET /api/characters HTTP/1.1
Host: localhost:5173
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2M...
Accept: application/json
```

**4. Vite Dev Proxy:**
```javascript
// vite.config.ts proxy rule
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}

// Transforms: /api/characters → http://localhost:4000/characters
```

**5. Backend Receives:**
```javascript
// run-local-server.js
const pathname = '/characters';
const authHeader = req.headers.authorization; // "Bearer eyJhbGc..."
```

**6. Token Verification:**
```javascript
const authInfo = await resolveAuthInfo();
// → firebaseAdmin.verifyIdToken(token)
//   → Firebase Admin SDK contacts Firebase Auth servers
//   → Validates signature using Google's public keys
//   → Checks expiration, audience, issuer
//   → Returns decoded payload

// authInfo = {
//   uid: "oWfK2bwb7FbveHTk5rHM2uqLPgF2",
//   admin: true,
//   claims: { ... }
// }
```

**7. Database Query:**
```javascript
if (!authInfo) return json(res, { error: 'unauthorized' }, 401);

const whereClause = authInfo.admin ? '' : 'WHERE user_id = ?';
const params = authInfo.admin ? [] : [authInfo.uid];

const rows = await queryRows(
  `SELECT * FROM characters ${whereClause} ORDER BY name`,
  params
);
// SQL: SELECT * FROM characters WHERE user_id = 'oWfK2bwb...' ORDER BY name
```

**8. Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true

[
  {
    "id": "a8fe3ac3-42f7-4f78-ac03-0b7c1a0e836f",
    "name": "Bilar Saruun",
    "user_id": "oWfK2bwb7FbveHTk5rHM2uqLPgF2",
    "species_slug": "ithorian",
    ...
  }
]
```

**9. Frontend Renders:**
```typescript
setCharacters(data);
// → React re-renders CharactersList with data
```

---

## File Locations

### Frontend Files

| File | Purpose |
|------|---------|
| [web/src/utils/firebase.ts](../web/src/utils/firebase.ts) | Firebase client configuration and exports |
| [web/src/utils/api.ts](../web/src/utils/api.ts) | `fetchWithAuth()` helper for authenticated requests |
| [web/src/pages/Login.tsx](../web/src/pages/Login.tsx) | Email/password and Google OAuth login |
| [web/src/pages/Register.tsx](../web/src/pages/Register.tsx) | User registration with email/password |
| [web/src/components/ProtectedRoute.tsx](../web/src/components/ProtectedRoute.tsx) | Route wrapper requiring authentication |
| [web/src/App.tsx](../web/src/App.tsx) | Route definitions with protected routes |
| [web/src/pages/CharactersList.tsx](../web/src/pages/CharactersList.tsx) | Example of admin claim checking and usage |

### Backend Files

| File | Purpose |
|------|---------|
| [api/firebaseAdmin.js](../api/firebaseAdmin.js) | Firebase Admin SDK initialization and token verification |
| [api/run-local-server.js](../api/run-local-server.js) | Express API with `resolveAuthInfo()` middleware |
| [scripts/set-admin-claim.js](../scripts/set-admin-claim.js) | Script to set admin custom claims on users |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env` (backend) | `GOOGLE_APPLICATION_CREDENTIALS`, `DEV_AUTH` |
| `.env` (frontend) | `VITE_FIREBASE_API_KEY`, `VITE_DEV_AUTH_UID` |
| Service account JSON | Firebase Admin SDK credentials (DO NOT COMMIT) |

### Documentation

| File | Purpose |
|------|---------|
| [docs/ADMIN_SETUP.md](../docs/ADMIN_SETUP.md) | Admin custom claim setup guide |
| [docs/FIREBASE_AUTH_ARCHITECTURE.md](../docs/FIREBASE_AUTH_ARCHITECTURE.md) | This document |

---

## Security Best Practices

### ✅ Do

1. **Use Firebase Admin SDK on backend** for token verification
2. **Verify tokens server-side** - never trust client claims
3. **Check custom claims on backend** for admin operations
4. **Use HTTPS in production** to protect tokens in transit
5. **Set appropriate CORS policies** to restrict API access
6. **Rotate service account keys** periodically
7. **Store service account JSON securely** (600 permissions, not in git)
8. **Use environment variables** for all credentials
9. **Implement rate limiting** on auth endpoints

### ❌ Don't

1. **Never commit service account JSON** to version control
2. **Never trust client-side auth state** for authorization
3. **Never expose Firebase Admin SDK** on client
4. **Never use dev mode in production** (`DEV_AUTH=true`)
5. **Never hardcode credentials** in source code
6. **Never skip token verification** on protected endpoints
7. **Never use client-side security rules** for server authorization
8. **Never expose internal user IDs** in public APIs

---

## Troubleshooting

### Frontend Issues

**Problem**: "auth/operation-not-allowed"
- **Cause**: Email/password auth not enabled in Firebase Console
- **Fix**: Firebase Console → Authentication → Sign-in method → Enable Email/Password

**Problem**: "auth/invalid-api-key"
- **Cause**: Wrong API key or project configuration
- **Fix**: Check `firebaseConfig` in `firebase.ts` matches Firebase Console settings

**Problem**: Protected route redirects to login immediately
- **Cause**: Auth state not loaded yet
- **Fix**: `ProtectedRoute` shows loading spinner while `user === undefined`

### Backend Issues

**Problem**: "Failed to verify Firebase ID token"
- **Cause**: Service account not configured or invalid token
- **Fix**: Set `GOOGLE_APPLICATION_CREDENTIALS` to service account JSON path

**Problem**: "firebase-admin not found"
- **Cause**: Package not installed
- **Fix**: `npm install firebase-admin` in backend directory

**Problem**: All requests return 401 unauthorized
- **Cause**: Token not sent or verification failing
- **Fix**: Check `Authorization` header is set and Firebase Admin SDK initialized

**Problem**: Admin features not working
- **Cause**: Custom claim not set or user hasn't signed out/in
- **Fix**: Run `set-admin-claim.js` script, user must sign out and back in

### Dev Mode Issues

**Problem**: Dev tokens not working
- **Cause**: `DEV_AUTH` not set to `'true'` (string) in backend `.env`
- **Fix**: `DEV_AUTH=true` in `.env` file (restart API server)

**Problem**: Dev mode works in development but not production
- **Cause**: `DEV_AUTH=true` accidentally set in production
- **Fix**: Remove `DEV_AUTH` from production `.env` immediately

---

## Summary

**Authentication Flow**:
1. User signs in via Firebase client SDK (email/password or Google OAuth)
2. Firebase returns authenticated user with ID token (JWT)
3. Frontend includes token in `Authorization: Bearer <token>` header
4. Backend verifies token via Firebase Admin SDK
5. Backend extracts UID and custom claims from verified token
6. Backend queries database with user ID for user-specific data
7. Backend responds with authorized data

**Key Components**:
- **Firebase Auth** (client): User authentication and ID token generation
- **Firebase Admin SDK** (server): Token verification and user management
- **Custom Claims**: Admin privileges encoded in ID tokens
- **Protected Routes**: Frontend route guards requiring authentication
- **Auth Middleware**: Backend token verification and user identification
- **Dev Mode**: Local development testing without Firebase

**Security Model**:
- Client-side auth is for UX (showing/hiding UI elements)
- Server-side verification is for security (actual authorization)
- Never trust client claims - always verify tokens server-side
- Admin operations require both custom claim AND server-side verification

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Author**: Based on Star Wars d6 Firebase authentication implementation
