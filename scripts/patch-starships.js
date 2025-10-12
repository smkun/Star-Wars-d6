#!/usr/bin/env node
/* SHIM: patch-starships.js */
/* Archived to legacy_firestore_scripts/patch-starships.js */
/* eslint-env node */
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    'This script has been archived to legacy_firestore_scripts/ and will not run by default.'
  );
  console.error(
    'To run intentionally: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/patch-starships.js'
  );
  process.exit(1);
}

require('../legacy_firestore_scripts/patch-starships.js');
