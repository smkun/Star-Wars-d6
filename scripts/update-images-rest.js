#!/usr/bin/env node
/**
 * Update Firestore imageUrl fields using REST API (no auth needed with temp open rules)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_KEY = 'AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww';
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
  // Get all WebP images
  const images = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
  console.log(`🖼️  Found ${images.length} WebP images\n`);

  let updated = 0;
  let failed = 0;

  for (const imageFile of images) {
    const slug = path.basename(imageFile, '.webp');

    // Check if species exists
    const doc = await getSpeciesDoc(slug);
    if (!doc) {
      console.log(`⏭️  ${slug}: Not found in Firestore`);
      continue;
    }

    const currentImageUrl = doc.fields?.imageUrl?.stringValue || '';

    // Skip if already set correctly
    if (currentImageUrl === imageFile) {
      continue;
    }

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

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total images: ${images.length}`);
}

main().catch(console.error);
