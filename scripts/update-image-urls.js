#!/usr/bin/env node
/**
 * Update Firestore species documents with imageUrl for downloaded images
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'star-wars-d6-species',
});

const db = admin.firestore();
const IMAGES_DIR = path.resolve(__dirname, '..', 'web', 'public', 'aliens');

async function main() {
  // Get all WebP images
  const images = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
  const imageMap = new Map(images.map(img => [path.basename(img, '.webp'), img]));

  console.log(`🖼️  Found ${images.length} WebP images\n`);

  // Get all species from Firestore
  const snapshot = await db.collection('species').get();
  const batch = db.batch();

  let updated = 0;
  let skipped = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const slug = doc.id;

    // Check if we have an image for this species
    if (imageMap.has(slug)) {
      const imageUrl = imageMap.get(slug);

      // Only update if imageUrl is different
      if (data.imageUrl !== imageUrl) {
        console.log(`✏️  ${data.name}: ${imageUrl}`);
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
      // No image available
      if (data.hasImage) {
        console.log(`⚠️  ${data.name}: Marked as has image but no file found`);
      }
      skipped++;
    }
  });

  if (updated > 0) {
    console.log(`\n💾 Committing ${updated} updates...`);
    await batch.commit();
    console.log(`✅ Updated ${updated} species documents`);
  } else {
    console.log(`\n✅ All images already up to date (${skipped} species)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
