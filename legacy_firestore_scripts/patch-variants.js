#!/usr/bin/env node
'use strict';

// ARCHIVED COPY: patch-variants.js
const fs = require('fs');
const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';
const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const patchVariants = async (jsonPath) => {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (!data.starships || !Array.isArray(data.starships))
    throw new Error('Invalid format: missing starships array');
  const variants = data.starships.filter((s) => s.isVariant && s.parent);
  console.log(`Patching ${variants.length} variants...`);
  let patched = 0;
  let failed = 0;
  for (const starship of variants) {
    const slug = slugify(starship.name);
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/starships/${slug}?updateMask.fieldPaths=parent&updateMask.fieldPaths=variantOf&updateMask.fieldPaths=isVariant&key=${API_KEY}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              parent: { stringValue: starship.parent },
              variantOf: { stringValue: starship.variantOf },
              isVariant: { booleanValue: true },
            },
          }),
        }
      );
      if (response.ok) {
        console.log(`\u2705 ${starship.name} (${slug})`);
        patched++;
      } else {
        const error = await response.text();
        console.error(`\u274c ${starship.name}: ${error}`);
        failed++;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`\u274c ${starship.name}: ${error.message}`);
      failed++;
    }
  }
  console.log(`\nPatch complete: ${patched} succeeded, ${failed} failed`);
};
const main = async () => {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Usage: node scripts/patch-variants.js <import-ready-json>');
    process.exit(1);
  }
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }
  await patchVariants(jsonPath);
};
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
