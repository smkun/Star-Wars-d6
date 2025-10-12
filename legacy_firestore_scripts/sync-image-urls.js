#!/usr/bin/env node
/**
 * Archived copy of scripts/sync-image-urls.js
 * This file was moved to `legacy_firestore_scripts/` during the aggressive Firestore purge.
 * To run intentionally: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/sync-image-urls.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'star-wars-d6-species' });
const db = admin.firestore();
const IMAGES_DIR = path.resolve(__dirname, '..', 'web', 'public', 'aliens');

async function main() {
  const images = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
  const imageMap = new Map(images.map(img => [path.basename(img, '.webp'), img]));

  console.log(`🖼️  Found ${images.length} WebP images in web/public/aliens/\n`);

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
      if (currentUrl !== imageFile) {
        const ref = db.collection('species').doc(slug);
        batch.update(ref, { imageUrl: imageFile, hasImage: true, imagePath: `aliens/${imageFile}`, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        updated++;
      }
    } else {
      noImage++;
    }
  });

  if (updated > 0) {
    console.log(`Writing ${updated} updates to Firestore`);
    await batch.commit();
  }

  console.log(`\nDone. Updated: ${updated}, No image: ${noImage}`);
}

if (require.main === module) {
  if (process.env.EXPLICIT_FIRESTORE_ACK !== '1') {
    console.error('\nThis script has been archived to legacy_firestore_scripts/sync-image-urls.js.');
    console.error('To run it intentionally set EXPLICIT_FIRESTORE_ACK=1 and run from the legacy folder.\n');
    process.exit(1);
  }
  main().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { main };
#!/usr/bin/env node
// Archived copy of scripts/sync-image-urls.js
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'star-wars-d6-species' });
const db = admin.firestore();

module.exports = { db };
#!/usr/bin/env node
// Archived: sync-image-urls.js
console.error(
  '\nThis script has been archived to legacy_firestore_scripts/sync-image-urls.js.'
);
console.error(
  'To run it intentionally set EXPLICIT_FIRESTORE_ACK=1 and run from the legacy folder.\n'
);
process.exit(1);
