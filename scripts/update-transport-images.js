#!/usr/bin/env node
/* eslint-env node */
// Disabled shim: archived copy available at legacy_firestore_scripts/update-transport-images.js
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    'This script has been archived to legacy_firestore_scripts/ and will not run by default.'
  );
  console.error(
    'To run intentionally: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/update-transport-images.js'
  );
  process.exit(1);
}
require('../legacy_firestore_scripts/update-transport-images.js');
