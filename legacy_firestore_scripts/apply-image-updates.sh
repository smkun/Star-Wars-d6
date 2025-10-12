#!/bin/bash
# ARCHIVED COPY: apply-image-updates.sh
# Original archived for safety. To run intentionally, set EXPLICIT_FIRESTORE_ACK=1
if [ "$EXPLICIT_FIRESTORE_ACK" != "1" ]; then
  echo "This is a legacy Firestore script. Set EXPLICIT_FIRESTORE_ACK=1 to run. Aborting."
  exit 1
fi

# Original contents preserved below for audit. Run from this archive path only with explicit ACK.
cp firestore.rules firestore.rules.backup
cp firestore.rules.temp firestore.rules 2>/dev/null || cat > firestore.rules <<'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /species/{slug} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read: if false;
      allow write: if false;
    }
  }
}
EOF

firebase deploy --only firestore:rules

node -e "
const fs = require('fs');
const updates = JSON.parse(fs.readFileSync('image-updates.json', 'utf-8'));
const PROJECT_ID='star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';
async function updateDoc(update) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/species/${update.slug}?key=${API_KEY}&updateMask.fieldPaths=imageUrl&updateMask.fieldPaths=hasImage&updateMask.fieldPaths=imagePath`;
  const body = { fields: { imageUrl: { stringValue: update.imageUrl }, hasImage: { booleanValue: true }, imagePath: { stringValue: update.imagePath } } };
  const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return response.ok;
}
async function main() {
  let updated=0, failed=0;
  for (const update of updates) {
    process.stdout.write(`Updating ${update.slug}...\r`);
    const ok = await updateDoc(update);
    if (ok) updated++; else { console.log(`Failed: ${update.slug}`); failed++; }
    await new Promise(r=>setTimeout(r,100));
  }
  console.log(`Updated ${updated} species`);
  if (failed>0) console.log(`Failed ${failed} species`);
}
main();
"

mv firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules

echo "Done. Image URLs updated in Firestore (archived script)."
#!/bin/bash
# Archived: apply-image-updates.sh
echo "This script has been archived to legacy_firestore_scripts/apply-image-updates.sh"
echo "To run it intentionally set EXPLICIT_FIRESTORE_ACK=1 and run from the legacy folder."
exit 1
