#!/usr/bin/env node
/* eslint-env node */
// Disabled shim: archived copy available at legacy_firestore_scripts/sync-image-urls.js
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    '\nERROR: scripts/sync-image-urls.js has been disabled to prevent accidental Firestore writes.'
  );
  console.error(
    'Run the archived copy at legacy_firestore_scripts/sync-image-urls.js with EXPLICIT_FIRESTORE_ACK=1 if you really intend to run it.'
  );
  process.exitCode = 2;
} else {
  console.log(
    'EXPLICIT_FIRESTORE_ACK provided — run the archived copy directly from legacy_firestore_scripts/'
  );
}
