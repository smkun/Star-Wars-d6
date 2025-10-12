#!/usr/bin/env node
'use strict';

// ARCHIVED COPY: update-image-urls.js
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'star-wars-d6-species' });
const db = admin.firestore();
const IMAGES_DIR = path.resolve(__dirname, '..', 'web', 'public', 'aliens');
async function main() {
  const images = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith('.webp'));
  const imageMap = new Map(
    images.map((img) => [path.basename(img, '.webp'), img])
  );
  console.log(`Found ${images.length} WebP images\n`);
  const snapshot = await db.collection('species').get();
  const batch = db.batch();
  let updated = 0,
    skipped = 0;
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const slug = doc.id;
    if (imageMap.has(slug)) {
      const imageUrl = imageMap.get(slug);
      if (data.imageUrl !== imageUrl) {
        console.log(`\u270f\ufe0f  ${data.name}: ${imageUrl}`);
        batch.update(doc.ref, {
          imageUrl: imageUrl,
          hasImage: true,
          imagePath: `aliens/${imageUrl}`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      if (data.hasImage) {
        console.log(
          `\u26a0\ufe0f  ${data.name}: Marked as has image but no file found`
        );
      }
      skipped++;
    }
  });
  if (updated > 0) {
    console.log(`\nCommitting ${updated} updates...`);
    await batch.commit();
    console.log(`Updated ${updated} species documents`);
  } else {
    console.log(`\nAll images already up to date (${skipped} species)`);
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
