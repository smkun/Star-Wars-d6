#!/usr/bin/env node
// LEGACY Firestore script: update-firestore-direct.js (archived)
const fs = require('fs');
const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'star-wars-d6-species' });
const db = admin.firestore();

module.exports = { db };
#!/usr/bin/env node
// Archived: update-firestore-direct.js
// Moved to legacy folder. Requires EXPLICIT_FIRESTORE_ACK=1 to run intentionally.
console.error(
  '\nThis script has been archived to legacy_firestore_scripts/update-firestore-direct.js.'
);
console.error(
  'To run it intentionally set EXPLICIT_FIRESTORE_ACK=1 and run from the legacy folder.\n'
);
process.exit(1);
