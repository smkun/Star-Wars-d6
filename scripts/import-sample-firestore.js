#!/usr/bin/env node
// Disabled script: archived at legacy_firestore_scripts/import-sample-firestore.js
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    '\nERROR: scripts/import-sample-firestore.js has been disabled to prevent accidental Firestore writes.'
  );
  console.error(
    'To run the original script, use the archived copy at legacy_firestore_scripts/import-sample-firestore.js and set EXPLICIT_FIRESTORE_ACK=1'
  );
  process.exitCode = 2;
} else {
  console.log(
    'EXPLICIT_FIRESTORE_ACK provided — run the archived copy directly from legacy_firestore_scripts/ (this stub will not execute the archive).'
  );
}
