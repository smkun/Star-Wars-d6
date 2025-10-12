#!/usr/bin/env node
// Disabled stub: original archived at legacy_firestore_scripts/export-firestore-to-mysql.js
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error(
    '\nERROR: scripts/export-firestore-to-mysql.js has been disabled to prevent accidental Firestore reads/writes.'
  );
  console.error(
    'Archived copy available at legacy_firestore_scripts/export-firestore-to-mysql.js'
  );
  process.exitCode = 2;
} else {
  console.log(
    'EXPLICIT_FIRESTORE_ACK provided — run the archived copy directly from legacy_firestore_scripts/'
  );
}
