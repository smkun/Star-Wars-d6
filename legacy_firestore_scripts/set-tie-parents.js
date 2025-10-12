#!/usr/bin/env node
/* ARCHIVED COPY: set-tie-parents.js */
/* Original content preserved. Run deliberately with EXPLICIT_FIRESTORE_ACK=1 */
const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '';
const BASE_URL = EMULATOR_HOST
  ? `http://${EMULATOR_HOST}/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`
  : `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;
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
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const setParentFields = async () => {
  console.log('Setting parent/variant fields for TIE fighters...\n');
  let updated = 0;
  let failed = 0;
  for (const slug of TIE_SHIPS) {
    const isBase = BASE_TIE_MODELS.includes(slug);
    const fields = isBase
      ? {
          parent: { nullValue: null },
          variantOf: { nullValue: null },
          isVariant: { booleanValue: false },
        }
      : {
          parent: { stringValue: 'TIE Fighter' },
          variantOf: { stringValue: 'tie-starfighter' },
          isVariant: { booleanValue: true },
        };
    try {
      const keyParam = API_KEY && !EMULATOR_HOST ? `&key=${API_KEY}` : '';
      const url = `${BASE_URL}/starships/${encodeURIComponent(slug)}?updateMask.fieldPaths=parent&updateMask.fieldPaths=variantOf&updateMask.fieldPaths=isVariant${keyParam}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      if (res.ok) {
        console.log(
          `\u2705 ${slug} -> ${isBase ? 'BASE' : 'VARIANT of TIE Fighter'}`
        );
        updated++;
      } else {
        const txt = await res.text();
        console.error(`\u274c ${slug}: ${txt}`);
        failed++;
      }
    } catch (err) {
      console.error(`\u274c ${slug}: ${err.message}`);
      failed++;
    }
    await delay(120);
  }
  console.log(`\nUpdate complete: ${updated} succeeded, ${failed} failed`);
};
setParentFields().catch((e) => {
  console.error(e);
  process.exit(1);
});
