#!/usr/bin/env node
// Archived copy of scripts/replace-all-starships.js
const fs = require('fs');

const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toFirestoreValue = (value) => {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue),
      },
    };
  }
  if (typeof value === 'object') {
    const fields = {};
    for (const [key, val] of Object.entries(value)) {
      fields[key] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
};

async function replaceAllStarships(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(
    `Replacing ${data.starships.length} starships (using PUT to overwrite)...`
  );

  let replaced = 0;
  let failed = 0;

  for (const starship of data.starships) {
    const slug = slugify(starship.name);

    const firestoreDoc = {};
    for (const [key, value] of Object.entries(starship)) {
      firestoreDoc[key] = toFirestoreValue(value || '');
    }

    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/starships/${slug}?key=${API_KEY}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: firestoreDoc }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error(
          `❌ ${starship.name}:`,
          error.error?.message || JSON.stringify(error)
        );
        failed++;
      } else {
        replaced++;
        if (replaced % 20 === 0) {
          console.log(`✓ Replaced ${replaced}/${data.starships.length}...`);
        }
      }
    } catch (err) {
      console.error(`❌ ${starship.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Replace complete: ${replaced} succeeded, ${failed} failed`);
}

module.exports = { replaceAllStarships };
