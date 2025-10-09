#!/usr/bin/env node
const fs = require('fs');

const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = 'AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww';

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Convert JavaScript object to Firestore REST API format
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

const replaceAllStarships = async (jsonPath) => {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`Replacing ${data.starships.length} starships (using PUT to overwrite)...`);

  let replaced = 0;
  let failed = 0;

  for (const starship of data.starships) {
    const slug = slugify(starship.name);

    // Convert entire starship object to Firestore format
    const firestoreDoc = {};
    for (const [key, value] of Object.entries(starship)) {
      firestoreDoc[key] = toFirestoreValue(value || '');
    }

    try {
      // Use PUT to completely replace document (creates if doesn't exist)
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
        console.error(`❌ ${starship.name}:`, error.error?.message || JSON.stringify(error));
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
};

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: node replace-all-starships.js <import-ready-json>');
  process.exit(1);
}

replaceAllStarships(jsonPath).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
