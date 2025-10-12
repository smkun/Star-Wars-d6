#!/usr/bin/env node
/** SHIM: set-tie-parents.js
 * Original archived to legacy_firestore_scripts/set-tie-parents.js
 * To run intentionally: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/set-tie-parents.js
 */
/* eslint-env node */
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    'This script has been archived to legacy_firestore_scripts/ and will not run by default.'
  );
  console.error(
    'To run intentionally: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/set-tie-parents.js'
  );
  process.exit(1);
}

require('../legacy_firestore_scripts/set-tie-parents.js');
