#!/usr/bin/env node
/* SHIM: verify-tie-data.js */
/* Original archived to legacy_firestore_scripts/verify-tie-data.js */
/* eslint-env node */
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    'This script has been archived to legacy_firestore_scripts/ and will not run by default.'
  );
  console.error(
    'To run intentionally: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/verify-tie-data.js'
  );
  process.exit(1);
}

require('../legacy_firestore_scripts/verify-tie-data.js');
