#!/usr/bin/env node
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize using environment variable for service account
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

admin.initializeApp({
  projectId: 'star-wars-d6-species',
});

const db = admin.firestore();

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const updateAllStarships = async (jsonPath) => {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`Updating ${data.starships.length} starships directly in Firestore...`);

  let updated = 0;
  let failed = 0;

  for (const starship of data.starships) {
    const slug = slugify(starship.name);

    try {
      // Use set with merge:false to completely replace document
      await db.collection('starships').doc(slug).set(starship);
      updated++;
      if (updated % 20 === 0) {
        console.log(`✓ Updated ${updated}/${data.starships.length}...`);
      }
    } catch (err) {
      console.error(`❌ ${starship.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Update complete: ${updated} succeeded, ${failed} failed`);
  process.exit(0);
};

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json node update-firestore-direct.js <import-ready-json>');
  process.exit(1);
}

updateAllStarships(jsonPath).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
