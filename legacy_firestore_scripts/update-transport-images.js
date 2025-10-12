#!/usr/bin/env node
// Archived copy of scripts/update-transport-images.js
const fs = require('fs');
const path = require('path');

const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';
const BASE_PATH = '/d6StarWars/starships';

async function updateImages() {
  // archived logic preserved
}

module.exports = { updateImages };
/* ARCHIVED COPY: update-transport-images.js */
('use strict');
const fs = require('fs');
const path = require('path');
const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';
const BASE_PATH = '/d6StarWars/starships';
const updateImages = async () => {
  const dataPath = path.resolve(
    __dirname,
    '..',
    'Source Data',
    'd6holocron',
    'starships',
    'transports-variants-import-ready.json'
  );
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Updating image URLs for ${data.starships.length} transports...`);
  let updated = 0;
  let skipped = 0;
  for (const ship of data.starships) {
    if (!ship.imageFilename) {
      skipped++;
      continue;
    }
    const slug = ship.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const localImageUrl = `${BASE_PATH}/${ship.imageFilename}`;
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/starships/${slug}?updateMask.fieldPaths=imageUrl&key=${API_KEY}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: { imageUrl: { stringValue: localImageUrl } },
          }),
        }
      );
      if (response.ok) {
        console.log(`\u2705 ${ship.name} -> ${localImageUrl}`);
        updated++;
      } else {
        const error = await response.json();
        console.error(`\u274c ${ship.name}: ${JSON.stringify(error)}`);
      }
    } catch (err) {
      console.error(`\u274c ${ship.name}: ${err.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log(
    `\nUpdate complete: ${updated} updated, ${skipped} skipped (no image)`
  );
};
updateImages().catch(console.error);
