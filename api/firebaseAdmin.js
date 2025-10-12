/**
 * Firebase Admin initialization helper
 * - Initializes firebase-admin when a service account is available via
 *   GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT (JSON string).
 * - Exposes verifyIdToken(token) that resolves to decoded token.
 *
 * This file intentionally tolerates missing admin SDK at require-time and
 * surfaces clear errors to the operator so they can run `npm i firebase-admin`.
 */
let admin = null;
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  try {
    // Lazily require to avoid breaking environments without the package
    admin = require('firebase-admin');
  } catch (e) {
    throw new Error(
      'Missing dependency: firebase-admin. Run `npm install firebase-admin` in the api workspace.'
    );
  }

  // If a full service account JSON is passed in env, use it
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
    initialized = true;
    return;
  }

  // If GOOGLE_APPLICATION_CREDENTIALS is set, admin SDK will pick it up
  // automatically via ADC. We still need to initialize the app if not already.
  try {
    admin.initializeApp();
    initialized = true;
  } catch (e) {
    // If initializeApp fails because it's already been initialized, ignore
    if (!/already exists/.test(String(e))) throw e;
    initialized = true;
  }
}

async function verifyIdToken(idToken) {
  ensureInitialized();
  return admin.auth().verifyIdToken(idToken);
}

module.exports = {
  verifyIdToken,
  ensureInitialized,
};
