#!/usr/bin/env node
'use strict';

/**
 * Calls the deployed importSpecies callable Cloud Function with the contents of
 * Source Data/d6holocron/import-ready.json.
 *
 * Requirements:
 *  - Environment variables:
 *      FIREBASE_API_KEY
 *      FIREBASE_ADMIN_EMAIL
 *      FIREBASE_ADMIN_PASSWORD
 *      FIREBASE_PROJECT (defaults to star-wars-d6-species if omitted)
 *  - Admin user associated with FIREBASE_ADMIN_EMAIL must have custom claim admin=true
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FIREBASE_API_KEY;
const ADMIN_EMAIL = process.env.FIREBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.FIREBASE_ADMIN_PASSWORD;
const PROJECT_ID = process.env.FIREBASE_PROJECT || 'star-wars-d6-species';
const REGION = process.env.FIREBASE_FUNCTION_REGION || 'us-central1';

const PAYLOAD_PATH = path.resolve(
  __dirname,
  '..',
  'Source Data',
  'd6holocron',
  'import-ready.json',
);

if (!API_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    'Missing FIREBASE_API_KEY, FIREBASE_ADMIN_EMAIL, or FIREBASE_ADMIN_PASSWORD environment variables.',
  );
  process.exit(1);
}

const importPayload = JSON.parse(fs.readFileSync(PAYLOAD_PATH, 'utf8'));

async function getIdToken() {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        returnSecureToken: true,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to sign in admin user: ${response.status} ${response.statusText} ${errorBody}`,
    );
  }

  const data = await response.json();
  return data.idToken;
}

async function callImportSpecies(idToken) {
  const response = await fetch(
    `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/importSpecies`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ data: importPayload }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Callable invocation failed: ${response.status} ${response.statusText} ${errorBody}`,
    );
  }

  return response.json();
}

(async () => {
  try {
    console.log('Signing in admin user...');
    const idToken = await getIdToken();
    console.log('Calling importSpecies function...');
    const result = await callImportSpecies(idToken);
    console.log('✅ importSpecies complete:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Failed to invoke importSpecies:', error.message);
    process.exit(1);
  }
})();

