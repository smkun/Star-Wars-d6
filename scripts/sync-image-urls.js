#!/usr/bin/env node
/**
 * Sync imageUrl fields in Firestore based on files in web/public/aliens/
 * Uses Firebase Admin SDK (no auth issues)
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

  console.log(`🖼️  Found ${images.length} WebP images in web/public/aliens/\n`);

  // Get all species from Firestore
  const snapshot = await db.collection('species').get();

  console.log(`📄 Found ${snapshot.size} species documents in Firestore\n`);

  const batch = db.batch();
  let updated = 0;
  let noImage = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const slug = doc.id;

    if (imageMap.has(slug)) {
      const imageFile = imageMap.get(slug);
      const currentUrl = data.imageUrl || '';

      // Update if different or empty
      if (currentUrl !== imageFile) {
        console.log(`✏️  ${data.name || slug}: ${imageFile}`);
        batch.update(doc.ref, {
          imageUrl: imageFile,
          hasImage: true,
          imagePath: `aliens/${imageFile}`,
        });
        updated++;
      }
    } else {
      if (data.imageUrl) {
        console.log(`⚠️  ${data.name || slug}: Has imageUrl but no file found`);
      }
      noImage++;
    }
  });

  if (updated > 0) {
    console.log(`\n💾 Committing ${updated} updates to Firestore...`);
    await batch.commit();
    console.log(`✅ Successfully updated ${updated} species documents`);
  } else {
    console.log(`\n✅ All ${snapshot.size} species already have correct imageUrl`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total images: ${images.length}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   No image available: ${noImage}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
