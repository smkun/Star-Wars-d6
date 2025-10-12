#!/usr/bin/env node
/* SHIM: seed-full-emulator.js */
/* Archived to legacy_firestore_scripts/seed-full-emulator.js */
/* eslint-env node */
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    'This script has been archived to legacy_firestore_scripts/ and will not run by default.'
  );
  console.error(
    'To run intentionally: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/seed-full-emulator.js'
  );
  process.exit(1);
}

require('../legacy_firestore_scripts/seed-full-emulator.js');
