#!/usr/bin/env node
/* ARCHIVED COPY: set-tie-parents-admin.js */
/* Original content preserved for audit. Use with EXPLICIT_FIRESTORE_ACK=1 */
const admin = require('firebase-admin');
const PROJECT_ID = process.env.FIREBASE_PROJECT || 'star-wars-d6-species';
admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const BASE_TIE_MODELS = ['tie-starfighter', 'tie-in-fighter'];
const TIE_SHIPS = [
  'f-45b-hi-tie-medium-starfighter',
  'super-tie-ln',
  'tie-y-ugly',
  'tie-ad-x7-defender-prototype',
  'tie-d-automated-fighter',
  'tie-d-defender',
  'tie-f-starfighter',
  'tie-shuttle-mk-ii',
  'tie-ad-advanced-avenger',
  'tie-fc-fire-control',
  'tie-gt-ground-targeting',
  'tie-ht-hunter',
  'tie-in-fighter',
  'tie-ni-enforcer',
  'tie-opp-oppressor',
  'tie-prd-predator',
  'tie-rc-reconnaissance',
  'tie-rpt-raptor',
  'tie-sa-bomber',
  'tie-sh-shuttle',
  'tie-va-vanguard',
  'tie-dart',
  'tie-escort',
  'tie-interceptor',
  'tie-phantom',
  'tie-prototype',
  'tie-spirit-interceptor',
  'tie-starfighter',
  'tie-vampire-mk1',
  'x-tie-ugly',
  'y-tie-ugly',
];

async function run() {
  console.log('Updating TIE parent/variant fields using Admin SDK...');
  let updated = 0;
  let failed = 0;
  for (const slug of TIE_SHIPS) {
    const isBase = BASE_TIE_MODELS.includes(slug);
    const ref = db.collection('starships').doc(slug);
    try {
      if (isBase) {
        await ref.set(
          { parent: null, variantOf: null, isVariant: false },
          { merge: true }
        );
      } else {
        await ref.set(
          {
            parent: 'TIE Fighter',
            variantOf: 'tie-starfighter',
            isVariant: true,
          },
          { merge: true }
        );
      }
      console.log(`\u2705 ${slug}`);
      updated++;
    } catch (e) {
      console.error(`\u274c ${slug}: ${e.message}`);
      failed++;
    }
  }
  console.log(`\nDone. ${updated} updated, ${failed} failed.`);
  process.exit(failed ? 1 : 0);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
