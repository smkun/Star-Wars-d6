#!/usr/bin/env node
// Disabled stub: original archived at legacy_firestore_scripts/replace-all-starships.js
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    '\nERROR: scripts/replace-all-starships.js has been disabled to prevent accidental Firestore writes.'
  );
  console.error(
    'Run the archived copy at legacy_firestore_scripts/replace-all-starships.js with EXPLICIT_FIRESTORE_ACK=1 if you really intend to run it.'
  );
  process.exitCode = 2;
} else {
  console.log(
    'EXPLICIT_FIRESTORE_ACK provided — run the archived copy directly from legacy_firestore_scripts/'
  );
}
