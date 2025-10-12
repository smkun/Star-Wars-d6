#!/usr/bin/env node
'use strict';

/**
 * Find and delete duplicate/problematic variant documents
 * These are variants with generic names that duplicate properly-named variants
 */

const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';

async function findAndDeleteDuplicates() {
  console.log('Finding duplicate variant documents...\n');
#!/usr/bin/env node
/* eslint-env node */
// Disabled shim: archived copy available at legacy_firestore_scripts/cleanup-duplicate-variants.js
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error('\nERROR: scripts/cleanup-duplicate-variants.js has been disabled to prevent accidental Firestore writes.');
  console.error('Run the archived copy at legacy_firestore_scripts/cleanup-duplicate-variants.js with EXPLICIT_FIRESTORE_ACK=1 if you really intend to run it.');
  process.exitCode = 2;
} else {
  console.log('EXPLICIT_FIRESTORE_ACK provided — run the archived copy directly from legacy_firestore_scripts/');
}

