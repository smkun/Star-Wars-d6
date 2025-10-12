#!/usr/bin/env node
/**
 * Archived copy of scripts/update-images-rest.js
 * To run intentionally: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/update-images-rest.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_KEY = process.env.FIRESTORE_API_KEY || '';
const PROJECT_ID = process.env.FIREBASE_PROJECT || 'star-wars-d6-species';
const IMAGES_DIR = path.resolve(__dirname, '..', 'web', 'public', 'aliens');

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: value.toString() }
      : { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  throw new Error(`Unsupported type: ${typeof value}`);
}

async function getSpeciesDoc(slug) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/species/${slug}?key=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

async function updateSpeciesDoc(slug, updates) {
  const fields = {};
  for (const [key, value] of Object.entries(updates)) {
    fields[key] = toFirestoreValue(value);
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/species/${slug}?key=${API_KEY}&updateMask.fieldPaths=${Object.keys(updates).join('&updateMask.fieldPaths=')}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  return response.ok;
}

async function main() {
  const images = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
  console.log(`🖼️  Found ${images.length} WebP images\n`);

  let updated = 0;
  let failed = 0;

  for (const imageFile of images) {
    const slug = path.basename(imageFile, '.webp');
    const doc = await getSpeciesDoc(slug);
    if (!doc) {
      console.log(`⏭️  ${slug}: Not found in Firestore`);
      continue;
    }

    const currentImageUrl = doc.fields?.imageUrl?.stringValue || '';
    if (currentImageUrl === imageFile) continue;

    process.stdout.write(`✏️  ${slug}: ${imageFile}...`);

    const success = await updateSpeciesDoc(slug, {
      imageUrl: imageFile,
      hasImage: true,
      imagePath: `aliens/${imageFile}`,
    });

    if (success) {
      console.log(` ✅`);
      updated++;
    } else {
      console.log(` ❌`);
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total images: ${images.length}`);
}

if (require.main === module) {
  if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
    console.error('\nThis script has been archived to legacy_firestore_scripts/update-images-rest.js');
    console.error('To run intentionally set EXPLICIT_FIRESTORE_ACK=1 and run from the legacy folder.');
    process.exit(1);
  }
  main().catch(console.error);
}

module.exports = { main };
#!/usr/bin/env node
// Archived copy of scripts/update-images-rest.js
// Original moved during the Firestore purge. Run intentionally from the legacy folder.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_KEY = process.env.FIRESTORE_API_KEY || '';
const PROJECT_ID = 'star-wars-d6-species';
const IMAGES_DIR = path.resolve(__dirname, '..', 'web', 'public', 'aliens');

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: value.toString() }
      : { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  throw new Error(`Unsupported type: ${typeof value}`);
}

async function getSpeciesDoc(slug) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/species/${slug}?key=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

async function updateSpeciesDoc(slug, updates) {
  const fields = {};
  for (const [key, value] of Object.entries(updates)) {
    fields[key] = toFirestoreValue(value);
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/species/${slug}?key=${API_KEY}&updateMask.fieldPaths=${Object.keys(updates).join('&updateMask.fieldPaths=')}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  return response.ok;
}

async function main() {
  const images = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith('.webp'));
  console.log(`🖼️  Found ${images.length} WebP images\n`);

  let updated = 0;
  let failed = 0;

  for (const imageFile of images) {
    const slug = path.basename(imageFile, '.webp');

    const doc = await getSpeciesDoc(slug);
    if (!doc) {
      console.log(`⏭️  ${slug}: Not found in Firestore`);
      continue;
    }

    const currentImageUrl = doc.fields?.imageUrl?.stringValue || '';

    if (currentImageUrl === imageFile) continue;

    process.stdout.write(`✏️  ${slug}: ${imageFile}...`);

    const success = await updateSpeciesDoc(slug, {
      imageUrl: imageFile,
      hasImage: true,
      imagePath: `aliens/${imageFile}`,
    });

    if (success) {
      console.log(` ✅`);
      updated++;
    } else {
      console.log(` ❌`);
      failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total images: ${images.length}`);
}

main().catch(console.error);
