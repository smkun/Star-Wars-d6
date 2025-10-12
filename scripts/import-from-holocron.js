#!/usr/bin/env node
// Disabled stub: original archived at legacy_firestore_scripts/import-from-holocron.js
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    '\nERROR: scripts/import-from-holocron.js has been disabled to prevent accidental Firestore imports.'
  );
  console.error(
    'Archived copy available at legacy_firestore_scripts/import-from-holocron.js'
  );
  process.exitCode = 2;
} else {
  console.log(
    'EXPLICIT_FIRESTORE_ACK provided — run the archived copy directly from legacy_firestore_scripts/'
  );
}
