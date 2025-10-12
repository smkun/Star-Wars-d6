#!/usr/bin/env node
/**
 * LEGACY Firestore script (import-with-admin.js)
 * WARNING: This script writes directly to Firestore. The repository now uses
 * MySQL as the canonical data store. To run this script intentionally set
 * EXPLICIT_FIRESTORE_ACK=1 in the environment. Without this variable the
#!/usr/bin/env node
/* eslint-env node */
// Disabled shim: archived copy available at legacy_firestore_scripts/import-with-admin.js
if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
  console.error('\nERROR: scripts/import-with-admin.js has been disabled to prevent accidental Firestore writes.');
  console.error('Run the archived copy at legacy_firestore_scripts/import-with-admin.js with EXPLICIT_FIRESTORE_ACK=1 if you really intend to run it.');
  process.exitCode = 2;
} else {
  console.log('EXPLICIT_FIRESTORE_ACK provided — run the archived copy directly from legacy_firestore_scripts/');
}
}
