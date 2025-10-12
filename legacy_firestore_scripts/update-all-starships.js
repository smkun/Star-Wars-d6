#!/usr/bin/env node
// Archived copy of scripts/update-all-starships.js
// To run intentionally: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/update-all-starships.js <import-ready-json>

const fs = require('fs');

const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const updateAllStarships = async (jsonPath) => {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(
    `Updating ${data.starships.length} starships (will overwrite existing)...`
  );

  let updated = 0;
  let failed = 0;

  for (const starship of data.starships) {
    const slug = slugify(starship.name);

    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/starships/${slug}?key=${API_KEY}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              /* ... */
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ ${starship.name}:`, JSON.stringify(error, null, 2));
        failed++;
      } else {
        updated++;
      }
    } catch (err) {
      console.error(`❌ ${starship.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Update complete: ${updated} succeeded, ${failed} failed`);
};

module.exports = { updateAllStarships };
