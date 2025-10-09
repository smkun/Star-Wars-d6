#!/usr/bin/env node
const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = 'AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww';

// ALL TIE ship slugs - set them ALL to variants except tie-starfighter
const ALL_TIES = [
  'tie-starfighter',  // This will be the ONLY base
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
  'tie-vampire-mk1',
  'x-tie-ugly',
  'y-tie-ugly',
  'beltrunner-tie-advanced-variant',
  'beltrunner-tie-bomber-varient',
];

async function fixAllTies() {
  console.log('Setting ALL TIE fighters with universal parent...\n');

  let updated = 0;
  let failed = 0;

  for (const slug of ALL_TIES) {
    const isBase = (slug === 'tie-starfighter');

    const fields = isBase
      ? {
          name: { stringValue: 'TIE Fighter' },
          parent: { nullValue: null },
          isVariant: { booleanValue: false },
        }
      : {
          parent: { stringValue: 'TIE Fighter' },
          isVariant: { booleanValue: true },
        };

    try {
      const updateMask = isBase
        ? 'updateMask.fieldPaths=name&updateMask.fieldPaths=parent&updateMask.fieldPaths=isVariant'
        : 'updateMask.fieldPaths=parent&updateMask.fieldPaths=isVariant';

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/starships/${slug}?${updateMask}&key=${API_KEY}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
        }
      );

      if (response.ok) {
        console.log(`✅ ${slug} → ${isBase ? 'BASE "TIE Fighter"' : 'VARIANT of TIE Fighter'}`);
        updated++;
      } else {
        const error = await response.text();
        console.error(`❌ ${slug}: ${error}`);
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`❌ ${slug}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${updated} succeeded, ${failed} failed`);
}

fixAllTies();
